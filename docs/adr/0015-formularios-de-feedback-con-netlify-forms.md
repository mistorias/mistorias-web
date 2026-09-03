# ADR 0015: Feedback de lectores con Netlify Forms, sin JavaScript

## Estado

Aceptado

## Contexto

El [issue #42 de gestión de producto](https://github.com/mistorias/mistorias-gestion-de-producto/issues/42)
pide que los lectores puedan dar feedback al sitio: reportar un error en una
historia o una falla del sitio, y dejar una opinión rápida al terminar de leer
cada historia. Hasta ahora la única vía era un `mailto:` en `reportar.astro`.

Tres artículos guían el diseño de la interacción:
[Nielsen Norman Group sobre cómo recoger feedback de usuarios](https://www.nngroup.com/articles/user-feedback/)
(preferir una señal de bajo costo —una calificación con un clic— sobre un texto
obligatorio),
[Smashing Magazine sobre reportar problemas sin fricción](https://www.smashingmagazine.com/2019/09/pain-free-workflow-issue-reporting-resolution/)
(un enlace a una página con formulario, no un correo) y
[el artículo de Typeform sobre el diseño de formularios de feedback](https://www.typeform.com/blog/designing-feedback-forms)
(una sola pregunta protagonista, copia breve y personal, nunca la sensación de
encuesta).

Restricción que decide casi todo lo demás: **`script-src 'none'`**
([ADR 0004](0004-triaje-reportes-seguridad-github-pages.md)). El sitio no
envía JavaScript, así que cualquier formulario tiene que enviarse con un POST
HTML normal. [Netlify Forms](https://docs.netlify.com/manage/forms/setup/)
hace exactamente eso: detecta el formulario en el HTML publicado durante el
build y le da un backend sin escribir una sola línea de servidor.

El problema es que el sitio se publica en dos destinos
([`deployment.ts`](../../src/lib/deployment.ts)) y Netlify Forms solo existe
en uno de ellos: GitHub Pages sirve el build de trabajo, pero no tiene ningún
backend que reciba el POST.

## Decisión

### 1. `form-action` pasa de `'none'` a `'self'`

Es el único cambio a la CSP. El formulario nunca envía a otro origen —Netlify
intercepta el POST a la misma página donde vive—, así que `'self'` no abre
nada que no se necesite y sigue bloqueando cualquier envío externo.

### 2. Las dos rutas de `reportar.astro` se comprimen en un solo formulario

"Un error en una historia" y "Algo que no funciona en el sitio" pedían lo
mismo en el fondo: qué página y qué encontraste. El formulario único tiene un
campo de página opcional, una descripción obligatoria y un correo opcional
para responder. Nadie tiene que elegir una categoría antes de poder escribir.

La vulnerabilidad de seguridad **no** entra en esta compresión: sigue yendo al
[reporte privado de GitHub](https://github.com/mistorias/mistorias-web/security/advisories/new),
nunca a un formulario público, porque publicarla ahí la expondría antes de que
exista una corrección.

### 3. En GitHub Pages el formulario se muestra igual, con un aviso

La alternativa era ocultar el formulario en el destino sin backend. Se
descartó: mantener un solo marcado para los dos destinos es más simple, y
ocultar la única vía de contacto visible en la versión de trabajo iría contra
la transparencia que pide la marca. En su lugar, `AvisoSoloNetlify.astro`
—compartido entre los dos formularios del sitio— muestra una nota solo cuando
`isDevelopmentTarget()` es cierto, explicando que ese envío no va a llegar y,
en el caso de "Reportar un problema", dejando el correo como respaldo mientras
tanto.

### 4. La opinión de una historia vive en la propia historia, con una calificación de 1 a 5 y un solo texto libre

Se probó primero moverla a una página propia por historia
(`/historias/<id>/opinar/`, con `getStaticPaths()` igual que la página de la
historia), siguiendo el mismo patrón de Smashing Magazine que ya usa
"Reportar un problema". Se descartó: a diferencia de reportar un error —algo
que no siempre ocurre—, la opinión es el cierre natural de *toda* lectura, y
sacarla de la historia duplicaba el número de páginas del sitio (una más por
cada historia) sin bajar la fricción real: calificar sin salir de la página
que se acaba de leer es igual de simple, y mantiene el hilo de haber
terminado de leer en vez de cortarlo con una navegación.

`OpinionHistoria.astro` queda entonces incrustado al pie de cada historia,
igual que antes de considerar la página propia. La pregunta no repite el
nombre de la historia —quien la ve ya está leyéndola, así que repetirlo no
suma nada a la decisión de calificar— y el gancho apunta a lo fácil que es
("con un clic") en vez de a cuánto toma, porque ya no hay que salir de la
página para descubrirlo.

Siguiendo a NN Group y a Typeform: la calificación —clic, sin escribir— es la
señal de bajo costo que casi cualquiera deja, y es la protagonista del
bloque; el texto es opcional y cubre tanto "qué te gustó" como "qué podría
mejorar" en un solo campo, no dos, porque pedir dos respuestas de texto
habría sido la fricción que la calificación existe para evitar. Un campo
oculto manda el id de la historia junto con el envío, así cada opinión queda
identificada sin necesitar una URL por historia.

### 5. Anti-spam: honeypot, no captcha

Sin `script-src` no hay reCAPTCHA ni ningún widget de terceros. Netlify Forms
soporta un campo trampa nativo (`netlify-honeypot`): un input oculto con CSS
que un bot rellena porque no ejecuta la hoja de estilos, y que ninguna persona
—con o sin lector de pantalla— llega a ver.

### 6. Un solo `/gracias/` para los dos formularios

`action` en ambos formularios apunta a la misma página de agradecimiento
genérica (`gratitudeRoute()` en `routes.ts`). A quien envía le basta saber que
su mensaje llegó; no hace falta una página de éxito por formulario.

### 7. El 404 no adivina el enlace roto: invita a escribirlo

El sitio es completamente estático: no hay servidor que lea la URL pedida, así
que `404.astro` no puede autocompletar qué enlace siguió el lector. En vez de
eso, enlaza directo a la sección del formulario (`#formulario` en
`reportar.astro`) invitando a contarlo a mano.

## Consecuencias

- Un envío hecho desde `mistorias.github.io/mistorias-web` no llega a ningún
  lado más allá del aviso: es una limitación conocida y aceptada, no un bug.
- Falta configurar el receptor en el panel de Netlify (mencionado en el propio
  issue como paso posterior de quien lo pidió) antes de que los envíos en
  producción tengan efecto.
- El honeypot no detiene todo el spam, solo los bots que no ejecutan CSS. Es
  el único mecanismo disponible bajo `script-src 'none'`; subir el nivel de
  protección requeriría relajar esa directiva.
- `AvisoSoloNetlify.astro`, `OpinionHistoria.astro` y las páginas nuevas
  (`gracias.astro`, los cambios en `reportar.astro`, `404.astro` e
  `index.astro`) quedan fuera de `coverage.config.ts`, igual que el resto de
  `src/pages/` y los componentes de puro maquetado (ver
  [docs/STANDARDS.md](../STANDARDS.md#control-de-cobertura)): no tienen lógica
  propia más allá de `isDevelopmentTarget()`, ya cubierta por
  `deployment.spec.ts`.
