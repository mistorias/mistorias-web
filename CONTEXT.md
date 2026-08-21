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
*Avoid*: Deploy, release (como verbo genérico), go-live

**Tema**:
El eje editorial que distingue una historia de las demás y que agrupa a las que lo comparten. Entre tres y siete por historia; el sitio los publica en `/temas/`. En el código se llama `theme` — ver [CONTRIBUTING.md](CONTRIBUTING.md#idioma).
*Avoid*: Etiqueta (reservada para la Etiqueta de versión), tag, categoría.

**Etiqueta de versión**:
Marcador semver en git (p. ej. `v1.2.0`) que autoriza una Publicación. Crear y empujar la etiqueta es el acto de aprobación para publicar.
*Avoid*: Tag (en documentación de dominio), release tag

## Ejemplo de diálogo

**Dev:** Tenemos disponibles los cambios del PR del submódulo ayer, pero el sitio sigue con la historia anterior. 

**Editor:** Correcto — hacer disponible los cambios no publica. Hay que crear la etiqueta cuando estemos listos.

**Dev:** Entonces publico `v1.3.0` y el workflow despliega a Netlify.

**Editor:** Sí. Eso es la Publicación.