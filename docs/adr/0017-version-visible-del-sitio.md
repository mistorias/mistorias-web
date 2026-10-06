# ADR 0017: Versión visible del sitio en "Acerca de"

## Estado

Aceptado

## Contexto

El [issue #106](https://github.com/mistorias/mistorias-web/issues/106) pide mostrar
el número de versión en la página "Acerca de". Hasta ahora no había forma de saber
qué build se estaba leyendo: quien reporta un problema no puede decir "en qué
versión lo vi" y quien lo recibe no puede reproducirlo con certeza.

Hay dos números que podrían responder esa pregunta y no coincidían:

- El **tag de git** con el que se corta un release. Es lo que dispara el despliegue
  a Netlify (`.github/workflows/deploy-netlify.yml` corre `on: push: tags`), así que
  identifica exactamente qué se publicó en mistorias.pe. Hoy el repositorio no tiene
  ningún tag.
- El campo **`version` de `package.json`**, que dice `0.1.0` y que nadie mueve.

Mostrar cualquiera de los dos sin resolver la diferencia habría producido una página
que anuncia una versión que no corresponde a lo que se está sirviendo — justo lo
contrario de la transparencia que la propia sección "Todo es público y tiene
historial" promete.

## Decisión

**El tag manda; `package.json` es el respaldo; CI impide que se separen.**

1. `src/lib/version.ts` expone `resolveSiteVersion(tag)`: devuelve el tag si viene
   con contenido y, si no, `v` + la `version` de `package.json`. Recibe el valor
   como argumento en lugar de leer el entorno adentro, igual que
   `resolveDeploymentConfig` y `resolveWordmark`, para que se pruebe sin tocar el
   entorno del proceso.
2. `src/pages/acerca.astro` lo llama con `process.env.SITE_VERSION` —el mismo patrón
   con que el resto del sitio lee `DEPLOY_TARGET`— y lo imprime como una línea
   discreta al cierre de "Todo es público y tiene historial", con los tokens de
   metadato que ya existen (`--fuente-info`, `--paso--1`, `--color-metadato`). No se
   agregó ningún token nuevo.
3. El workflow de Netlify le pasa el tag al build:
   `SITE_VERSION: ${{ github.ref_type == 'tag' && github.ref_name || '' }}`. En un
   `workflow_dispatch` desde una rama queda vacío y la página cae al respaldo, en vez
   de inventar un tag que no existe.
4. `scripts/check_release_version.sh` detiene el despliegue si el tag empujado no es
   `v` + la `version` de `package.json`. Vive como script y no como paso inline del
   workflow —igual que `scripts/check_build_base.sh`, por la misma razón (issue
   #29)— para poder correrlo en local antes de etiquetar.

Se resuelve todo en tiempo de build: no se agrega ni una línea de JavaScript de
cliente, coherente con `script-src 'none'` (ver CLAUDE.md, Security & Validation).

## Consecuencias

### Positivas

- La versión que muestra producción es literalmente el tag que se publicó: quien
  reporta un problema puede citarla y quien lo atiende puede volver a ese commit.
- El chequeo de CI convierte la desincronización en un despliegue que falla, no en
  una página que miente. Etiquetar sin subir `version` deja de ser posible en
  silencio.
- Desarrollo y GitHub Pages muestran la versión de `package.json`: no hay ninguna
  ruta en la que la página omita el dato o muestre un valor inventado.

### Costos

- Cortar un release ahora tiene un paso más: subir `version` en `package.json` en el
  commit que precede al tag. Es el costo de que ambos números signifiquen lo mismo.
- Fuera del release, `package.json` sigue moviéndose a mano; entre dos releases todas
  las builds de desarrollo anuncian la misma versión. Alcanza para el propósito del
  issue —saber qué release se está leyendo— y evitó agregar el SHA del commit, que se
  descartó por ruidoso para quien lee la página.
