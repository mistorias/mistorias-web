# ADR 0033: Feed de historias publicadas en formato JSON Feed

## Estado

Aceptado. La implementación está pendiente.

## Contexto

mistorias-redes-sociales necesita enterarse de que una historia ya está
publicada en mistorias.pe para empezar su difusión en redes
([su ADR 0003](https://github.com/mistorias/mistorias-redes-sociales/blob/main/docs/adr/0003-flujo-de-difusion-automatica.md)).
"Publicada" tiene el sentido de [CONTEXT.md](../../CONTEXT.md): en producción
tras una etiqueta de versión, no recién fusionada en mistorias-contenido. Entre
una cosa y la otra pueden pasar días, y difundir antes deja a la audiencia
frente a un 404.

### El disparador

| Opción                                            | Credenciales que necesita                             | Qué refleja                           |
| ------------------------------------------------- | ----------------------------------------------------- | ------------------------------------- |
| `repository_dispatch` al terminar el despliegue   | Un token de la web con escritura sobre redes-sociales | Lo desplegado                         |
| Leer los _deployments_ de GitHub desde redes      | Ninguna (repo público)                                | Lo desplegado, inferido del submódulo |
| **Feed estático en el sitio, leído por un cron**  | **Ninguna**                                           | **Lo que el sitio sirve**             |

Se elige el feed por el principio de mínimo privilegio: la web no recibe
ninguna credencial hacia otro repo, y el feed solo expone lo que el sitio ya
muestra en público. Si el despliegue falla, el feed no cambia y no se difunde
nada.

### El formato

| Opción                    | A favor                                                                                                   | En contra                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **JSON Feed 1.1**         | Estándar abierto y documentado; cualquier lector de feeds puede suscribirse al sitio; no hay esquema que inventar ni mantener | Claves en inglés impuestas; un dato propio va en una extensión con prefijo (`_mistorias`)       |
| Formato propio            | Solo los campos que necesita redes-sociales                                                               | Un contrato más que documentar y versionar, útil para un solo consumidor                       |
| RSS 2.0 / Atom            | Lo entienden todos los lectores de feeds                                                                  | XML: más trabajo de parseo en Node que JSON, sin ventaja para el consumidor que lo dispara     |

Las claves en inglés no chocan con nada: ya es la regla para los datos
(`docs/IDIOMA.md`, como las claves de frontmatter).

## Decisión

El sitio publica `/historias.json` en **JSON Feed 1.1**
(<https://www.jsonfeed.org/version/1.1/>), generado en el build como endpoint
estático (`src/pages/historias.json.ts`) sobre la colección `stories`, ordenado
del más reciente al más antiguo:

| Campo del feed          | Valor                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| `version`               | `https://jsonfeed.org/version/1.1`                                     |
| `title`, `home_page_url`, `feed_url`, `language` | Mistorias, la portada, el propio feed y `es-PE`      |
| `items[].id`            | El slug de la historia                                                |
| `items[].url`           | URL absoluta, construida con `storyRoute` y `site`, nunca a mano      |
| `items[].title`         | `title`                                                               |
| `items[].summary`       | `summary`                                                             |
| `items[].content_text`  | `summary` (el estándar exige un contenido; el cuerpo vive en la página) |
| `items[].image`         | La imagen optimizada, si la historia tiene                            |
| `items[].date_published`| `date`, en ISO 8601                                                   |
| `items[].authors`       | Nombre y URL de la ficha del autor                                    |
| `items[].tags`          | Los temas                                                             |

mistorias-redes-sociales lo lee con un cron horario.

## Consecuencias

- El feed es un contrato público y estándar. Agregar un campo del estándar o una
  extensión `_mistorias` es compatible; quitar uno rompe a
  mistorias-redes-sociales y a quien se haya suscrito.
- Sale en los dos destinos (GitHub Pages y Netlify) con sus `site` y `base`
  respectivos. El cron de redes lee solo el de producción.
- La implementación sigue las reglas de siempre: rutas desde `src/lib/routes.ts`
  y un test del endpoint que valide el resultado contra el esquema de JSON Feed.
- Un retraso de hasta una hora entre la publicación y el inicio de la difusión
  es aceptable.
- Enlazar el feed desde el `<head>` (`<link rel="alternate" type="application/feed+json">`)
  para que los lectores lo descubran solos es un paso aparte, si se quiere.
