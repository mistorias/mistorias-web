# ADR 0035: El progreso de lectura se dibuja como un cordón de quipu, solo con CSS

## Estado

Aceptado

## Contexto

Quien lee una historia larga no sabe cuánto le falta. Se pidió reflejar ese
avance arriba de la página mientras se baja por el texto.

El sitio no envía JavaScript: la Content-Security-Policy fija
`script-src 'none'` (ver `src/layouts/BaseLayout.astro`). La técnica habitual
(escuchar el evento `scroll` y actualizar un ancho) queda descartada, igual
que el *polyfill* de las scroll-driven animations, que también es JavaScript.

## Decisión

### 1. Un cordón de quipu, no una barra genérica

El archivo (ADR 0020) y los temas (ADR 0026) ya se dibujan como un quipu. El
progreso usa el mismo lenguaje: un cordón fino (`0.25rem`) fijo arriba de la
ventana, con fondo `--color-borde`, que se llena con `--color-acento`. Se
descartaron un cordón con un nudo por sección (depende de cuántas secciones
tenga cada historia, y el esquema no garantiza ninguna) y una barra sin
metáfora.

No se agregaron tokens: los dos colores ya cambian con el tema, así que el
modo oscuro no necesita una regla propia.

### 2. Scroll-driven animation atada al texto, no a la página

`ProgresoDeLectura.astro` envuelve el texto de la historia, desde la
cabecera hasta el aviso de personajes ficticios, y declara
`view-timeline: --progreso-de-lectura block`. El relleno usa
`animation-range: contain`: 0% cuando el inicio del texto llega arriba de la
ventana, y 100% cuando su final llega abajo.

Se descartó `scroll(root)`, la variante más común en los ejemplos de
[scroll-driven-animations.style](https://scroll-driven-animations.style): mide
toda la página, así que el cordón se llenaría recién al llegar al pie del
sitio. Temas, firma, opinión y navegación no son lectura pendiente.

El relleno avanza con `transform: scaleX()` y no con `width`: se resuelve en
el compositor, sin recalcular el layout en cada paso del scroll.

### 3. Mejora progresiva: sin soporte, no hay cordón

Todo va dentro de `@supports (animation-timeline: view())`. Afuera, el cordón
tiene `display: none`: uno que nunca avanza diría algo falso. La historia se
lee igual.

### 4. Decorativo y fuera del camino

- `aria-hidden="true"`: un lector de pantalla ya informa la posición en la
  página.
- `pointer-events: none`: no tapa nada clicable.
- `z-index: 5`, el mismo de `CompartirHistoria`: debajo del enlace para saltar
  al contenido (10) y del aviso de los enlaces externos (20).

### 5. La línea de tiempo va en una regla aparte

Es la misma lección que `IndiceDeLetras` (ADR 0026): el minificador junta las
propiedades de una regla en el atajo `animation`, que no admite
`animation-timeline`, y se descartaba la animación entera. Por eso
`animation-timeline` y `animation-range` van en una regla con más
especificidad (`.progreso-de-lectura .progreso-de-lectura__avance`).

## Consecuencias

- Firefox, que al escribir esto no habilita las scroll-driven animations por
  defecto, no muestra el cordón. Se aceptó a propósito.
- Con `prefers-reduced-motion: reduce`, la regla global de `base.css` fuerza
  `animation-duration: 0.01ms`. En Chromium el cordón sigue avanzando, porque
  en una línea de tiempo de scroll la duración no rige el avance. Se deja así:
  el cordón sigue al scroll del propio lector y no se mueve por su cuenta.
- El cordón queda vacío mientras se pasa la cabecera del sitio, porque cuenta
  desde el título de la historia.
- En una historia más corta que la ventana, `contain` casi no tiene recorrido y
  el cordón no informa nada útil. No se probó porque hoy no hay historias así.
- Toda historia nueva lo recibe sin hacer nada: lo pone la plantilla
  `src/pages/historias/[...id].astro`.
