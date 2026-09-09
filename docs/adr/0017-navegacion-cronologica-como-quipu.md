# ADR 0017: La navegación cronológica se dibuja como un quipu

## Estado

Aceptado

## Contexto

El issue #45 (gestión de producto) pide una forma de recorrer las historias
por fecha de publicación, en semanas, con un link por semana, en una página
que se vea "muy bien" en celular vertical y horizontal — hasta acá, requisitos
funcionales. El pedido adicional, hecho directamente al construir esto, es que
el componente sea "atractivo, casi artístico", con simbología andina o
incaica, y que la navegación por teclado sea un atributo perseguido en todo el
sitio, no solo acá.

Antes de este cambio, `/historias/` no resolvía a ninguna página: solo existía
`src/pages/historias/[...id].astro` (el detalle de una historia). La portada
solo ofrecía la última historia, cuatro anteriores
(`MAX_PREVIOUS_STORIES`) y el índice de temas — no había forma de ver el
archivo completo ni de percibir la cadencia con la que se publica.

## Decisión

### 1. El motivo es un quipu, no un adorno andino genérico

Un quipu es, literalmente, un dispositivo de registro: una cuerda principal,
cuerdas colgantes, y nudos cuya posición y cantidad codifican una cifra. El
mapeo con lo que hay que dibujar es exacto y no metafórico:

| Quipu | Componente |
| --- | --- |
| Cuerda principal | El eje del tiempo (un año) |
| Cuerda colgante | Una semana |
| N nudos | N historias publicadas esa semana |
| Ausencia de nudo | Semana sin historia — el cero del quipu |

Esa correspondencia es la que se descartó reemplazar por un motivo más
"vistoso" pero decorativo (una chakana repetida como viñeta, por ejemplo): ahí
la forma ilustra, acá la forma **es** el dato. Sirve además al principio de
transparencia de la marca (`mistorias-esencia-de-marca`) sin add-ons: una
racha larga sin publicar se ve, en vez de esconderse. El quipu ya estaba,
además, en el concepto visual de marca ("libro abierto + quipu + Misti",
`identidad-visual.md`) — esto activa un lenguaje que el sitio ya había
declarado, no introduce uno nuevo.

La greca escalonada (el separador entre años, `.quipu-anos > li + li::before`
en `QuipuDeHistorias.astro`) es el único elemento puramente decorativo del
componente, y se admite como tal: marca un borde de año que de otro modo solo
un salto de `<h2>` señalaría, y refuerza la metáfora "Ascending Data" del
concepto de marca.

### 2. Semanas vacías: cuerda sin nudo hasta dos seguidas, hueco colapsado desde tres

