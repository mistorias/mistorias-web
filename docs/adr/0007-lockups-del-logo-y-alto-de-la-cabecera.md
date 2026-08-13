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
- El nombre de marca puede reutilizarse como texto plano en otros lugares (el
  pie, ver §6) sin depender de ningún archivo de imagen.

### 3. El símbolo se adaptó de una referencia interna; no existe un vector oficial

Los seis adjuntos del issue son raster (PNG) y no eran accesibles desde el
entorno de desarrollo (403 a través del proxy de la sesión de trabajo; el
usuario los compartió directamente). La primera vuelta de este ADR redibujó el
símbolo a mano contra esas referencias. Una segunda vuelta lo reemplazó por la
geometría de `src/road-mark.svg` (rama `chore/imagenes-fuente` de este mismo
repositorio), que se parece más a las imágenes originales: curvas más
naturales en los caminos laterales y marcas de carril mejor distribuidas.

Ese archivo de origen no era directamente usable: fijaba el color con un
`<style>` incrustado (`color: #8d2c2e; fill: currentColor;`). Adentro de esa
misma regla, `currentColor` resuelve contra el `color` que la regla acaba de
fijar, no contra el heredado del documento que inyecta el símbolo — confirmado
por render, en fondo oscuro el símbolo se quedaba en rojo vino en vez de
aclarar. Se tomó solo la **geometría** (tres `<path>` con
`fill-rule="evenodd"` para los huecos de las marcas de carril) y se descartó
el `<style>`, la clase y el `<title>`/`<desc>`/`role`/`aria-labelledby`
internos — esa responsabilidad ya la cumple `SimboloMistorias.astro` por
fuera. El hallazgo del `<style>` incrustado quedó cerrado en el gate (§8), no
solo corregido en este archivo.

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

En vez de una prop de tamaño o una variable CSS dedicada, `LogotipoMistorias`
usa `font-size: 1em` tanto para la altura del símbolo como para el tamaño de
la palabra. Quien lo usa fija el `font-size` de su propio contenedor, y ambas
piezas escalan juntas:

| Sitio de uso | `font-size` | Por qué |
|---|---|---|
| Cabecera, pantalla vertical | `var(--paso-1)` | El tamaño que ya tenía la palabra sola |
| Cabecera, `max-height: 30rem` | `var(--paso-0)` | Un paso menos, para no exceder el blanco de toque de 44px del enlace de navegación |

Ambos son tokens existentes de `tokens.css`, ya `clamp()` con sumando en `rem`
(ADR 0006 §6: una fórmula solo con `vw` rompe el zoom). No se inventó ningún
valor nuevo. El pie reutiliza el mismo principio con el nombre de marca en
texto plano, no con `LogotipoMistorias` — ver §6.

### 6. El logo completo vive solo en la cabecera; la franja y el pie no lo repiten

La primera vuelta también puso el lockup en la franja de portada (símbolo +
palabra, apilado) y el símbolo solo en el pie. Viendo el resultado, ambos se
descartaron:

- **La franja repetía el logo a pocos píxeles del de la cabecera**, en la
  misma pantalla — redundante, no aporta. Vuelve a como estaba: `<h1>` +
  promesa, sin lockup.
- **El símbolo solo, sin la palabra, se veía raro** fuera del contexto que le
  da sentido (junto al texto). El pie pasa a mostrar el **nombre "Mistorias"
  como enlace a la portada**, en texto plano con el mismo tratamiento que la
  palabra dentro de `LogotipoMistorias` (Lora 600, `--color-acento`, `--paso--1`)
  — no el componente completo, porque acá no hay símbolo que acompañar.

  El contenedor (`.pie__marca`) no fija su propio `align-items`: el `stretch`
  por defecto de flexbox iguala el alto del enlace "Mistorias" y el de la nota
  de transparencia de al lado, sea cual sea el más alto en cada viewport, y el
  enlace centra su propio texto adentro con `align-items: center`. Sin número
  fijo, sin JavaScript. `min-height: 44px` conserva el blanco de toque cuando
  la nota es corta, igual que `.pie__enlace` y `.cabecera__enlace`.

El logo completo (símbolo + palabra) queda así como una señal que aparece
**una sola vez** en cada página, en la cabecera. `SimboloMistorias.astro`
sigue existiendo porque `LogotipoMistorias` lo usa ahí, `aria-hidden` porque
la palabra al lado ya nombra la marca.

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
no sea `currentColor`/`none`/`inherit` (si el punto 4 se rompe, el build no
llega a producción) y cualquier `<script>`, manejador de evento,
`foreignObject` o referencia externa — el SVG se inyecta con `set:html`, así
que su contenido es código, no solo marcado de dibujo.

También rechaza cualquier `<style>` incrustado, sin importar lo que declare
adentro. Es la regla que la referencia de §3 hizo falta: un `currentColor`
dentro de una hoja de estilos propia del SVG no es lo mismo que un
`currentColor` heredado del documento que lo inyecta, y el atributo-only
`fill="#hex"` que el gate ya vigilaba no alcanzaba a verlo. Un `<style>`
inyectado con `set:html` además se vuelve una hoja de estilos real del
documento, con selectores de clase que podrían chocar con cualquier otra
clase del sitio — motivo suficiente para rechazarlo aunque no fijara color.

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
- El logo completo aparece una sola vez por página, siempre en la cabecera: ni
  la franja ni el pie lo repiten.
- El modo oscuro es gratis: no hay una segunda versión del símbolo, por
  `currentColor` y el gate que lo hace cumplir en build — y el gate ahora
  también cubre el color fijado vía `<style>`, no solo vía atributo.
- La palabra nunca deja de ser texto real: el enlace de la cabecera tiene
  nombre accesible en los tres estados, sin `<title>` ni `alt`; el enlace del
  pie es simplemente texto.

### Costos

- El símbolo es una adaptación de una referencia interna, no el archivo
  oficial de `mistorias-esencia-de-marca`: si ese repositorio publica un SVG
  oficial más adelante, este archivo se reemplaza — es un cambio de un solo
  archivo, sin tocar los componentes que lo consumen.
- Los archivos viven en `mistorias-web` en vez de en el repositorio de marca;
  promoverlos allá y documentarlos en `identidad-visual.md` queda pendiente.
- La verificación visual de los cinco viewports es manual (Playwright fuera
  del repositorio), como ya señalaba el ADR 0006.

## Riesgos abiertos

- **El pie no lleva el símbolo.** Si más adelante se quisiera una marca de
  agua visual además del nombre en texto, haría falta revisar de nuevo cómo
  se ve el símbolo solo, sin repetir el problema que motivó quitarlo.
