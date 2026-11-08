# ADR 0037: El promedio de calificaciones sale de un conteo diario guardado en git

## Estado

Aceptado.

## Contexto

El [issue #31 de gestión de producto](https://github.com/mistorias/mistorias-gestion-de-producto/issues/31)
pide hacer visible lo que opinan los lectores. Cada historia ya recoge una
calificación de 1 a 5 con `OpinionHistoria` ([ADR 0029](0029-feedback-de-lectores-con-netlify-forms.md)):
Netlify Forms la guarda en un panel privado y hasta ahora nadie la veía fuera
de ahí.

Las condiciones:

- **El sitio no envía JavaScript** (`script-src 'none'`, [ADR 0004](0004-triaje-reportes-seguridad-github-pages.md)),
  así que la página no puede consultar un servicio al cargar. El promedio tiene
  que estar escrito en el HTML al construir el sitio.
- **Todo es gratis.** Los envíos de Netlify Forms lo son; no queremos sumar un
  servicio de pago.
- **Transparencia** (principio de marca): lo que se muestra debe poder
  auditarse.

## Opciones

| Opción | A favor | En contra |
| --- | --- | --- |
| **Conteo diario en `data/ratings.json`, en git** | Auditable: cada cambio es un PR con su diff. Sin servicios nuevos. El build solo lee un archivo | El promedio se actualiza con demora (un día más el próximo tag) |
| Netlify Blobs | Se actualizaría al instante | Es otro servicio con su propio modelo de acceso; el valor no pasa por git ni por un PR, y nadie lo revisa antes de que se publique |
| Función que consulta Netlify Forms en cada build | Sin archivo intermedio | El build de GitHub Pages no tiene el token; el resultado cambia entre builds sin dejar rastro |
| Iframe o widget de un tercero | Cero código propio | Exige JavaScript y relajar la CSP |

## Decisión

**Un conteo diario en git.** El workflow `actualizar-calificaciones`
llama a la API de Netlify Forms, cuenta las
calificaciones por historia y abre un PR si `data/ratings.json` cambió. La
página de la historia lee ese archivo al construirse, lo valida con
`parseRatingsFile` (esquema estricto) y muestra el promedio con
`PromedioDeCalificaciones`.

- **Forma del archivo:** `{ "stories": { "<slug>": { "1": n, …, "5": n } } }`,
  con claves ordenadas y **sin timestamp**: solo cambia cuando cambian las
  calificaciones, de modo que un día sin novedades no abre ningún PR.
- **Mínimo de 5 (`MIN_RATINGS_TO_SHOW`).** Con menos calificaciones una sola
  persona mueve el promedio casi un punto, y el número diría más del azar que de
  la historia. Por debajo del mínimo el componente no se renderiza: ni "sin
  calificaciones" ni un promedio provisional.
- **Se muestra como texto** ("4.3 de 5 · 27 calificaciones"), no como estrellas
  ni como gráfico, para que un lector de pantalla lo lea igual.
- Una historia sin entrada en el archivo equivale a cero calificaciones.

## Riesgos y mitigaciones

### Inflar las calificaciones

No hay identidad: cualquiera puede enviar el formulario las veces que quiera y
Netlify no limita por IP en Netlify Forms. Un envío repetido puede subir o bajar
un promedio. Lo que reduce el daño, sin eliminarlo:

- El honeypot y Akismet de Netlify Forms descartan parte del envío automatizado.
- **El PR diario se revisa antes de fusionar.** Su cuerpo trae una tabla de
  calificaciones nuevas por historia y marca con "⚠️ revisar antes de fusionar"
  a la que reciba más de `ANOMALY_THRESHOLD` (50) en un día. Una persona decide
  si el salto es creíble; si no, cierra el PR y el promedio publicado no cambia.
- Un promedio es una señal de apoyo, no un resultado verificado: no se usa para
  ordenar ni para decidir qué se escribe.

### El token de Netlify vale para toda la cuenta

Los tokens personales de Netlify no se pueden acotar a un sitio. Mitigaciones:

- Es un token **distinto del de deploy**, creado solo para esto y **con
  vencimiento**.
- Vive como secreto del environment `calificaciones` de GitHub, **restringido a
  `main`**: un PR o una rama no lo pueden leer.
- El workflow corre con `permissions: contents: read`, solo hace `GET` y nunca
  fusiona; lo único que escribe es la rama `calificaciones/actualizar`, con el
  token del bot de contenido.
- Si el token se filtra, se revoca desde Netlify; el sitio sigue sirviendo el
  último `data/ratings.json` fusionado.

## Consecuencias

- El promedio llega con demora: hasta un día para el PR, más el tiempo hasta el
  siguiente tag. Es aceptable; no buscamos una puntuación en vivo.
- `data/ratings.json` entra al build como texto crudo (`?raw`) y se valida
  siempre: un archivo roto detiene el build en vez de publicar un número falso.
- Si el volumen de opiniones creciera mucho, habría que reabrir esta decisión
  (el archivo crece con las historias, no con las calificaciones, así que el
  límite está lejos).
