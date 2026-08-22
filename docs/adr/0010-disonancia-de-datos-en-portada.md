# ADR 0010: La portada abre con una disonancia de datos verificable

## Estado

Aceptado

## Contexto

La portada abría con el título del sitio y, debajo, la promesa: «Detrás de cada
cifra sobre educación hay una persona con nombre…». Quien llegaba por primera
vez no tenía ninguna razón para creer que el asunto le concierne: la promesa se
enunciaba sin haber generado antes ninguna tensión.

El [issue #37 de gestión de producto](https://github.com/mistorias/mistorias-gestion-de-producto/issues/37)
pide anteponerle una **disonancia basada en datos** —la técnica que describe
[Design with Dissonance](https://www.smashingmagazine.com/2011/10/design-with-dissonance/)—
con tres condiciones: que los datos sean reales y actuales, que quien lee pueda
**verificarlos mediante un enlace**, y que el golpe llegue en unos tres segundos.

La tercera condición choca con la segunda. Dos enlaces de fuente escritos dentro
del texto lo ensucian y le quitan el filo justo a la frase que tiene que golpear;
esconderlos del todo traiciona el principio de transparencia de la marca
(«cada fuente se enlaza, se dice qué es»). Hay que mostrarlos, pero a pedido.

Restricción que decide casi todo lo demás: **`script-src 'none'`**
([ADR 0004](0004-triaje-reportes-seguridad-github-pages.md)). El sitio no envía
JavaScript, así que el mecanismo de «a pedido» tiene que ser HTML y CSS.

## Decisión

### 1. El orden es disonancia → giro → promesa

`src/pages/index.astro` abre con dos cifras que incomodan, sigue con la frase que
las vuelve personales («es el país que mañana te atenderá») y recién ahí promete.
Cada bloque baja un escalón de la escala tipográfica, así que la página se lee en
diagonal sin que ninguna parte compita con otra:

| Bloque | Tamaño | Color |
|---|---|---|
| `h1` | `--paso-3` | `--color-texto` |
| Disonancia (dos afirmaciones) | `--paso-1` | `--color-texto`, cifra en `--color-acento` |
| Giro | `--paso-1` | `--color-analitico` |
| Promesa | `--paso-0` | `--color-texto`, los tres verbos en `--color-analitico` |

El `h1` **no** cede su tamaño. Es lo que nombra al sitio y lo que sostiene el
SEO; la disonancia entra debajo y a menor escala, y aun así golpea porque es lo
único con color de acento en toda la franja. Se resaltan dos cosas y nada más:
las dos cifras, y los tres verbos de la secuencia de marca SIENTE → ENTIENDE →
ACTÚA (`adéntrate`, `entiende`, `convierte`). Resaltar más sería no resaltar.

Entre el giro y la promesa va una regla de `3rem` en `--color-vivo`. Marca el
cambio de tono —de lo que duele a lo que se puede hacer— y puede usar ese color
porque es decoración y no texto ([ADR 0006](0006-sistema-de-diseno-del-sitio.md) §2).

### 2. Cada afirmación es un `<details>` nativo, no un componente con estado

`src/components/DatoConFuente.astro` envuelve la afirmación en
`details > summary + p`: el `summary` es la frase completa y el `p` que le sigue
trae el enlace a la fuente y el dato que permite comprobarla.

El navegador ya sabe hacer todo lo que esto necesita: abrir y cerrar, anunciarlo
como plegable con su `aria-expanded`, y responder a Enter y a Espacio. No hace
falta un solo byte de JavaScript, que además la CSP no permitiría.

El atributo `name` compartido convierte a las dos afirmaciones en un acordeón
exclusivo: abrir una cierra la otra, y nunca hay dos fuentes desplegadas
compitiendo por la atención.

### 3. En escritorio abre el chip «fuente»; en táctil, la frase entera

La marca visual de que hay algo que abrir es un chip pequeño con la palabra
«fuente», detrás de la frase. Está `aria-hidden` porque el `summary` ya se
anuncia como plegable: para quien usa lector de pantalla, repetirlo sería ruido.

```css
@media (hover: hover) {
  .dato:has(.dato__pista:hover)::details-content { content-visibility: visible; }
}
```

El disparador del hover es **el chip y no la frase**. Si bastara con pasar por
encima del texto, la fuente se abriría sola mientras se lee y la página saltaría
a cada rato; apuntar al chip es una intención, no un accidente. La consulta
`hover: hover` es la misma que ya usa `base.css`: en táctil un hover se queda
pegado después del toque. Ahí manda el toque sobre la frase completa, que es un
blanco mucho más grande, y el segundo toque la cierra.

Donde `::details-content` no exista, la regla no aplica y la fuente se sigue
abriendo con clic, con toque o con Enter. Se pierde una comodidad, nunca el
acceso al dato.

### 4. La fuente empuja el contenido; no flota por encima

Primero se probó flotar la tarjeta con `position: absolute` para que abrirla no
moviera nada. En celular quedaba **encima de la afirmación siguiente**: le tapaba
el texto y le interceptaba los toques, así que el segundo dato dejaba de poder
abrirse. Se descartó por eso.

Abrir dentro del flujo empuja lo que viene abajo, que es lo que hace cualquier
plegable y lo único que no rompe al vecino. El `summary` no se mueve, así que el
puntero nunca queda fuera de su propio disparador.

## Consecuencias

- La portada es más larga: la historia destacada baja. Es el precio de que la
  promesa llegue después de una razón para escucharla.
- **Punto de mantenimiento**: las dos cifras son de PISA 2022 y están fijas en
  el texto. Cuando la OCDE publique el siguiente ciclo hay que revisarlas en
  `index.astro`, donde la constante `CICLO_DE_LOS_DATOS` deja esa dependencia a
  la vista. El propio issue lo asume como el precio de usar datos duros.
- `DatoConFuente.astro` sirve para cualquier afirmación con dato duro, no solo
  para la portada.
- El hover y el toque no se pueden probar con la Container API, que renderiza en
  Node: `tests/dato-con-fuente.spec.ts` cubre la estructura del marcado y el
  comportamiento se verificó en Chromium a 1280×900 y 390×844, en tema claro y
  oscuro, con puntero y con toque, y con teclado.
