# ADR 0011: La silueta del salón se sirve como SVG, con gate propio en public/

## Estado

Reemplazado por [ADR 0012](0012-ilustracion-de-portada.md), que retira la
silueta del sitio. Lo que sigue queda como registro de la decisión de su
momento.

## Contexto

`public/silueta-salon.png` pesaba 474 KB — el archivo más pesado que servía el
sitio, y sin margen para gzip: llegaba comprimido, así que viajaba prácticamente
entero (469 KB) en toda página que no fuera un detalle de historia
(`BaseLayout.astro` lo incluye vía `SiluetaSalon.astro`).

Se dispuso de un SVG del mismo dibujo. El reemplazo no era copiar y renombrar:
el SVG traía casi la mitad del lienzo vacía por arriba del dibujo, y el
`aspect-ratio` que el componente declaraba para el PNG (`2172 / 724`, proporción
3) nunca coincidió con las dimensiones reales del PNG (`2149 × 395`, proporción
5.44) — un descuadre silencioso que llevaba años dibujando la silueta al 55.1 %
del alto que `--alto-silueta-salon` declaraba, sin que nada lo señalara.

## Decisión

### 1. Sigue siendo una máscara CSS, no un `<img>`

`SiluetaSalon.astro` no cambió de mecanismo: el SVG se referencia con
`mask-image` sobre `--color-texto`, igual que el PNG. Esto es lo que permite
recolorear la silueta por tema desde una sola fuente sin mantener una versión
por tema. `mask-image` cae bajo `img-src 'self'` en la CSP
([ADR 0004](0004-triaje-reportes-seguridad-github-pages.md)), que ya lo
permitía — no hizo falta tocar la CSP. El color del SVG (`fill="#1E2328"`) es
irrelevante: la máscara consume el canal alfa, no el color.

### 2. El `viewBox` se recorta al dibujo, verificado por comparación de píxeles

El SVG original declaraba `viewBox="0 0 2172 724"`, pero la tinta solo ocupa
`x 24–2152, y 322–700`. Se recortó a `viewBox="24 322 2128 378"` con
`width="2128" height="378"` en el elemento raíz — una edición del atributo del
lienzo, no de los `path` del dibujo, así que el contenido queda intacto por
construcción.

La fidelidad del recorte no se aceptó a ojo. Se armó una comparación de
píxeles (Chrome headless para rasterizar, Python con PIL/numpy para comparar)
que rasteriza el SVG, binariza el canal alfa de ambos archivos, recorta cada
uno a su *bounding box* de tinta, escala cada uno de forma uniforme (sin
distorsionar su proporción) y calcula el IoU (intersección sobre unión) del
área rellena.

**Hallazgo:** el SVG no es una traza exacta del PNG — es un redibujo
independiente, con espaciado ligeramente distinto entre personajes en varios
puntos de la fila (visible comparando las dos siluetas recortadas lado a lado).
El IoU medido fue **~62 %**, muy por debajo de un umbral de conversión fiel.
Se descartaron dos hipótesis técnicas antes de esa conclusión (estiramiento por
forzar la proporción del candidato a la de la referencia; ringing del
reescalado) — el número no se movió con ninguna corrección, y la inspección
visual confirmó que es una diferencia real de trazado, no un artefacto de
medición.

**Decisión tomada con esa información a la vista:** usar el SVG de todas
formas. Visualmente es el mismo dibujo — mismos nueve personajes, mismas
poses — y la diferencia solo se nota comparando píxel a píxel, no a simple
vista. El ahorro de peso (ver más abajo) se juzgó más valioso que una
fidelidad de trazo que nadie iba a percibir.

### 3. `--alto-silueta-salon` se corrigió, no solo se migró

Corregir el `aspect-ratio` del componente a la proporción real del SVG
recortado (`2128 / 378`) elimina el descuadre de origen, pero cambia lo que
`mask-size: contain` hace con la caja: como ahora la proporción de la caja
coincide exactamente con la del contenido, ya no hay letterboxing. El token
tenía que corregirse en dos frentes distintos para no cambiar el tamaño en
pantalla:

- Los términos de alto (`16rem`, `25dvh`) se escalaron por 0.5514 —el factor
  exacto del descuadre histórico— para que la silueta siga viéndose del mismo
  tamaño que con el PNG.
- El término de ancho (`100vw / 3` → `100vw / 5.6296`) tuvo que pasar a usar la
  proporción de la **caja nueva** (la del SVG, 5.63), no la proporción real del
  PNG (5.44) que se usó por un momento durante el desarrollo de este cambio y
  que producía una silueta ~3.5 % más ancha que el viewport en pantallas
  angostas — detectado verificando en el navegador a 375px de ancho, no
  asumido.

El resultado, verificado en Chrome a 1280px y a 375px, en tema claro y oscuro:
la silueta ocupa el mismo alto que antes en cada punto de ruptura, y no
desborda el viewport en móvil.

### 4. Gate de build para SVG ejecutable en `public/`

Es el primer SVG que se sirve tal cual desde `public/`. `public/_headers`
—donde vive la CSP para archivos estáticos— no se aplica en GitHub Pages, así
que navegar directo a `/silueta-salon.svg` ahí lo abre como documento sin CSP
alguna; un `<script>` adentro correría en el origen del sitio. En Netlify sí lo
frena `script-src 'none'`, pero el gate no depende del destino de despliegue.

`src/lib/assets/public-svg-gate.ts` + `public-svg-gate-integration.ts`
extienden el triaje de [ADR 0004](0004-triaje-reportes-seguridad-github-pages.md)
con el mismo patrón que `noRawHtml`, `storyAssetFolders` y `brandSymbol`: un
hook `astro:config:setup` que falla el build si algún `.svg` de `public/` trae
`<script>`, manejador de evento, `foreignObject` o referencia externa
(`href`/`xlink:href` que no sea `#...`).

Deliberadamente **no** reusa las otras dos reglas de
`src/lib/brand/symbol-gate.ts` (el gate del símbolo de marca, que sí se inyecta
con `set:html`): no exige `currentColor` (el color de una máscara es
irrelevante) ni prohíbe `<style>` (un SVG servido como archivo aparte no
inyecta su hoja de estilos en el documento que lo consume). Verificado con una
prueba manual: se insertó un `<script>` en `public/silueta-salon.svg` y
`pnpm build` falló con el mensaje del gate; revertido después.

## Consecuencias

- El SVG optimizado con SVGO (`--multipass`) pesa 32 KB crudos / 5.5 KB gzip,
  frente a 474 KB / ~469 KB gzip del PNG — el archivo más pesado del sitio deja
  de serlo. La versión optimizada se comparó contra el PNG original con la
  misma métrica de IoU que la versión sin optimizar antes de aceptarla: el
  número no cambió, así que SVGO no introdujo una segunda distorsión sobre la
  ya aceptada en el punto 2.
- El SVG del dibujo no es trazable 1:1 al PNG histórico. Si en el futuro se
  necesita fidelidad exacta con el PNG original (por ejemplo, para producir
  variantes derivadas), hay que vectorizarlo desde el PNG, no partir de este
  archivo.
- `tests/silueta-salon.spec.ts` cubre que la máscara apunta al `.svg` y no al
  `.png`; la proporción declarada en el `<style>` del componente vive en una
  hoja aparte que la Container API no expone en `renderToString` (limitación
  ya documentada en `CLAUDE.md`), así que no es observable desde ese test — se
  verificó a mano en navegador.
- `tests/public-svg-gate.spec.ts` cubre el gate nuevo con el mismo patrón que
  `tests/symbol-gate.spec.ts`.
