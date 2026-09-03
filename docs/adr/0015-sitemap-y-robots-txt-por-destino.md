# ADR 0015: `sitemap.xml` y `robots.txt` por destino de despliegue

## Estado

Aceptado

## Contexto

El [issue #44](https://github.com/mistorias/mistorias-gestion-de-producto/issues/44)
pide evaluar mejores valores para `sitemap.xml` y `robots.txt`: hoy no hay
sitemap, y `public/robots.txt` es "`User-agent: *` / `Allow: /`" —básico,
como lo dejó [ADR 0003](0003-riesgos-seguridad-priorizados.md) §4— e idéntico
para los dos destinos publicados del sitio, aunque se comportan muy distinto:

- **GitHub Pages** (`DEPLOY_TARGET=development`,
  `mistorias.github.io/mistorias-web`): [ADR 0008](0008-marcador-de-build-en-desarrollo.md)
  ya lo trata como build de trabajo en progreso (marcador "WIP:" en el
  título, palabra de marca aleatoria) por riesgo de suplantación (issue #28).
  Un `robots.txt` que permite indexación completa contradice esa decisión:
  deja que este build "de mentira" aparezca en buscadores igual que el real.
- **Netlify** (`DEPLOY_TARGET=netlify`, `mistorias.pe`): es el sitio real, el
  único que debería indexarse.

El issue también pregunta explícitamente por seguridad. La
[guía de Google sobre robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
confirma que **no es un mecanismo de seguridad**: un crawler que no lo
respeta lo ignora igual, y una página bloqueada puede seguir apareciendo en
resultados si algo más la enlaza. Eso descarta un allowlist estricto
(`Disallow: /` por defecto + `Allow:` solo para Googlebot, Bingbot, etc.),
que además bloquearía sin querer a los bots que generan vistas previas de
enlace (`facebookexternalhit`, `Twitterbot`, `Slackbot`, WhatsApp) —justo lo
que [ADR 0013](0013-og-image-por-historia.md) (`og:image`) construyó.

## Decisión

### 1. `robots.txt` pasa de archivo estático a endpoint generado en build

`public/robots.txt` se elimina. `src/lib/seo/robots.ts` expone
`buildRobotsTxt(target)`, una función pura que reusa
`resolveDeploymentConfig`/`isDevelopmentTarget` de `src/lib/deployment.ts`
—la misma fuente de verdad que ya usa el proyecto para distinguir destinos,
sin introducir una segunda forma de detectar el entorno— y `assetRoute` de
`src/lib/routes.ts` para construir la URL del sitemap sin hardcodear la
unión de `site` + `base`. `src/pages/robots.txt.ts` la envuelve en un
endpoint Astro (`export const GET`) que se pre-renderiza a un archivo real en
ambos destinos, igual que hoy: el sitio sigue sin `output`/`adapter`
configurado en `astro.config.mjs`, así que sigue siendo enteramente estático.

- **`development`** → `User-agent: *` / `Disallow: /`. Coherente con ADR
  0008: si el build ya se marca como no-real en la propia página, no tiene
  sentido dejar que un buscador lo indexe como si lo fuera.
- **`netlify`** → `User-agent: *` / `Allow: /` (indexación completa por
  defecto, para no repetir el error del allowlist descrito arriba), más un
  bloque `Disallow` dirigido a crawlers de entrenamiento de IA, más
  `Sitemap: https://mistorias.pe/sitemap-index.xml`.

  La lista de crawlers bloqueados (`AI_TRAINING_CRAWLERS` en
  `src/lib/seo/robots.ts`) arranca solo con `Bytespider` —decisión explícita
  de alcance, no un descuido: se prefiere una lista mínima que crece cuando
  haga falta en vez de sumar de entrada toda la lista conocida
  (`GPTBot`, `CCBot`, `Google-Extended`, `ClaudeBot`, `meta-externalagent`,
  `Applebot-Extended`, `PerplexityBot`, documentados en el comentario del
  archivo como candidatos futuros). Quien amplíe esa lista debe distinguir el
  bot "de búsqueda" del bot "de entrenamiento" de cada empresa —por ejemplo
  `Applebot` debe seguir permitido; solo `Applebot-Extended` es el de
  entrenamiento— porque bloquear el equivocado rompe la indexación real en
  vez del entrenamiento de IA que se quiere evitar. Esto es una señal de
  preferencia acorde con "No te rastreamos" (`src/pages/codigo.astro`), no un
  control de acceso: por la misma guía de Google citada arriba, un crawler
  que ignora robots.txt sigue pudiendo acceder.

### 2. El sitemap se genera con `@astrojs/sitemap`, no con código propio

`astro.config.mjs` agrega la integración oficial `@astrojs/sitemap`. Lee las
rutas ya generadas en el build —incluidas las dinámicas de `temas/[tema]` e
`historias/[...id]`— y compone las URLs con el mismo `site`/`base` que ya
resuelve `resolveDeploymentConfig`; no hace falta iterar la colección de
historias a mano, ni mantener una segunda lista de rutas.

Se excluyen con la opción `filter`:

- `404` — no es contenido.
- `reportar/` — es soporte (a dónde escribir si algo salió mal), no
  contenido editorial que valga la pena que alguien encuentre buscando.

Todo lo demás navegable entra: `index`, `acerca`, `marca`, `codigo`,
`contenido`, `temas/index`, cada `temas/[tema]`, cada `historias/[id]`. No
hay contenido en borrador que excluir: `storySchema` no tiene un campo de
publicación —todo lo que vive en el submódulo `mistorias-contenido` ya se
trata como publicado.

Se genera igual en ambos destinos: una sola configuración, sin ramificar
`astro.config.mjs` por `DEPLOY_TARGET`. En GitHub Pages es inofensivo porque
su `robots.txt` ya deshabilita el crawleo completo —un crawler que lo
respeta ni siquiera llega a pedir el sitemap.

## Consecuencias

### Positivas

- El sitio real (`mistorias.pe`) queda con un sitemap real y un `robots.txt`
  que dice más que "todo permitido", sin inventar seguridad donde
  `robots.txt` no puede darla.
- El build de desarrollo deja de competir por indexación con el sitio real,
  cerrando la brecha que ADR 0008 dejó abierta para buscadores.
- Cero código propio para recorrer historias/temas: `@astrojs/sitemap` ya lo
  hace a partir de las rutas reales del build.

### Costos

- Dependencia nueva (`@astrojs/sitemap`) que mantener.
- La lista de crawlers de IA bloqueados es manual y puede quedar desactualizada
  si aparecen nuevos bots relevantes; es una decisión consciente de alcance
  mínimo, no un olvido.

## Verificación

Después de desplegar:

1. `curl -s https://mistorias.pe/robots.txt` → debe mostrar `Allow: /`, el
   bloque `Disallow` de `Bytespider` y la línea `Sitemap:`.
2. `curl -s https://mistorias.github.io/mistorias-web/robots.txt` → debe
   mostrar solo `Disallow: /`.
3. `curl -s https://mistorias.pe/sitemap-index.xml` (y el `sitemap-0.xml`
   que enlaza) → confirmar que aparecen todas las historias, temas y páginas
   esperadas, y que **no** aparecen `404` ni `reportar`.
4. Google Search Console (propiedad `mistorias.pe`): revisar que lea
   `robots.txt` sin errores y enviar `sitemap-index.xml` en Sitemaps.
5. Volver a probar una vista previa de enlace (Slack, WhatsApp, X) de una
   historia, para confirmar que el `Allow: /` por defecto no rompió lo que
   construyó ADR 0013.
