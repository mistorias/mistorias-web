# ADR 0035: El progreso de lectura se dibuja como un cordón de quipu, solo con CSS

## Estado

Aceptado

## Contexto

Quien lee una historia larga no sabe cuánto le falta. Se pidió reflejar ese
avance arriba de la página mientras se baja por el texto, y que mida solo la
narración (hoy, "La historia"), no las secciones de noticias y contexto que
vienen después.

El sitio no envía JavaScript: la Content-Security-Policy fija
`script-src 'none'` (ver `src/layouts/BaseLayout.astro`). La técnica habitual
(escuchar el evento `scroll` y actualizar un ancho) queda descartada, igual
que el *polyfill* de las scroll-driven animations, que también es JavaScript.

## Decisión

### 1. Un cordón de quipu, no una barra genérica

El archivo (ADR 0020) y los temas (ADR 0026) ya se dibujan como un quipu. El
progreso usa el mismo lenguaje: un cordón fino (`0.25rem`) fijo arriba de la
ventana, con fondo `--color-borde`, que se llena con `--color-acento`. Se
descartaron un cordón con un nudo por sección y una barra sin metáfora.

No se agregaron tokens: los dos colores ya cambian con el tema, así que el
modo oscuro no necesita una regla propia.

### 2. Mide la primera sección, por estructura y no por título

El cordón mide desde el primer `h2` del texto hasta antes del siguiente `h2`,
sin importar cómo se titulen. Este repo no se acopla a los títulos de sección
porque `storySchema` solo valida el frontmatter. La estructura sí es estable:
la plantilla de mistorias-contenido abre con la narración y la sigue con otro
`h2`.

CSS no puede medir un tramo entre dos elementos sueltos: necesita una caja
que lo contenga. Por eso `firstSectionPlugin` (`src/lib/content/first-section.ts`)
envuelve ese tramo en un `<section class="first-section">` al compilar el
Markdown. Es un plugin de hast para Sätteri, el procesador de Markdown de
Astro 7, registrado en `markdown.processor`. Se descartó un plugin de rehype:
Astro 7 ya no los corre sin instalar el procesador `unified` aparte. El único
paquete nuevo en `package.json` es `@astrojs/markdown-satteri`, que Astro ya
traía como dependencia propia; se declara porque `astro.config.mjs` lo importa.

Sätteri entrega nodos perezosos: puestos tal cual dentro de la sección nueva,
pierden sus hijos. El plugin los copia completos (`toPlainNode`) antes de
moverlos.

La sección corre en todo Markdown, también en las semblanzas de autor. Ahí no
cambia nada: `base.css` espacia los hijos de `.first-section` igual que los de
`.prosa`.

### 3. Scroll-driven animation sobre esa sección

La sección declara `view-timeline: --progreso-de-lectura block`, y
`timeline-scope` la sube hasta el envoltorio de `ProgresoDeLectura.astro`,
porque el cordón es hermano del texto y no su hijo. Dos animaciones usan esa
línea de tiempo:

- **Aparece** (`entry 70%` a `entry 100%`): mientras el inicio de la sección
  recorre el último 30% de la ventana, el cordón baja y se funde hasta quedar
  visible. Está atado al scroll, así que al volver hacia arriba se va por el
  mismo camino.
- **Avanza** (`contain`): 0% cuando el inicio de la sección llega arriba de la
  ventana y 100% cuando su final llega abajo. Después el cordón queda lleno.

Se descartó un fundido por tiempo (como los `150ms` de `CompartirHistoria`):
dispararlo al llegar a un punto del scroll requiere scroll-triggered
animations, que al escribir esto casi ningún navegador soporta.

Se descartó `scroll(root)`, la variante más común en los ejemplos de
[scroll-driven-animations.style](https://scroll-driven-animations.style),
porque mide toda la página.

El relleno avanza con `transform: scaleX()` y no con `width`: se resuelve en
el compositor, sin recalcular el layout en cada paso del scroll.

### 4. Sin soporte o sin sección, no hay cordón

Todo va dentro de `@supports (animation-timeline: view()) and
(timeline-scope: none)`, y el cordón solo se muestra si el texto tiene la
sección (`:has(.first-section)`). En cualquier otro caso queda con
`display: none`: uno que nunca avanza diría algo falso. La historia se lee
igual.

### 5. Decorativo y fuera del camino

- `aria-hidden="true"`: un lector de pantalla ya informa la posición en la
  página.
- `pointer-events: none`: no tapa nada clicable.
- `z-index: 5`, el mismo de `CompartirHistoria`: debajo del enlace para saltar
  al contenido (10) y del aviso de los enlaces externos (20).

### 6. Dónde va cada propiedad de la animación

Es la misma lección que `IndiceDeLetras` (ADR 0026): el minificador junta las
propiedades de una regla en el atajo `animation`, que no admite
`animation-timeline`, y se descartaba la animación entera. Además, un atajo
en una regla más específica que la de la línea de tiempo la pisa con `auto`.
Por eso el atajo va en la regla menos específica, y `animation-timeline` y
`animation-range` en otra más específica.

## Consecuencias

- Firefox, que al escribir esto no habilita las scroll-driven animations por
  defecto, no muestra el cordón. Se aceptó a propósito.
- Con `prefers-reduced-motion: reduce`, la regla global de `base.css` fuerza
  `animation-duration: 0.01ms`. En Chromium el cordón sigue avanzando, porque
  en una línea de tiempo de scroll la duración no rige el avance. Se deja así:
  el cordón sigue al scroll del propio lector y no se mueve por su cuenta.
- Si una historia no trae dos `h2`, el cordón no aparece y nada falla. No se
  agregó un gate de build: bloquear una publicación por un adorno sería
  desproporcionado.
- En una historia cuya primera sección sea más corta que la ventana, `contain`
  casi no tiene recorrido y el cordón no informa nada útil. No se probó porque
  hoy no hay historias así.
- El caché de contenido de Astro (`node_modules/.astro`) no se invalidó al
  cambiar el procesador de Markdown: en local hubo que borrarlo para ver la
  sección. En CI no pasa, porque cada build arranca sin caché.
