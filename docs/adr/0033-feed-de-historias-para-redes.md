# ADR 0033: Feed de historias publicadas para el flujo de redes

## Estado

Aceptado. La implementación está pendiente.

## Contexto

mistorias-redes-sociales tiene que enterarse de que una historia ya está en
mistorias.pe para anunciarla en redes
([su ADR 0003](https://github.com/mistorias/mistorias-redes-sociales/blob/main/docs/adr/0003-flujo-de-publicacion-automatica.md)).
"Ya está" significa desplegada en producción, no fusionada en
mistorias-contenido: entre una cosa y la otra pueden pasar días, y anunciar
antes deja a la audiencia frente a un 404.

Se evaluaron tres disparadores:

| Opción                                            | Credenciales que necesita                                 | Qué anuncia                  |
| ------------------------------------------------- | --------------------------------------------------------- | ---------------------------- |
| `repository_dispatch` al terminar el deploy       | Un token de la web con escritura sobre redes-sociales     | Lo desplegado                |
| Leer los _deployments_ de GitHub desde redes      | Ninguna (repo público)                                    | Lo desplegado, inferido del submódulo |
| **Feed estático en el sitio, leído por un cron**  | **Ninguna**                                               | **Lo que el sitio sirve**    |

## Decisión

El sitio publica `/historias.json`, generado en el build como endpoint estático
(`src/pages/historias.json.ts`) sobre la colección `stories`, con una entrada
por historia: `id`, `title`, `summary`, `date`, `url` absoluta (construida con
`storyRoute` y `site`, nunca a mano) y, si la tiene, la URL de la imagen
optimizada. mistorias-redes-sociales lo lee con un cron horario.

Se eligió por el principio de mínimo privilegio: la web no recibe ninguna
credencial hacia otro repo, y el feed solo expone lo que el sitio ya muestra en
público. Si el deploy falla, el feed no cambia y no se anuncia nada.

## Consecuencias

- El feed es un contrato público. Agregar un campo es compatible; quitar o
  renombrar uno rompe a mistorias-redes-sociales y se coordina allá.
- Sale en los dos destinos (GitHub Pages y Netlify) con sus `site` y `base`
  respectivos. El cron de redes lee solo el de producción.
- La implementación sigue las reglas de siempre: rutas desde `src/lib/routes.ts`
  y test del endpoint.
- Un retraso de hasta una hora entre el deploy y el anuncio es aceptable.
