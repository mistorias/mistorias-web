# ADR 0009: Los ejes editoriales se llaman «temas», no «etiquetas»

## Estado

Aceptado

## Contexto

Las páginas del sitio ya hablaban de «temas» cuando presentaban lo que agrupa
a las historias entre sí —el índice decía «Los temas que distinguen a una
historia de las demás»— pero todo lo demás decía «etiqueta»: la ruta
`/etiquetas/`, el componente `ListaEtiquetas.astro`, el título del pie de cada
historia y el helper `groupByTag` de `src/lib/tags.ts`.

El [issue #33](https://github.com/mistorias/mistorias-gestion-de-producto/issues/33)
pide cerrar esa distancia. Hay una segunda razón, propia del repositorio:
[CONTEXT.md](../../CONTEXT.md) ya define **Etiqueta de versión** como el
marcador semver que autoriza una Publicación, y pide explícitamente evitar
«tag» en la documentación de dominio. La palabra «etiqueta» estaba ocupada por
otro concepto, y usarla también para los ejes editoriales obligaba a desambiguar
en cada conversación.

## Decisión

1. **De cara al lector: «tema».** `/temas/` y `/temas/<tema>/`; el pie de cada
   historia se titula «Temas relacionados» y cierra con un enlace «Explorar
   otros temas» hacia el índice completo. El índice pierde la frase «Empiezan
   por los más presentes en el sitio.»: los conteos ya muestran el orden.
2. **En el código: `theme`.** `src/lib/themes.ts` con `groupByTheme`,
   `normalizeTheme` y `ThemeGroup`; `themesRoute` y `themeRoute` en
   `routes.ts`; `ListaTemas.astro` con props `temas` y `temaTextual`, según la
   frontera inglés/castellano de [CONTRIBUTING.md](../../CONTRIBUTING.md#idioma).
3. **En el frontmatter: `themes`, con `tags` como respaldo.** `storySchema`
   acepta las dos claves y expone solo `themes`. Las historias publicadas viven
   en el submódulo `mistorias-contenido` y todavía declaran `tags`: rechazarlo
   habría roto el build de contenido ya en línea por un renombre.
4. **CONTEXT.md suma la entrada «Tema»**, con *Avoid: etiqueta, tag, categoría*.

### Sin redirecciones

Las URLs `/etiquetas/…` dejan de existir y devuelven 404. No se agregan
redirecciones porque GitHub Pages —el destino de desarrollo, ver
[ADR 0006](0006-sistema-de-diseno-del-sitio.md)— no sirve reglas de
redirección: solo Netlify las respetaría, y una redirección que funciona en un
destino y no en el otro es justamente la clase de asimetría silenciosa que ya
costó el [issue #29](https://github.com/mistorias/mistorias-gestion-de-producto/issues/29).
El sitio no tiene todavía enlaces externos conocidos hacia esa sección.

## Consecuencias

### Positivas

- Una sola palabra para una sola cosa, del frontmatter a la URL: quien lee, quien
  edita y quien programa nombran igual el mismo concepto.
- «Etiqueta» queda libre para lo que CONTEXT.md ya decía que era: el marcador de
  versión que autoriza una Publicación.
- Quien termina de leer una historia tiene por dónde seguir: los temas de esa
  historia, o el índice completo.

### Costos

- Cualquier enlace externo a `/etiquetas/…` se rompe. Es el costo aceptado de no
  sostener redirecciones que solo funcionarían en la mitad de los despliegues.
- El frontmatter queda con dos claves válidas hasta que `mistorias-contenido`
  migre a `themes`. El respaldo está marcado en `src/lib/content/schema.ts` y en
  `check_theme_counts.mjs`, y se elimina —junto con su prueba— cuando ninguna
  historia declare `tags`.
