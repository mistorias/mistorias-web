# ADR 0005: Imágenes en las historias sin que el contenido nombre archivos

## Estado

Aceptado

## Contexto

El [issue #16](https://github.com/mistorias/mistorias-web/issues/16) pide permitir
que una historia tenga una imagen. El pedido ya viene con requisitos de seguridad
incorporados, y conviene dejarlos explícitos porque cada uno cierra algo concreto:

| # | Requisito del issue | Qué cierra |
|---|---|---|
| R1 | Extensión fija | SVG con `<script>` y formatos exóticos |
| R2 | Nombre siempre igual, en castellano | El nombre deja de ser un dato que el contenido controla |
| R3 | Carpeta que espeja la ruta de la historia | La ubicación se deriva, no se declara |
| R4 | Carga al momento de la publicación | Nada de terceros; los bytes servidos los genera el build |
| R5 | Allow list, solo letras y guiones | Traversal, bytes nulos, `.htaccess`, homoglifos, colisiones por mayúsculas |

El contenido editorial vive en un repositorio público y colaborativo, fijado por
commit ([ADR 0001](0001-submodule-contenido-seguro.md)). Hasta ahora todo lo que
entraba era texto, y el texto se revisa leyéndolo. Una imagen es un binario: nadie
revisa un JPEG a ojo en un pull request. Esa es la diferencia que obliga a que los
controles sean automáticos y no procedimentales.

### Hallazgo previo: el gate anti-HTML no cubre subcarpetas

`readStoryFilenames()` en `src/lib/content/content-loader.ts` usa `readdir` **sin
recursión** y filtra `entry.isFile()`. El loader de Astro, en cambio, usa
`pattern: "**/*.md"`. Los dos no miran el mismo conjunto de archivos.

Verificado con un build real: una historia en `stories/anidada/prueba.md` con
`<script>alert(1)</script>` compila en verde y el script queda literal en
`dist/stories/anidada/prueba/index.html`. La CSP (`script-src 'none'`) impide que
se ejecute, pero `style-src 'unsafe-inline'` sí permite `<style>` crudo por esa
misma vía, o sea defacement del sitio.

Es el patrón que denunció el [ADR 0004](0004-triaje-reportes-seguridad-github-pages.md):
el control existe, el test está verde, y el camino real de compilación pasa por al
lado. Importa para este ADR porque la estructura que se decide abajo mete carpetas
dentro de `stories/`: sin el arreglo, cualquier `.md` que caiga ahí se publica sin
pasar el gate.

## Decisión

### 1. La imagen vive junto a la historia, en una carpeta que espeja su URL

```
stories/lucia-y-el-dia.md            → se publica en /stories/lucia-y-el-dia/
stories/lucia-y-el-dia/principal.jpg → la imagen de esa historia
```

Un solo lugar por historia, y el paralelo con la dirección pública se ve de
inmediato: quien escribe no necesita aprender una segunda convención de rutas.

Se descartó una carpeta `imagenes/` paralela. Separaba mejor binarios de texto en
el árbol, pero obligaba a explicar dos ubicaciones distintas para una misma
historia, y el beneficio de revisión no era real: el diff de un PR mezcla ambas
igual.

### 2. El contenido nunca nombra un archivo

Esta es la decisión de la que dependen casi todas las demás.

Si el frontmatter dijera `imagen: "algo"`, ese string sería una ruta provista por
contenido semi-confiable, y habría que defenderla de `../`, bytes nulos, unicode y
símlinks. Es un parser de rutas alimentado por input externo: la clase de código
donde aparecen los bypasses.

Al derivar la ruta del slug —el build busca `stories/<slug>/principal.jpg`, existe
o no existe— el traversal no se mitiga: **no se puede expresar**. No hay input que
validar porque no hay input.

El mismo criterio aplica al bundling. Los archivos entran por un patrón literal:

```ts
import.meta.glob("/content/mistorias-contenido/stories/*/principal.jpg")
```

El conjunto de archivos que llega al sitio queda definido por código estático, no
por contenido. Un archivo que no calza el patrón no existe para el sitio: ni se
copia, ni se sirve, ni se puede enlazar.

Por lo mismo se prohíbe la sintaxis `![]()` en el cuerpo del markdown. Hoy
`![x](https://tercero/pixel.png)` pasa todos los gates y la CSP lo bloquea recién
en el navegador, en silencio. Con imágenes habilitadas eso deja de ser una rareza
inofensiva y pasa a ser la vía obvia para meter una ruta a mano.

### 3. La carga es en el build, y consiste en reconstruir la imagen

`astro:assets` con `sharp`. Lo importante no es que optimice: es que **no copia el
archivo, lo vuelve a generar**.

```
principal.jpg (repo) → sharp DECODIFICA a píxeles → RE-CODIFICA → /_astro/principal.<hash>.jpg
```

Los bytes que recibe el lector no son los que subió quien escribió la historia:
son bytes nuevos, derivados de los píxeles. Todo lo que viajaba pegado al archivo
sin ser píxel no tiene por dónde pasar.

Verificado experimentalmente sobre esta misma estructura:

| Prueba | Resultado |
|---|---|
| Foto con GPS, `Artist` y `Make` en EXIF | Se elimina: sin EXIF, ICC, IPTC ni XMP en la salida |
| JPEG válido con `<script>` anexado al final (polyglot) | No sobrevive al re-encoding |
| `principal.jpg` que en realidad es un SVG con `<script>` | Rompe el build (`NoImageMetadata`) |
| `sharp` resuelto desde el proyecto | **Falla hoy** con `MissingSharp` |

El borrado de metadatos no es un detalle: una foto tomada con celular en el barrio
de una fuente lleva sus coordenadas. Publicarlas sería exactamente lo contrario
del principio de empatía de la marca. Que se borren por defecto es la razón
principal para no copiar archivos a `public/`, que fue la otra alternativa
considerada y que sirve los bytes tal cual llegaron.

`sharp` pasa a ser **dependencia directa** de `package.json`. Hoy solo existe como
transitiva y pnpm no la deja resolver, así que el pipeline de imágenes no arranca.
El fallo es ruidoso —el build termina en rojo—, pero conviene fijar la versión de
forma explícita porque `pnpm-workspace.yaml` ya la acota por seguridad.

### 4. El formato de origen y los formatos de salida son perillas distintas

Se sube `principal.jpg`: es lo que produce cualquier celular o cámara sin
conversiones previas, y no le pide nada al equipo editorial.

Lo que recibe el lector lo decide el build, y **no es lo mismo**: con la
configuración por defecto, un `.jpg` de origen se sirve como `.webp`. Se adopta el
patrón `<picture>` con webp y respaldo jpg, de modo que cada navegador tome el
formato que entiende sin que haya que elegir entre peso y compatibilidad.

Se emiten además varios anchos (`srcset`), que para la audiencia peruana en datos
móviles pesa más que la discusión de formatos: evita mandarle una imagen de
1600px a una pantalla de 640px.

Esta decisión se puede revisar con datos reales de dispositivos sin tocar una sola
historia, porque el contenido no sabe nada de formatos de salida.

### 5. El gate propio cubre lo que el pipeline no puede cubrir

El re-encoding resuelve todo lo relativo al *contenido* del archivo. Lo que queda
fuera es lo relativo a su *nombre, ubicación y existencia*, más las obligaciones
editoriales. Eso lo valida código nuestro, colgado del hook `astro:config:setup`
—el mismo que ya usa el gate anti-HTML— para que corra en `astro dev` y en
`astro build`:

| Control | Motivo |
|---|---|
| Nombre exacto `principal.jpg`, contrastado contra una allow list literal | R2, R5 |
| Ningún otro archivo dentro de `stories/<slug>/` | Evita binarios sin revisar y `.md` fuera del gate |
| Cabecera real del archivo coherente con la extensión | Detecta el disfraz antes de que sharp lo intente |
| Tamaño máximo en bytes, en píxeles y rechazo de animados | DoS del build, páginas obesas, contenido con parpadeo |
| `alt` obligatorio cuando hay imagen; falla si sobra o falta uno de los dos | Accesibilidad como condición de build |
| Crédito y licencia obligatorios cuando hay imagen | Solo se publican fotografías con licencia que lo permita |
| Aserción post-build: ningún `<img src>` fuera de `/_astro/` | La CSP no rompe el build, rompe el navegador |

La imagen faltante **no** rompe el build por sí sola: un glob sin coincidencias
devuelve un conjunto vacío, sin error. Verificar que exista es código explícito,
no un efecto gratis del framework.

### 6. El gate anti-HTML pasa a ser recursivo

Prerrequisito, no mejora opcional: la estructura de la decisión 1 crea carpetas
dentro de `stories/`, justo donde el gate hoy no mira. Se arregla en un cambio
aparte y previo, con su test de regresión sobre una historia anidada.

### 7. La CSP

Con `astro:assets` las imágenes salen a `/_astro/` en el mismo origen, así que
`img-src 'self'` alcanza. Queda por confirmar si Astro inlinea imágenes chicas
como `data:`; si no lo hace, se saca `data:` de la directiva **en los dos archivos
a la vez** (`src/layouts/BaseLayout.astro` y `public/_headers`), que es la trampa
que el ADR 0004 dejó avisada.

## Riesgos abiertos

- **Fotografías de personas, y en particular de menores.** No lo resuelve el
  código: es política editorial. Se registra como issue en
  `mistorias-gestion-de-producto`.
- **La licencia se declara, no se verifica.** El build exige el campo; que sea
  cierto lo sostiene la revisión humana del PR.
- **Revisión de binarios en pull requests.** Un JPEG no se lee en un diff. El
  re-encoding acota el daño técnico, pero el juicio sobre qué muestra la foto
  sigue siendo humano.
- **Bombas de descompresión.** `sharp` trae un límite de píxeles por defecto;
  conviene fijarlo explícitamente en vez de heredarlo, y confirmarlo con una
  prueba real.

## Consecuencias

### Positivas

- El traversal de rutas es imposible por construcción, no está mitigado por una
  validación que alguien pueda debilitar después.
- Los metadatos de las fotos —incluidas coordenadas GPS— no llegan a publicarse.
- El formato que reciben los lectores se puede cambiar con datos de uso sin tocar
  ninguna historia.
- El gate anti-HTML deja de tener un agujero que hoy está abierto en `main`.

### Costos

- `sharp` entra como dependencia directa: más superficie de build y una versión
  más que mantener al día.
- El build se vuelve más lento y menos determinista en tiempo, en proporción al
  número de historias con imagen.
- Quien escribe pierde flexibilidad: una imagen por historia, con un solo nombre
  posible. Es deliberado, y se revisa si el uso lo pide.
- Aparecen binarios en el repositorio de contenido, que crece más rápido y cuyo
  historial no se puede podar con la misma facilidad que el texto.

## Testing

Plan de pruebas de la implementación. Cada control de la decisión 5 llega con su
fixture de rechazo:

- Nombre fuera de la allow list (`Principal.jpg`, `principal.jpeg`, `imagen.jpg`).
- Extensión prohibida, y `principal.jpg` que en realidad es un SVG o un HTML.
- Archivo extra dentro de `stories/<slug>/`, incluido un `.md`.
- Imagen sin `alt`, `alt` sin imagen, imagen sin crédito o sin licencia.
- Imagen que excede el límite de bytes o de píxeles, e imagen animada.
- Historia anidada con HTML crudo, contra el gate recursivo de la decisión 6.
- Aserción sobre `dist/`: todo `<img src>` apunta a `/_astro/`.
