# ADR 0037: La seguridad del pipeline se comprueba con checks, no con revisión de memoria

## Estado

Aceptado

## Contexto

El objetivo de fondo es que un PR del bot llegue al entorno de desarrollo
(`main`, GitHub Pages) sin que una persona lo fusione a mano, y que producción
siga dependiendo de un tag explícito (CLAUDE.md, "Never deploy without an
explicit instruction"). Para fiarse de eso, lo que hoy se revisa mirando tiene
que pasar a ser un check que falla.

El diagrama de todo el flujo y de los cuatro conjuntos de cambios en que se
construye está en [fabrica.svg](../fabrica.svg). Este ADR cubre el primero:
seguridad. Los otros tres (funcional, accesibilidad y rendimiento;
mantenimiento; fábricas) irán en ADR propios.

Antes de este cambio:

- Los workflows no pasaban por ningún auditor. Había entradas interpoladas en
  `run:` (`steps.cambios.outputs.archivos`, `default_branch`, `page_url`),
  credenciales que los checkouts dejaban en git sin necesitarlas y un token del
  App con todos los permisos de su instalación.
- La CSP vive en dos sitios (`<meta>` de `BaseLayout.astro` y
  `public/_headers`) y nada obligaba a que coincidieran.
- El build no falla si el HTML trae un `<script>` o carga algo de otro origen:
  el navegador lo bloquea en silencio y la página se rompe solo allí.
- No había regla escrita en código sobre qué puede fusionarse sin una persona.

## Decisión

### 1. Los workflows se auditan

El job `workflows` de `ci.yml` corre zizmor (fijado a una versión, en línea, con
el token de solo lectura) y actionlint (versión y suma de verificación fijas). Es
bloqueante. Las excepciones viven en `.github/zizmor.yml`, cada una con su motivo:
los dos workflows que empujan una rama necesitan el token del App en git, y los
dos que usan `issue_comment` y `pull_request_target` lo hacen a propósito.

Con ello: cada entrada llega al script por una variable de entorno y no
interpolada; los checkouts usan `persist-credentials: false`; todo job tiene
`timeout-minutes`; el App pide solo `contents` y `pull-requests`; los jobs que
publican artefactos no usan la caché del gestor de paquetes; y el auto-merge de
Dependabot decide por el autor del PR (`pull_request.user.login`) y no por
`github.actor`, que cambia con quien empuja.

`revisar-dependencias` (`dependency-review-action`) bloquea, en los PR, una
dependencia nueva con una vulnerabilidad moderada o peor o con licencia GPL/AGPL.
Complementa a `pnpm audit --prod`, que mira lo ya instalado.

### 2. La CSP es una sola

`tests/csp-parity.spec.ts` exige que la cabecera de `public/_headers` tenga las
mismas directivas que el `<meta>` más `frame-ancestors 'none'` (un `<meta>` no
puede expresarla), y que las demás cabeceras de seguridad sigan presentes.

### 3. El HTML construido cumple lo que promete la CSP

`pnpm check-dist` (`scripts/check-dist.ts`, sobre `src/lib/security/dist-scan.ts`)
recorre `dist/` y falla ante un `<script>`, un manejador de evento, una URL
`javascript:`, un recurso que la CSP bloquearía por venir de otro origen, o un
`target="_blank"` sin `noopener noreferrer`. El job `revisar-dist` lo corre sobre
los dos destinos (`development` y `netlify`), porque cada uno cambia la base de
los enlaces y un error puede aparecer en uno solo (issue #29). En `netlify` corre
además `check_build_base.sh`.

### 4. La política SemVer decide qué se fusiona solo

El check requerido `politica-semver` (`.github/workflows/politica-semver.yml`,
`src/lib/release/merge-policy.ts`) solo opina sobre PRs del bot. Un PR del bot
espera a una persona si:

- la subida es **minor o major**: la mayor entre el título del PR (que con squash
  es el commit que queda), cada commit, el tipo del issue que cierra (un
  *Feature* es al menos minor, y el bot no elige ese dato) y los archivos nuevos
  en `src/pages/`, `src/components/` o `src/layouts/`;
- toca **rutas protegidas**: workflows, `.claude/`, scripts, configuración de
  build y de pruebas, CSP, gates, el propio clasificador;
- trae commits que no son del bot, o no se puede clasificar (ante la duda,
  decide una persona).

La aprobación vale si es de `OWNER` o `MEMBER`, no del bot, y **sobre el último
commit**: empujar de nuevo la invalida. Con el auto-merge activado, GitHub retiene
el PR hasta que el check pase, así que la aprobación hace de clic.

Usa el mismo clasificador que decide la versión (`classifyCommit`), así que la
regla del merge y la del release no pueden divergir.

**Un revert hereda la subida de lo que revierte.** Revertir una funcionalidad
la quita del sitio: es minor, no patch. Solo es patch si la aplicación conserva
su funcionalidad. Un revert se clasifica por el pie `This reverts commit <hash>`,
y si el original no se encuentra, decide una persona. Dentro de un mismo rango de
release, una funcionalidad y su revert se anulan: la versión no sube por algo que
nunca salió (`next-version.ts`).

**Dónde corre.** `pull_request_target` ejecuta el workflow de la rama base, y el
script se baja de la base: un PR no puede reescribir la regla con la que se lo
juzga. El job no ejecuta código del PR; solo lee datos por la API. La revisión
(`pull_request_review`) usa el workflow del PR, pero cambiar `.github/` ya exige
aprobación, y la persona aprueba viendo ese cambio.

**Reutilizable.** mistorias-contenido lo llama con `workflow_call`, fijado por SHA
y con sus propias rutas protegidas, para que haya una sola implementación.

## Consecuencias

- Los PRs del bot de versión y de contenido (`version/subir`, `contenido/actualizar`)
  tocan `package.json` o el puntero del submódulo, que son rutas protegidas, y hoy se fusionan a mano. Cuando se
  construya su auto-merge se les dará una guardia propia (solo ese archivo, solo
  esa línea) en lugar de aflojar las rutas protegidas.
- Sin la variable `CONTENT_BOT_LOGIN` (el login del App, `<slug>[bot]`), el check
  de web falla al evaluarse: es un prerrequisito de activar el check como requerido.
- Si GitHub tarda en propagar la aprobación, el check puede quedar rojo unos
  segundos tras aprobar. Re-ejecutarlo lo resuelve; no hay que tocar el PR.
- Un grupo de 30 o más commits en un PR del bot siempre pasa por una persona.

## Alternativas descartadas

- **Aprobación obligatoria a nivel de ruleset.** Pediría una persona también para
  los PR de patch del bot, que es justo lo que se quiere evitar.
- **Ejecutar la política con `pull_request`.** El PR podría editar el workflow o
  el script y pasarse a sí mismo.
- **Verificar enlaces a las fuentes de las historias en CI.** Muchos sitios
  rechazan al bot aunque la noticia exista; da bloqueos falsos.
