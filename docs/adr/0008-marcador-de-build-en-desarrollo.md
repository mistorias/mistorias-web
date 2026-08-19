# ADR 0008: Marcador visual del build de desarrollo

## Estado

Aceptado

## Contexto

El build de GitHub Pages (`DEPLOY_TARGET=development`, ver `src/lib/deployment.ts`)
sirve el trabajo en progreso desde `mistorias.github.io/mistorias-web`, con el
mismo aspecto que el sitio real en `mistorias.pe`. El
[issue #28](https://github.com/mistorias/mistorias-gestion-de-producto/issues/28)
señala un riesgo de suplantación: alguien podría enlazar el sitio de
desarrollo haciéndolo pasar por el real, ya que nada en la página lo
distingue.

## Decisión

Dos marcadores, activos solo cuando `isDevelopmentTarget(process.env.DEPLOY_TARGET)`
es verdadero (nuevo export de `src/lib/deployment.ts`, que reusa la misma
resolución fail-closed de destino que ya usa `resolveDeploymentConfig` — un
`DEPLOY_TARGET` desconocido sigue deteniendo el build, no cae en ningún
default):

1. **Título de página**: `BaseLayout.astro` antepone `WIP: ` a `title` (y por
   lo tanto a `og:title`) antes de imprimirlo. Como todas las páginas pasan su
   `title` a este layout, un solo cambio cubre el sitio entero.
2. **Palabra del logotipo**: `src/lib/brand/wordmark.ts` reemplaza el literal
   `"Mistorias"` por una palabra de 9 letras generada con `crypto.randomInt`
   (CSPRNG, no deducible), primera letra en mayúscula. `LogotipoMistorias.astro`
   consume `resolveWordmark()` en vez del literal. Como este componente solo
   se usa desde `CabeceraSitio.astro`, el efecto queda contenido a la
   cabecera — no toca el pie de página ni `og:site_name`, que siguen diciendo
   "Mistorias" en ambos destinos por decisión de alcance explícita.

La palabra aleatoria se calcula **una sola vez, al cargar el módulo**
(`DEVELOPMENT_WORDMARK` como constante de nivel superior), no en cada
render: un build es un único proceso Node, así que todas las páginas de un
mismo build muestran la misma palabra, mientras que cada build nuevo (cada
deploy) genera una distinta. Calcularla por página habría producido una
palabra distinta en cada ruta dentro del mismo deploy — más confuso que
clarificador.

## Consecuencias

### Positivas

- Quien navegue el sitio de desarrollo ve dos señales inmediatas (pestaña del
  navegador y cabecera) de que no es el sitio real, sin JavaScript — coherente
  con `script-src 'none'` (ver CLAUDE.md, Security & Validation).
- Producción no cambia en absoluto: `isDevelopmentTarget("netlify")` es
  `false`, así que ambos marcadores quedan inertes.
- Reusa la fuente de verdad existente (`TARGETS` en `deployment.ts`) en vez de
  introducir una segunda forma de detectar el entorno.

### Costos

- `og:site_name` y el enlace de texto "Mistorias" en `PieSitio.astro` no se
  tocan: el build de desarrollo sigue filtrando el nombre real ahí. Se dejó
  fuera de alcance a propósito porque el issue solo pide cabecera y título; si
  se quisiera cerrar esa brecha, es una extensión directa de
  `resolveWordmark`/`isDevelopmentTarget` sobre esos dos puntos.
