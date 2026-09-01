# ADR 0014: Cross-Origin-Opener-Policy y caché inmutable de assets con hash

## Estado

Aceptado

## Contexto

El [issue #40](https://github.com/mistorias/mistorias-gestion-de-producto/issues/40)
del repo `mistorias-gestion-de-producto` pedía agregar cinco cabeceras de
seguridad HTTP vía `netlify.toml`, señalando dos problemas: que
`frame-ancestors` no tiene efecto dentro de una etiqueta `<meta>` (solo
funciona como cabecera HTTP), y que `Strict-Transport-Security` y
`Cross-Origin-Opener-Policy` no estaban presentes.

Al investigar, la premisa del issue resultó parcialmente desactualizada:
desde el [ADR 0003](0003-riesgos-seguridad-priorizados.md) (issue #17/#20),
`public/_headers` ya envía `Content-Security-Policy` (con
`frame-ancestors 'none'`), `Strict-Transport-Security`,
`X-Content-Type-Options` y `Referrer-Policy` en todas las rutas. La CSP en la
etiqueta `<meta>` de `src/layouts/BaseLayout.astro` ya omite deliberadamente
`frame-ancestors` (el spec HTML no lo permite ahí) y coincide en el resto de
directivas con la CSP del header — no había ninguna contradicción entre
ambas que resolver.

El único hueco real era `Cross-Origin-Opener-Policy`, ausente en
`public/_headers`. Se deja este registro para que no se reabra la duda sobre
las cabeceras que el issue #40 daba por ausentes y ya estaban resueltas,
siguiendo el mismo criterio que usa el ADR 0003 en su sección "Riesgos
descartados".

Por separado, tampoco existía ninguna regla de `Cache-Control` para los
assets con hash que Astro emite bajo `dist/_astro/`. El issue #40 lo
mencionaba como criterio de aceptación opcional; se resuelve en el mismo
cambio por ser de bajo esfuerzo y compartir archivo.

No hay iframes propios ni uso de `postMessage` en el sitio (confirmado por
búsqueda en el código) que dependan de que el sitio sea embebible o de
comunicación entre ventanas cross-origin, así que ninguna de las dos
cabeceras nuevas rompe funcionalidad existente.

## Decisión

Se agregan dos reglas a `public/_headers`:

```
/*
  ...
  Cross-Origin-Opener-Policy: same-origin

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

`same-origin` es el valor estándar de COOP para sitios sin popups ni
ventanas cross-origin que necesiten comunicarse entre sí — este sitio no
envía JavaScript (`script-src 'none'`), así que no hay ningún flujo que
dependa de `window.opener`.

`/_astro/*` es el directorio donde Astro emite todos los archivos con
nombre basado en hash de contenido (JS, CSS, imágenes optimizadas): un
cambio en el contenido produce un nombre de archivo distinto, así que es
seguro cachearlos como inmutables por un año.

No se toca `netlify.toml`: sigue conteniendo solo configuración de build,
manteniendo el patrón ya establecido en este repo de que los headers HTTP
viven únicamente en `public/_headers`.

## Consecuencias

### Positivas

- Cierra el único hueco real señalado por el issue #40.
- Los assets con hash se sirven con caché de navegador de un año, reduciendo
  requests repetidos sin riesgo de servir contenido obsoleto (el hash cambia
  si el contenido cambia).
- Deja documentado por qué el resto de la premisa del issue ya estaba
  resuelta, evitando que se reabra como duda en el futuro.

### Costos

- Ninguno identificado: no hay funcionalidad en el sitio que dependa de ser
  embebido ni de comunicación entre ventanas.

## Testing

- Verificar en `dist/_headers` tras `pnpm build` que el archivo se copia con
  las dos reglas nuevas.
- Tras el próximo deploy a Netlify, confirmar con
  `curl -I https://mistorias.pe` que responde `Cross-Origin-Opener-Policy:
  same-origin`, y con `curl -I` sobre un asset bajo `/_astro/...` que
  responde `Cache-Control: public, max-age=31536000, immutable`.