`src/lib/weeks.ts` (`GAP_THRESHOLD = 2`) decide esto antes de que el
componente dibuje nada: 1–2 semanas seguidas sin historia se emiten como
`TimelineWeek` con `stories: []` (el componente las pinta como tramo de cuerda
sin nudo, `aria-hidden="true"` porque no aportan nada navegable); 3 o más
colapsan en un único `TimelineGap` con texto visible ("N semanas sin
historia"). Es una decisión de honestidad con límite: dibujar cada semana
vacía de una racha de tres meses sin publicar volvería la página, sobre todo,
en un muro de ausencia — el umbral existe, y está expuesto como constante
exportada y probada (no como número mágico), justamente para poder revisarlo
si la cadencia editorial cambia.

### 3. `/historias/` como índice, no una sección nueva

Antes de este cambio, `/historias/` no resolvía a nada — era la URL que
cualquiera con criterio probaría primero y encontraba un 404. Convertirla en
el archivo completo llena un hueco real de navegación en vez de agregar una
tercera forma de listar historias junto a portada y temas. `/historias/[...id]`
sigue intacta: su `getStaticPaths` solo emite ids de historias, así que no
compite por la ruta vacía.

### 4. El rango del quipu se ancla en el contenido, nunca en la fecha del build

`buildTimeline` (`src/lib/weeks.ts`) calcula el tramo de semanas entre la
historia más antigua y la más reciente **del contenido que recibe** — nunca
llama a `new Date()` sin argumentos. Anclar el extremo superior en "hoy"
generaría un hueco creciente cada vez que pasa una semana sin publicar, visible
en cada redespliegue sin que nadie haya escrito nada: el HTML cambiaría solo
por el paso del tiempo, no por una acción editorial. Mismo criterio decide qué
año abre expandido por defecto en `QuipuDeHistorias.astro`: el primero del
array (`anos[0]`, garantizado más reciente por el contrato de `buildTimeline`),
no el año calendario vigente.

### 5. El nudo es marcado generado, no un archivo `.svg` con gate

El sitio ya tiene un patrón establecido para SVG que se inyecta en el
documento: `set:html` sobre un archivo `?raw`, validado por
`assertInlineSvgIsThemeReady` (`src/lib/assets/inline-svg-gate.ts`) — así lo
resuelven el símbolo de marca y `PlantaDeLibros.astro`. `NudoDeQuipu.astro` no
sigue ese patrón a propósito: el dibujo varía con `cantidad` (una lazada por
historia, hasta un tope visual de cinco), así que no hay un archivo fijo que
inyectar. Se escribe como marcado JSX del propio componente
(`<ellipse>` generadas con `Array.from`), con `fill="currentColor"` una sola
vez en el `<svg>` raíz — heredable en SVG, así que cada lazada lo hereda sin
repetirlo. Al no entrar por `set:html`, no hay HTML externo llegando al
documento y por lo tanto no hace falta un tercer gate junto a `symbol-gate` e
`illustration-gate`: el contrato de "sin color fijo, `viewBox` recortado" se
sostiene por revisión de código, no por un `assert` en build, porque no hay
archivo externo que pueda desviarse de él entre una revisión y la siguiente.

Con `cantidad <= 0` el componente no renderiza nada — ni siquiera un `<svg>`
vacío. Es la representación literal del cero del quipu (ausencia, no un
símbolo aparte) y evita marcado inerte en cada semana sin historia.

### 6. La greca usa `mask-image` con un tile SVG en `data:`, no una imagen de fondo

Igual que ADR 0011 resolvió para la silueta del salón: una imagen de fondo no
puede resolver contra un token del documento, así que el motivo quedaría fijo
en un solo tema. La máscara consume el canal alfa del tile SVG y el color sale
de `--color-analitico` vía `background-color`, así que cambia solo entre temas
sin un segundo archivo. El tile va como `data:` URI en línea (cuatro `<rect>`
formando una escalinata, sin geometría de `<path>` que pudiera fallar en un
navegador y no en otro) en vez de un archivo en `public/`: es un motivo
puramente decorativo de ~200 bytes, sin necesidad de cachearse aparte ni de
pasar por el gate de SVG en línea (no se inyecta con `set:html`, es una
referencia de imagen vía CSS, la misma superficie que ya cubre
`img-src 'self' data:` en la CSP desde antes de este cambio).

## Consecuencias

- `/historias/` dejó de ser un 404 silencioso.
- La portada gana un segundo modo de exploración ("Recorrer las historias
  semana a semana") independiente de si el contenido declara temas —
  antes, "Explorar las historias por tema" era la única salida más allá de las
  últimas cinco historias, y solo aparecía si `hayTemas`.
- `NudoDeQuipu.astro` y `QuipuDeHistorias.astro` no pasan por ningún gate de
  `src/lib/assets/`: su corrección depende de revisión de código y de los
  tests de estructura de marcado (`tests/nudo-de-quipu.spec.ts`,
  `tests/quipu-de-historias.spec.ts`), no de una integración de Astro que
  falle el build. Es una superficie de confianza menor que la de un SVG en
  línea inyectado desde archivo, y se acepta porque no hay archivo externo que
  pueda desviarse del contrato.
- `src/lib/weeks.ts` lleva, además de sus tests de ejemplo, un barrido de
  propiedades sobre un rango de fechas 2024–2029 (cruza años ISO de 52 y de 53
  semanas) que verifica ocho invariantes a la vez. No es una decisión de
  diseño del componente sino un hallazgo del propio proceso de construcción:
  los tests de ejemplo dejaban pasar errores reales de aritmética de
  calendario (un hueco que cruza el 1 de enero desaparecía; un año de 53
  semanas duplicaba y perdía semanas) que solo un barrido más amplio detectó.
