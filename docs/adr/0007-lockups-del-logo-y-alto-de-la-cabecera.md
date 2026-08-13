# ADR 0007: Lockups del logo y presupuesto vertical de la cabecera

## Estado

Aceptado

## Contexto

Al implementar el sistema de diseño ([#15](https://github.com/mistorias/mistorias-gestion-de-producto/issues/15),
[ADR 0006](0006-sistema-de-diseno-del-sitio.md)) la cabecera quedó con la palabra
**Mistorias** compuesta en IBM Plex Sans, sin logo, porque no existía archivo de
logo. Después aparecieron seis variantes de lockup **apilado** (palabra arriba,
tres caminos ascendentes debajo), planteadas en el
[issue #30](https://github.com/mistorias/mistorias-gestion-de-producto/issues/30).

Medido sobre esas variantes: relación de aspecto 1.69:1–1.89:1 (ancho:alto), y
dentro de esa caja la palabra ocupa solo ~26% de la altura total, las pistas
~43%. Para que la palabra se lea al tamaño que tenía en la cabecera (~24px), el
lockup completo necesita ~85-90px de alto, y la cabecera pasaría de **75px a
~120px**. El caso que decide es el celular horizontal (~390px de alto de
ventana): el lockup apilado se comería casi un tercio de la pantalla antes de
la primera palabra de contenido.

El issue pide decidir la forma del logo antes de integrarlo, y deja abierta
además una segunda pregunta: la palabra del logo es serif, y la cabecera usa
sans — ¿ese cambio de voz tipográfica es una decisión o una consecuencia?

## Decisión

### 1. Un solo componente, tres disposiciones según el espacio disponible

En vez de fabricar dos lockups estáticos (uno horizontal para la cabecera, uno
apilado para el resto, como proponía el issue), el logotipo es **un componente
que se adapta al espacio real de su contenedor**:

| Condición | Disposición | Por qué |
|---|---|---|
| Pantalla vertical (por defecto) | Apilado: palabra arriba, símbolo debajo | Hay alto de sobra |
| `max-height: 30rem` (celular horizontal) | Fila: símbolo a la izquierda, palabra a la derecha | Sin esto la cabecera crecería a ~120px |
| `max-height: 30rem` y además `max-width: 26rem` | Solo el símbolo | Tampoco hay ancho para la palabra en fila |

Se implementa con `max-height`, no con `orientation`: el ADR 0006 §6 ya fija ese
criterio para todo el sitio ("la orientación es un indicio; la altura es la
restricción real"), y la media query ya existía en `base.css` para el mismo
caso límite. En el tercer estado la palabra **no sale del DOM** — se oculta
visualmente (técnica *sr-only*, no `display: none`) para que el enlace de la
cabecera conserve su nombre accesible.

Esto reemplaza la necesidad de dos archivos de lockup: `LogotipoMistorias.astro`
compone símbolo + palabra con CSS, así que la disposición es una propiedad, no
un archivo distinto.

### 2. La palabra es texto vivo en Lora 600, no trazos dentro del SVG

Cierra la "decisión pendiente" del issue: la marca en pantalla pasa de IBM Plex
Sans a `var(--fuente-narrativa)` (Lora), peso 600 — el mismo par que ya usan
`h2`/`h3` en `base.css`, y el peso que la identidad visual nombra para Lora.
IBM Plex Sans sigue en la navegación, los `h1` y los metadatos.

Que la palabra sea texto y no trazos dentro del archivo trae dos beneficios
directos:

- El enlace de la cabecera tiene nombre accesible real, sin necesitar `<title>`
  ni `alt` (requisito 3 del issue).
- El mismo componente puede mostrarse sin la palabra (el pie, ver §5) sin
  necesitar un segundo archivo recortado.

### 3. El símbolo se redibujó; no existe un vector original

Los seis adjuntos del issue son raster (PNG) y no eran accesibles desde el
entorno de desarrollo (403 a través del proxy de la sesión de trabajo; el
usuario los compartió directamente). El issue permite modificar los logos, así
que el símbolo —tres caminos ascendentes con tres marcas de carril cada uno— se
redibujó como geometría vectorial: un camino central recto en perspectiva y dos
laterales con curvas Bézier simétricas, comparado visualmente contra las
referencias hasta calzar.

Las marcas de carril son **huecos**, no formas blancas (se ve en la variante
blanca sobre fondo oscuro, donde dejan pasar el fondo). Se modelan como
sustracciones con `fill-rule="evenodd"` dentro del mismo `<path>`.

### 4. Un solo archivo, monocromático, `currentColor`

`src/assets/marca/simbolo-mistorias.svg` no lleva ningún color fijo: todo el
dibujo usa `fill="currentColor"` en la raíz, sin rectángulo de fondo. El
símbolo se inyecta **en línea** (`?raw` + `set:html`), no como `<img>`, porque
`currentColor` solo hereda del CSS circundante dentro del documento.

`LogotipoMistorias.astro` fija `color: var(--color-acento)` una sola vez y
tanto el símbolo (por `currentColor`) como la palabra (`color: currentColor`)
lo heredan — símbolo y texto son siempre del mismo color, y el modo oscuro
(`#8B0F0F` → `#F08C7F`, ya definido en `tokens.css`) funciona solo, sin un
segundo archivo que mantener sincronizado. Es exactamente el requisito 1 del
issue, y la razón por la que las marcas de carril tenían que ser huecos: un
color sólido de relleno no puede, a la vez, dejar pasar el fondo.

### 5. `font-size` es la única perilla de tamaño

En vez de una prop de tamaño o una variable CSS dedicada, el componente usa
`font-size: 1em` tanto para la altura del símbolo como para el tamaño de la
palabra. Quien lo usa fija el `font-size` de su propio contenedor, y ambas
piezas escalan juntas:

| Sitio de uso | `font-size` | Por qué |
|---|---|---|
| Cabecera, pantalla vertical | `var(--paso-1)` | El tamaño que ya tenía la palabra sola |
| Cabecera, `max-height: 30rem` | `var(--paso-0)` | Un paso menos, para no exceder el blanco de toque de 44px del enlace de navegación |
| Franja de portada | `var(--paso-3)` | Escala de un `h1`, es la pieza más prominente de la página |
| Pie (solo símbolo) | `var(--paso--1)` | El paso más chico de la escala — "muy pequeño", marca de agua |

Todos son tokens existentes de `tokens.css`, ya `clamp()` con sumando en `rem`
(ADR 0006 §6: una fórmula solo con `vw` rompe el zoom). No se inventó ningún
valor nuevo: cada contenedor reutiliza el paso de la escala que ya describía su
prominencia relativa.

### 6. El pie muestra el símbolo solo

El símbolo sin la palabra, muy pequeño, junto a la nota de transparencia del
pie. Ahí sí es la única pista de la marca, así que necesita nombre accesible
explícito (`titulo="Logo de Mistorias"` → `role="img"` + `aria-label`). En la
cabecera, en cambio, el símbolo queda `aria-hidden`: la palabra al lado ya
nombra la marca, y anunciarla dos veces sería peor que una vez.

### 7. Se resuelve todo lo que se puede en `mistorias-web`

Los archivos —símbolo, componentes, integración de build— viven en este
repositorio. Versionar el SVG en `mistorias-esencia-de-marca` y documentar los
lockups en `identidad-visual.md` queda pendiente allá, igual que los tintes del
modo oscuro que el ADR 0006 ya dejó como fuente de verdad provisional en este
repositorio.

### 8. Gate de build para el símbolo

`src/lib/marca/simbolo-gate.ts` + `simbolo-gate-integration.ts`, registrado en
`astro.config.mjs` junto a `noRawHtml()` y `storyAssetFolders()`. Mismo patrón:
una función pura que valida, colgada del hook `astro:config:setup` para correr
en `astro dev` y `astro build` por igual. Rechaza cualquier `fill`/`stroke` que
no sea `currentColor`/`none`/`inherit` (si el símbolo 4 se rompe, el build no
llega a producción) y cualquier `<script>`, manejador de evento,
`foreignObject` o referencia externa — el SVG se inyecta con `set:html`, así
que su contenido es código, no solo marcado de dibujo.

## Medición final

Los cinco viewports del issue, con la implementación real (Playwright, ambos
temas — el color no cambia el layout):

| Viewport | Alto de ventana | Cabecera antes | Con el logotipo adaptable |
|---|---|---|---|
| Celular vertical | 812 | 75px — 9.2% | 80px — 9.9% |
| **Celular horizontal** | **390** | 75px — 19.2% | **77px — 19.7%** |
| Tableta vertical | 1180 | 75px — 6.4% | 86px — 7.3% |
| Tableta horizontal | 820 | 75px — 9.1% | 89px — 10.8% |
| Escritorio | 900 | 75px — 8.3% | 89px — 9.8% |

El caso que decidía el issue —celular horizontal— se queda prácticamente donde
estaba (75px → 77px), muy lejos de los 120px que costaba el lockup apilado
único. El resto de los viewports gana el logo completo a cambio de 5-14px, no
de los ~45px que costaba la alternativa apilada-siempre.

## Consecuencias

### Positivas

- Ningún viewport paga el costo de ~120px que motivó el issue; el caso límite
  (celular horizontal) queda prácticamente sin cambio.
- Un componente cubre los tres contextos (cabecera, franja, pie) en vez de dos
  archivos de lockup a mantener sincronizados.
- El modo oscuro es gratis: no hay una segunda versión del símbolo, por
  `currentColor` y el gate que lo hace cumplir en build.
- La palabra nunca deja de ser texto real: el enlace de la cabecera tiene
  nombre accesible en los tres estados, sin `<title>` ni `alt`.

### Costos

- El símbolo es un redibujo, no el archivo original de marca: si
  `mistorias-esencia-de-marca` publica un SVG oficial más adelante, este
  archivo se reemplaza — es un cambio de un solo archivo, sin tocar los
  componentes que lo consumen.
- Los archivos viven en `mistorias-web` en vez de en el repositorio de marca;
  promoverlos allá y documentarlos en `identidad-visual.md` queda pendiente.
- La verificación visual de los cinco viewports es manual (Playwright fuera
  del repositorio), como ya señalaba el ADR 0006.

## Riesgos abiertos

- **El símbolo no tiene una versión simplificada para tamaños muy pequeños.**
  A `--paso--1` (el uso del pie) las marcas de carril son unos pocos píxeles;
  siguen siendo reconocibles pero no nítidas. Si el pie necesitara un símbolo
  aún más chico, valdría la pena una variante con menos detalle en vez de
  seguir reduciendo el mismo archivo.
