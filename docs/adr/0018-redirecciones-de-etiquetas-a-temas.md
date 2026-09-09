# ADR 0018: `/etiquetas/…` redirige a `/temas/…` con 301, solo en Netlify

## Estado

Aceptado

## Contexto

[ADR 0009](0009-temas-en-vez-de-etiquetas.md) renombró los ejes editoriales:
`/etiquetas/` pasó a ser `/temas/`. Su sección «Sin redirecciones» decidió
explícitamente no redirigir, con dos razones:

1. GitHub Pages —el otro destino publicado— no sirve reglas de redirección, y
   una regla que funciona en un destino y no en el otro es la clase de
   asimetría silenciosa que costó el
   [issue #29](https://github.com/mistorias/mistorias-gestion-de-producto/issues/29).
2. No se conocían enlaces externos hacia esa sección.

La segunda razón dejó de ser cierta. El
[issue #107](https://github.com/mistorias/mistorias-web/issues/107) reporta que
los crawlers todavía tienen esas URLs en sus registros y que cada visita
termina en un 404. Un 404 en un sitio que promete transparencia no se lee como
una URL vieja: se lee como un sitio que no sostiene lo que publicó.

La primera razón sigue siendo cierta, pero pesa distinto que en ADR 0009. Desde
[ADR 0008](0008-marcador-de-build-en-desarrollo.md) y
[ADR 0015](0015-sitemap-y-robots-txt-por-destino.md), GitHub Pages es el build
de trabajo en progreso: se marca `noindex, nofollow` en cada página y no genera
sitemap. Las URLs `/etiquetas/…` que guardaron los buscadores son de
mistorias.pe, el único destino que se indexa —y el único de los dos que sí
sabe responder un 301.

## Decisión

### 1. Dos reglas 301 en `public/_redirects`

```
/etiquetas/*  /temas/:splat  301
/etiquetas    /temas/        301
```

El slug del tema no cambió con ADR 0009 —solo el nombre de la sección—, así
que el mapeo es uno a uno y el splat alcanza para todos los temas sin
enumerarlos. Las dos reglas son necesarias: el splat cubre
`/etiquetas/<tema>/`, pero no la sección a secas.

Es 301 y no 302 porque la mudanza es definitiva: un 302 le diría al buscador
que la ruta vieja va a volver y la seguiría pidiendo.

### 2. En `public/`, no en `netlify.toml`

`public/_headers` ya es un archivo específico de Netlify que vive en `public/`:
este sigue ese precedente. La razón de fondo es el despliegue: el workflow
publica con `netlify deploy --no-build --dir=dist` (ver
[CLAUDE.md](../../CLAUDE.md#build-variants-deploy_target) e issue #29), así que
lo que gobierna el sitio publicado es el contenido del artefacto. Un
`_redirects` que Astro copia desde `public/` viaja dentro de ese artefacto ya
verificado; una regla en `netlify.toml` dependería de que el CLI lea la
configuración del repositorio en el momento del deploy.

### 3. GitHub Pages sigue devolviendo 404

Ahí el archivo viaja inerte, igual que `_headers`. Es una asimetría aceptada a
conciencia, no un descuido: ese destino está marcado `noindex` y no tiene
sitemap, así que no compite por estas URLs y no hay credibilidad que perder en
él. Esto actualiza la sección «Sin redirecciones» de ADR 0009, que queda
apuntando acá.

Se descartó la alternativa de dar paridad con páginas
`<meta http-equiv="refresh">` generadas en ambos destinos: serían páginas
reales que responden 200, un buscador las trata como redirección débil, y
habría que excluirlas del sitemap a mano —justo lo que el issue pide evitar.

### 4. El sitemap no se toca

Una regla de redirección no es una página del build, así que
`@astrojs/sitemap` nunca la ve. El requisito de «no dejar esta página en el
sitemap» se cumple por construcción, sin sumar un filtro que mantener.

### 5. Una prueba ata el destino a `routes.ts`

`tests/redirects.spec.ts` lee `public/_redirects` y compara sus destinos con
`themesRoute("/")`. El archivo no pasa por el build ni por TypeScript: sin esa
prueba, un renombre futuro de la sección dejaría la redirección apuntando a un
404 y nadie se enteraría hasta que un lector lo reportara.

## Consecuencias

### Positivas

- Quien llega a mistorias.pe desde un enlace o un resultado viejo aterriza en
  el tema que buscaba, no en un 404.
- Los buscadores transfieren a `/temas/…` lo que tenían acumulado en
  `/etiquetas/…` y dejan de pedir la ruta vieja.
- El `sitemap.xml` sigue anunciando solo páginas que existen.

### Costos

- La redirección existe en un destino y no en el otro. El riesgo del issue #29
  era una asimetría que nadie había decidido; esta está decidida, documentada
  y probada.
- Un tema que se elimine en el futuro seguirá redirigiendo desde
  `/etiquetas/<tema>/` hacia un `/temas/<tema>/` que ya no existe: 301 y
  después 404. Es honesto —la página no está— y el 404 lo da la sección
  vigente, no una ruta que el sitio ya no reconoce.
- `public/_redirects` se publica también en GitHub Pages como archivo suelto,
  igual que `_headers` hoy.

## Verificación

Después de desplegar a Netlify:

1. `curl -sI https://mistorias.pe/etiquetas/<tema>/` → `301` con
   `location: /temas/<tema>/`.
2. `curl -sI https://mistorias.pe/etiquetas/` → `301` hacia `/temas/`.
3. `curl -s https://mistorias.pe/sitemap-0.xml | grep etiquetas` → sin
   resultados.
4. Google Search Console (`mistorias.pe`): las URLs `/etiquetas/…` reportadas
   como 404 deben pasar a redirección en los siguientes rastreos.
