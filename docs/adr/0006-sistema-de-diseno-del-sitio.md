# ADR 0006: Sistema de diseño del sitio

## Estado

Aceptado

## Contexto

El [issue #15 de gestión de producto](https://github.com/mistorias/mistorias-gestion-de-producto/issues/15)
pide derivar un sistema de diseño de la
[esencia de marca](https://github.com/mistorias/mistorias-esencia-de-marca) y
aplicarlo a la portada, a la historia, a un layout común con navegación y a la
página no encontrada, priorizando accesibilidad y facilidad de lectura.

La marca ya define paleta, tipografía dual y la secuencia SIENTE → ENTIENDE →
ACTÚA. Lo que no define es cómo se traduce eso a un sitio estático con estas
restricciones, que el sistema no puede romper:

| # | Restricción | De dónde sale |
|---|---|---|
| R1 | `script-src 'none'`: cero JavaScript en el cliente | [ADR 0004](0004-triaje-reportes-seguridad-github-pages.md), `BaseLayout.astro` y `public/_headers` |
| R2 | `base` cambia entre `/mistorias-web` y `/` según `DEPLOY_TARGET` | `astro.config.mjs` |
| R3 | Las historias no admiten HTML crudo | `raw-html-gate.ts` |
| R4 | El esquema no garantiza qué secciones trae una historia | `storySchema` valida solo el frontmatter |

## Decisión

### 1. Tokens semánticos, con los hexadecimales en un solo archivo

`src/styles/tokens.css` es el único lugar donde aparece un color de marca. El
resto del sitio consume nombres semánticos (`--color-acento`, `--color-metadato`),
nunca un hex ni un nombre de color literal.

Es lo que permite que el modo oscuro sea un bloque de seis variables y que
ninguna hoja de componente cambie entre temas.

### 2. La paleta se extiende para el modo oscuro, porque tal cual no es legible

La paleta de marca está pensada sobre fondo claro. Medida sobre el Deep Slate que
la propia marca nombra como fondo del modo oscuro, no alcanza:

| Combinación | Ratio | Veredicto |
|---|---|---|
| Wine Red `#8B0F0F` sobre Off-White | 8.8:1 | AAA |
| Wine Red `#8B0F0F` sobre Deep Slate | **1.64:1** | ilegible |
| Warm Red `#C44336` sobre Deep Slate | **3.17:1** | falla AA en texto |

Se derivan tintes que conservan el matiz de origen y suben la luminosidad hasta
pasar AA. No son colores nuevos: son el mismo tono, aclarado.

| Token | Origen de marca | Tinte oscuro | Matiz | Ratio |
|---|---|---|---|---|
| `--color-acento` | Wine Red `#8B0F0F` | `#F08C7F` | 7° | 6.6:1 |
| `--color-analitico` | Deep Burgundy `#5E2C3E` | `#D9A2B4` | 340° | 7.4:1 |
| `--color-metadato` | Rust `#A24A2A` | `#B98A76` | 18° | 5.3:1 |

`--color-vivo` conserva el Warm Red literal en ambos temas. Su 3.2:1 no sirve
para texto, pero su único uso es no textual —bordes, anillo de foco, decoración—
donde la WCAG pide 3:1 y sí cumple. Es la forma de que el rojo de marca siga
presente en el tema oscuro sin publicar texto ilegible.

Estos tres tintes son una **extensión** del documento de identidad visual, que
nombra el fondo oscuro pero no define qué va encima. Quedan registrados acá con
su matiz y su ratio para que sean trazables, y conviene proponerlos de vuelta al
repositorio de marca.

El tema responde solo a `prefers-color-scheme`: R1 impide un interruptor, que
exigiría JavaScript.

### 3. Tipografía propia, servida desde el mismo origen

IBM Plex Sans para información (cabecera, `h1`, metadatos, etiquetas) y Lora para
narrativa (`h2`/`h3`, cuerpo, resúmenes), como manda la identidad visual.

Google Fonts no es una opción: `default-src 'self'` lo bloquea. Se auto-hospedan
con `@fontsource-variable`, subconjunto latino, ~124 KB en la primera visita. Al
servirse desde el propio origen caen bajo `'self'` y **no hizo falta relajar
ninguna directiva de la CSP**.

### 4. Toda ruta interna se construye en código

`src/lib/routes.ts` centraliza la base del despliegue (R2) y los nombres de
sección. Un `href` escrito a mano acierta en un destino y falla en el otro sin
romper el build: el fallo aparece recién en producción de GitHub Pages. Al ser
funciones puras, se prueban.

Las direcciones quedan en castellano, coherentes con el lenguaje ubicuo del
proyecto: `/historias/<slug>/` y `/etiquetas/<etiqueta>/`. El cambio se hace
ahora porque hay una sola historia publicada; más adelante costaría redirecciones.

### 5. La prosa recibe un solo tratamiento tipográfico

La estructura editorial de una historia (`## La historia`, `## Noticias
principales`, `## Conectando los puntos`, `## Acción final`) es convención, no
contrato: R4 significa que nada obliga a que existan ni a que se llamen así.

Diferenciar visualmente cada sección obligaría a acoplar el diseño a esos títulos
literales, y una historia que los escribiera distinto se vería rota **sin que el
build avisara**. Se descarta por eso, no por costo. El ciclo de marca se percibe
por el texto; el diseño se limita a no estorbar la lectura.

### 6. Adaptabilidad intrínseca, con puntos de quiebre solo donde hay una razón

La columna de lectura es `min(65ch, 100% - 2rem)` y las rejillas son
`repeat(auto-fit, minmax(22rem, 1fr))`: cubren de 320px a 2560px sin una sola
media query, y seguirán siendo correctas en anchos que hoy no existen.

Las media queries que sí existen responden a una restricción real y ninguna
nombra un dispositivo:

| Consulta | Por qué |
|---|---|
| `max-height: 30rem` | Celular horizontal: ~844px de ancho pero ~390px de alto. Se corta por altura y no por `orientation` porque la orientación es un indicio; la altura es la restricción |
| `hover: hover` | En táctil, un hover sin puntero se queda pegado tras el toque |
| `prefers-color-scheme`, `prefers-reduced-motion` | Preferencias del sistema |

La escala tipográfica es fluida con `clamp()`, y cada fórmula incluye un sumando
en `rem`: una hecha solo con `vw` ignora el tamaño de letra que la persona
configuró y rompe el zoom.

En escritorio la línea de lectura **no crece**. El espacio sobrante va a los
márgenes: 65 caracteres es la medida legible y una línea de 1400px hace perder el
renglón al volver.

### 7. Accesibilidad como parte del sistema, no como revisión posterior

Enlace de salto al contenido; landmarks `header`/`nav`/`main`/`footer`; un solo
`h1` por página y nivel de encabezado recibido por parámetro en las tarjetas, para
no saltarse niveles; `aria-current="page"` en la navegación; `:focus-visible` con
anillo de 3px; enlaces de historia subrayados siempre, para que no se distingan
solo por color; y 44px de blanco de toque en fichas de etiqueta y enlaces del pie.

## Consecuencias

### Positivas

- El modo oscuro y cualquier tema futuro son un bloque de variables, no una
  reescritura.
- Los contrastes están medidos y anotados junto al token, así que un cambio de
  color que los rompa se nota al leer el archivo.
- El sitio sigue sin enviar JavaScript y la CSP no se tocó en ninguna línea.
- El equipo editorial no queda amarrado a una estructura de secciones: puede
  cambiarla sin romper el diseño.
- Los enlaces internos resisten el cambio de base entre despliegues, con pruebas
  que lo verifican.

### Costos

- Dos dependencias nuevas y ~124 KB de tipografías en la primera visita.
- Las direcciones de las historias cambian de `/stories/` a `/historias/`. La
  documentación del repositorio de contenido promete la ruta anterior y hay que
  actualizarla ahí.
- Los tintes del modo oscuro viven en este repositorio y no en el de marca:
  quedan como fuente de verdad provisional hasta que se propongan allá.

## Riesgos abiertos

- **La política de etiquetas se contradice con el contenido publicado.**
  `TAGS.md` del repositorio de contenido marca `educacion` y `arequipa` como
  excluidas siempre, pero la historia actual las declara. Al volverse navegables,
  el sitio publica `/etiquetas/educacion/` y `/etiquetas/arequipa/`, que según esa
  política no deberían existir. Se corrige en el repositorio de contenido.
- **Las páginas de etiqueta hoy tienen un resultado cada una.** Es correcto pero
  poco útil; el valor aparece cuando haya más historias.
- **La verificación visual es manual.** Las capturas en los cinco viewports se
  toman con Playwright fuera del repositorio; no hay regresión visual automática.
