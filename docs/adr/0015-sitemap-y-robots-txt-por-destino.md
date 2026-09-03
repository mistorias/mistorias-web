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
  sentido dejar que un buscador lo indexe como si lo fuera. **Este archivo por
  sí solo no logra eso** —ver §3— pero se mantiene como señal de mejor
  esfuerzo: no cuesta nada y documenta la intención aunque un crawler nunca
  lo lea desde ahí.
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

**No se genera en `development`** (`astro.config.mjs` solo registra la
integración `sitemap()` cuando `!isDevelopmentTarget(...)`) — ver §3 para el
porqué: no es una simplificación, es lo que corrige un error de la primera
versión de este ADR.

### 3. `robots.txt` no alcanza en GitHub Pages: por qué hace falta `<meta name="robots">`

La primera versión de este ADR asumía que `Disallow: /` en el `robots.txt`
de `development` bastaba para que ese destino "no compitiera por indexación".
Es falso: la norma de robots.txt solo se lee en la raíz del origen
(`https://mistorias.github.io/robots.txt`, que pertenece a otro repo —el de
la página de usuario/organización, no este). GitHub Pages sirve este sitio
bajo `/mistorias-web` (`resolveDeploymentConfig("development").base`), así
que ningún crawler llega jamás a leer el `Disallow: /` que
`src/lib/seo/robots.ts` genera en `https://mistorias.github.io/mistorias-web/robots.txt`
—un `curl` a esa URL confirma que el archivo dice lo correcto, pero no que
algo lo use (issue detectado en revisión de
[PR #94](https://github.com/mistorias/mistorias-web/pull/94#discussion_r3926434101)).

Esto ya era cierto **antes** de este PR —el `robots.txt` viejo, con
`Allow: /`, tampoco se leía nunca desde la raíz real—, pero no importaba
porque no había nada que proteger. Con este cambio sí importa: sin
corrección, `development` pasaría a tener un `sitemap-index.xml` real y
completamente rastreable, dejando el build de trabajo en progreso *más*
descubrible que antes del PR, exactamente lo opuesto de lo que ADR 0008
busca.

La corrección tiene dos partes, ninguna de las cuales depende de dónde vive
`robots.txt`:

1. **`BaseLayout.astro` agrega `<meta name="robots" content="noindex, nofollow">`**
   cuando `isDevelopmentTarget(process.env.DEPLOY_TARGET)`, mismo punto de
   entrada y mismo patrón condicional que ya usa el marcador "WIP:" del
   título (issue #28). A diferencia de `robots.txt`, una etiqueta `<meta>` se
   lee por página, así que no importa bajo qué subpath cuelgue el sitio.
2. **No se genera sitemap para `development`** (§2): no tiene sentido
   publicar un mapa completo de URLs de un build que se marca `noindex` en
   cada una de ellas.

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
- `robots.txt` sigue sin ser una barrera real bajo `/mistorias-web` (§3): solo
  documenta intención. Cualquier decisión futura de "bloquear X en
  `development`" tiene que pasar por `<meta name="robots">` en
  `BaseLayout.astro`, no por `src/lib/seo/robots.ts`.

## Verificación

Después de desplegar:

1. `curl -s https://mistorias.pe/robots.txt` → debe mostrar `Allow: /`, el
   bloque `Disallow` de `Bytespider` y la línea `Sitemap:`.
2. `curl -s https://mistorias.github.io/mistorias-web/robots.txt` → muestra
   `Disallow: /`, pero esto es solo el archivo, no la barrera real (§3) — no
   basta con este paso.
3. `curl -s https://mistorias.github.io/mistorias-web/ | grep 'name="robots"'`
   → debe mostrar `<meta name="robots" content="noindex, nofollow">`. Esta es
   la comprobación que sí importa para `development`.
4. `curl -s https://mistorias.github.io/mistorias-web/sitemap-index.xml` →
   debe responder 404: no se genera sitemap para este destino.
5. `curl -s https://mistorias.pe/sitemap-index.xml` (y el `sitemap-0.xml`
   que enlaza) → confirmar que aparecen todas las historias, temas y páginas
   esperadas, y que **no** aparecen `404` ni `reportar`.
6. Google Search Console (propiedad `mistorias.pe`): revisar que lea
   `robots.txt` sin errores y enviar `sitemap-index.xml` en Sitemaps.
7. Volver a probar una vista previa de enlace (Slack, WhatsApp, X) de una
   historia, para confirmar que el `Allow: /` por defecto no rompió lo que
   construyó ADR 0013.
