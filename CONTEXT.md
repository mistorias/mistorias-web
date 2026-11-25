# Mistorias Web

Sitio estático que publica historias editoriales. El contenido editorial vive en un submódulo; este repositorio contiene la aplicación y la integración de despliegue.
El contenido de este archivo, al igual que todo el contenido en este repositorio estará en castellano peruano.

## Lenguaje ubicuo

**Hacer disponible los cambios:**

Es la acción que trae a la rama principal del repositorio los cambios que se hicieron en un PR.

*Avoid*: merge (término técnico).

**Despliegue**:
Cuando la versión actual del sitio es accesible desde uno de los proveedores de alojamiento. Solo se publica en producción (ver el siguiente punto). Es un término técnico y no es usado de cara a los lectores.
*Avoid*: Publicación (ver el siguiente punto), deploy (término anglosajón).

**Publicación**:
Poner en producción la versión actual del sitio en Netlify. Solo ocurre cuando se empuja una etiqueta de versión al repositorio — no automáticamente al fusionar en `main`.
*Avoid*: Deploy, release (como verbo genérico), go-live, y usarlo para los posts en redes (eso es una Difusión).

**Difusión**:
Llevar una historia ya publicada a las redes sociales (Facebook, Instagram, X). La ejecuta mistorias-redes-sociales a partir del feed `/historias.json` y queda registrada en `stories/<slug>/difusion.json` de mistorias-contenido. En el código se llama `broadcast`. Sus demás términos (borrador, autoaprobación de la difusión, difundido) se definen en el [CONTEXT.md de redes-sociales](https://github.com/mistorias/mistorias-redes-sociales/blob/main/CONTEXT.md).
*Avoid*: Publicación (reservada para el sitio en producción), post, anuncio.

**Tema**:
El eje editorial que distingue una historia de las demás y que agrupa a las que lo comparten. Entre tres y siete por historia; el sitio los publica en `/temas/`. En el código se llama `theme` — ver [docs/IDIOMA.md](docs/IDIOMA.md).
*Avoid*: Etiqueta (reservada para la Etiqueta de versión), tag, categoría.

**Comentario**:
Texto que un lector escribe sobre una historia y que pidió publicar con su nombre. Es público y moderado: una persona del equipo lo aprueba (fusiona su PR) antes de que aparezca bajo la historia. En el código se llama `comment`; ver [ADR 0036](docs/adr/0036-comentarios-publicos-de-lectores-sin-javascript.md).
*Avoid*: Opinión (es privada), reseña, review.

**Opinión**:
Lo que un lector envía por el formulario al final de una historia: la calificación y, si quiere, un comentario. Es privada y solo la ve el equipo; la calificación solo cuenta para el promedio. Si el lector elige publicar su comentario, esa parte pasa a ser un Comentario. En el código se llama `opinion`.
*Avoid*: Comentario (es público), feedback.

**Etiqueta de versión**:
Marcador semver en git (p. ej. `v1.2.0`) que autoriza una Publicación. Crear y empujar la etiqueta es el acto de aprobación para publicar.
*Avoid*: Tag (en documentación de dominio), release tag

## Ejemplo de diálogo

**Dev:** Tenemos disponibles los cambios del PR del submódulo ayer, pero el sitio sigue con la historia anterior. 

**Editor:** Correcto — hacer disponible los cambios no publica. Hay que crear la etiqueta cuando estemos listos.

**Dev:** Entonces publico `v1.3.0` y el workflow despliega a Netlify.

**Editor:** Sí. Eso es la Publicación.