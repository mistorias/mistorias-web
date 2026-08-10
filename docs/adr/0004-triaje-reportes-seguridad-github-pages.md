# ADR 0004: Triaje de los reportes de seguridad sobre GitHub Pages

## Estado

Aceptado

## Contexto

El [issue #20](https://github.com/mistorias/mistorias-gestion-de-producto/issues/20)
del repo `mistorias-gestion-de-producto` recoge dos reportes de seguridad
generados por Perplexity y ChatGPT sobre `mistorias.github.io/mistorias-web`, el
entorno de desarrollo del sitio.

El propio issue advierte que "puede que los revisores no tengan todo el
contexto". Es una advertencia acertada: el reporte de Perplexity declara
explícitamente que no inspeccionó el repositorio, así que enumera riesgos
genéricos de hosting estático sin poder confirmar cuáles aplican. El reporte de
ChatGPT sí revisó el código y el workflow, y sus hallazgos resultaron
verificables uno a uno.

Por eso el primer trabajo fue **triar**: separar lo confirmado de lo genérico
antes de tocar código, para no gastar esfuerzo en riesgos que no existen ni
inflar la severidad de los que sí.

Durante ese triaje apareció un hallazgo que **ningún reporte detectó** y que
resultó ser el más grave: una afirmación falsa en nuestra propia documentación.

### El hallazgo propio: la validación anti-HTML nunca corrió

`src/lib/content/content-loader.ts` estaba huérfano. Ningún archivo de `src/` lo
importaba — solo `tests/content-flow.spec.ts`. La ruta real de compilación era:

```
src/content.config.ts → loader glob() de Astro → storySchema (solo frontmatter)
                      → <Content /> en src/pages/stories/[...id].astro
```

Astro renderiza HTML crudo dentro de Markdown por defecto y `astro.config.mjs` no
declaraba opciones de `markdown`. Es decir: `assertNoRawHtml()` no se ejecutaba en
ningún build.

Sobre esa protección inexistente teníamos tres capas de falsa confianza:

1. `CLAUDE.md` afirmaba *"This is enforced on every build."*
2. El [ADR 0003](0003-riesgos-seguridad-priorizados.md) §7 afirmaba
   *"Riesgo de contenido — ya mitigado"*.
3. Los tests pasaban en verde probando código muerto.

Un test verde sobre código que nadie invoca es peor que no tener test: produce la
confianza sin el control.

### Hallazgo propio secundario: los tests nunca corrieron en CI

Tampoco existía ningún workflow disparado por pull requests. Los dos workflows
existentes solo despliegan, y `pnpm build` ejecuta `astro check && astro build`,
sin tests. `CONTRIBUTING.md` ya afirmaba que "el CI validará automáticamente".

Sin ese workflow, el test de regresión que pide el reporte de ChatGPT no protege
nada: solo falla en la máquina de quien se acuerde de correrlo.

## Decisión

### Tabla de triaje

| # | Hallazgo (fuente) | Veredicto | Evidencia |
|---|---|---|---|
| 1 | XSS almacenado por HTML crudo en Markdown (ChatGPT, Alta) | **Confirmado — resuelto** | `content.config.ts` usa `glob()`; nada importaba `content-loader.ts` |
| 2 | La CSP de `_headers` no se aplica en GitHub Pages (ChatGPT, Media) | **Confirmado — resuelto** | Pages no emite cabeceras; `public/_headers` es un mecanismo de Netlify |
| 3 | Clickjacking / framing (ChatGPT, Baja) | **Confirmado — aceptado** | `<meta http-equiv>` ignora `frame-ancestors`; en Pages no hay forma de cerrarlo |
| 4 | Instalación flotante de pnpm en CI (ChatGPT, Media) | **Confirmado — resuelto** | `npm install -g pnpm` estaba en **ambos** workflows, no solo el de Pages |
| 5 | Advisories en dependencias de build (ChatGPT, Media) | **Confirmado — resuelto** | `pnpm audit --prod`: 8 altas + 1 moderada, todas transitivas |
| 6 | Los `paths` del workflow omiten cambios de seguridad (ChatGPT, Baja-media) | **Confirmado — resuelto** | El filtro cubría `src/**` y `content/**` únicamente |
| 7 | Secretos/API keys expuestos (Perplexity) | **Ya gestionado** | Sin secretos en el repo; `NETLIFY_AUTH_TOKEN` es GitHub Secret; secret scanning y push protection activos |
| 8 | Dependencias externas / CDN comprometidos (Perplexity) | **No aplica** | Las páginas no cargan ningún recurso de terceros |
| 9 | HTTPS incorrecto / contenido mixto (Perplexity) | **No aplica** | HTTPS y HSTS activos, confirmado por el propio reporte de ChatGPT |
| 10 | Secuestro de cuenta / subdominio github.io (Perplexity) | **Ya gestionado** | ADR 0003 §1: MFA, bloqueo de transferencia, WHOIS privado |
| 11 | Falta de autenticación (Perplexity, A07) | **No aplica** | Sitio público sin paneles ni login, por diseño |
| 12 | Falta de monitorización (Perplexity, A09) | **Riesgo abierto** | Ya registrado en ADR 0003 §6 |
| — | La validación anti-HTML no corría (hallazgo propio) | **Confirmado — resuelto** | `content-loader.ts` no lo importaba nadie en `src/` |
| — | Los tests no corrían en CI (hallazgo propio) | **Confirmado — resuelto** | No existía workflow de `pull_request` |

### 1. HTML crudo en las historias — resuelto

Se agrega `assertStoriesHaveNoRawHtml` en `content-loader.ts` y una integración de
Astro (`no-raw-html-integration.ts`) que la ejecuta en el hook
`astro:config:setup`, activo tanto en `astro dev` como en `astro build`. Quien
edita el contenido ve el error de inmediato y ningún despliegue puede publicar
HTML ejecutable.

Dos decisiones de diseño que conviene dejar registradas:

- **Se valida el texto completo del archivo, sin volver a parsear el
  frontmatter.** Un segundo parser que interpretara el archivo distinto a como lo
  hace el loader `glob()` de Astro sería justamente por donde se colaría un
  bypass de esta validación.
- **Se elimina `loadStories` y `parseFrontmatter`.** Eran código muerto y un
  segundo parser de YAML compitiendo con el de Astro, que queda como única fuente
  de verdad para el frontmatter. La validación del schema pasa a cubrirse en
  `tests/story-schema.spec.ts`, sobre el schema que **sí** corre en el build.

`RAW_HTML_PATTERN` se restringe además a etiquetas HTML reales
(`/<\/?[a-zA-Z][^>]*>/`). El patrón anterior rechazaba prosa legítima como *"la
deserción pasó de < 5% a > 8%"* — un falso positivo inocuo mientras el código
estaba muerto, pero que habría roto historias reales al activar el gate. Hay un
test de regresión que cubre ese caso.

### 2. CSP ausente en GitHub Pages — resuelto

La CSP viaja ahora en un `<meta http-equiv>` dentro de
`src/layouts/BaseLayout.astro`, que es HTML y por tanto aplica en ambos
alojamientos. El layout se introduce además para eliminar la duplicación
completa del esqueleto HTML entre `index.astro` y `stories/[...id].astro`: así la
CSP vive en un solo lugar y no puede divergir entre rutas.

`script-src` queda en `'none'` en el `<meta>` y en `public/_headers`, que antes
declaraba `'self'`. El sitio no envía JavaScript, así que es la barrera más
estricta disponible.

> **Aviso para quien venga después:** el día que se use una island de Astro, view
> transitions, o cualquier script propio, `script-src 'none'` bloqueará la página
> en el navegador **sin romper el build**. Hay que relajarlo a `'self'` en los dos
> archivos a la vez.

### 3. Clickjacking en GitHub Pages — aceptado

Un `<meta http-equiv>` **no puede** expresar `frame-ancestors`; la especificación
de CSP lo ignora en `<meta>`, igual que `report-uri` y `sandbox`. Y GitHub Pages
no permite configurar cabeceras HTTP de ninguna forma.

Por lo tanto el sitio de desarrollo es embebible en un iframe y no hay manera de
impedirlo mientras siga en Pages. Se acepta: no hay cuentas, formularios ni
operaciones sensibles que un ataque de superposición pudiera capturar. En
producción sí está cubierto, por `X-Frame-Options: DENY` y `frame-ancestors
'none'` en `public/_headers`.

Es la contrapartida concreta de la doble superficie pública que el ADR 0003 §3
aceptó como costo del flujo de desarrollo.

### 4. Instalación flotante de pnpm — resuelto

`corepack enable` reemplaza a `npm install -g pnpm` en los dos workflows: lee el
campo `packageManager` de `package.json`, así que la versión queda fijada sin
duplicar el número en el YAML. El reporte solo señalaba el workflow de Pages,
pero el de Netlify —que despliega producción— tenía el mismo problema.

### 5. Advisories en dependencias de build — resuelto

Se extiende `overrides` en `pnpm-workspace.yaml` para svgo, sharp, js-yaml,
nanoid, postcss y fast-uri. `pnpm audit --prod` queda limpio.

Sobre la severidad: las nueve advisories son **transitivas y de tiempo de
compilación**, bajo `astro` y `@astrojs/check`. Nada de esto llega al navegador
de un lector, y explotarlas exigiría procesar un recurso hostil durante el build.
Se resuelven porque cuesta poco, no porque el riesgo fuera urgente.

Cada override se acota a su línea mayor (`'>=4.3.1 <5'` y equivalentes). Sin ese
tope, el override de js-yaml resuelve a la 5.x, que es solo ESM y deja de exponer
el export `default` que usa la CLI de Astro: el build falla al arrancar. El
objetivo es tomar el parche, no arrastrar un cambio de mayor en una dependencia
transitiva.

### 6. Paths del workflow de despliegue — resuelto

Se elimina el filtro `paths` de `deploy-github-pages.yml` en vez de ampliarlo:
una lista de rutas se desactualiza en silencio y vuelve a producir el mismo
problema. El entorno de desarrollo debe reflejar `main` siempre; el costo son
algunos builds extra que no tocan producción.

### 7. Verificación automática en pull requests — resuelto

Nuevo `.github/workflows/ci.yml`, disparado en `pull_request` y en `push` a
`main`: tests, type check, build y `pnpm audit --prod`.

El paso de audit es **bloqueante a propósito**. El árbol queda sin advisories, así
que cualquier hallazgo nuevo pone el CI en rojo y Dependabot —ya configurado con
revisión semanal— tiene que resolverlo antes de que se publique. Es lo que
convierte el test de regresión del gate anti-HTML en un control real y no en un
archivo decorativo.

## Riesgos descartados

Los hallazgos 8, 9 y 11 del reporte de Perplexity no aplican a este sitio, y su
propio reporte lo reconoce al declarar que no inspeccionó el repositorio:

- **Dependencias externas / CDN comprometidos:** las páginas generadas no cargan
  ningún script, estilo, fuente ni imagen de terceros. El reporte de ChatGPT lo
  confirma de forma independiente.
- **HTTPS incorrecto o contenido mixto:** HTTPS y HSTS están activos; no hay
  recursos `http://` en las plantillas.
- **Falta de autenticación:** el sitio es público por diseño. El vector real
  —robo de credenciales de GitHub— es el riesgo #1 del ADR 0003, ya gestionado.

## Controles ya gestionados, confirmados durante este triaje

- **Secret scanning y push protection activos** en `mistorias-web` y en
  `mistorias-contenido` (confirmado por el equipo el 2026-08-09). Cierra la
  recomendación de escaneo de secretos del reporte de Perplexity, incluido el
  historial de commits que menciona, sin trabajo pendiente.
- MFA, bloqueo de transferencia de dominio y privacidad WHOIS: ADR 0003 §1.
- Actions pineadas por hash, `--frozen-lockfile`, submódulo fijado por commit,
  `permissions: contents: read`: ADR 0003 §1.

## Riesgos que siguen abiertos

- **Clickjacking en el entorno de desarrollo** (ver decisión 3): aceptado, sin
  solución posible en GitHub Pages.
- **Falta de visibilidad continua** (ADR 0003 §6): sigue abierto. Este cambio no
  lo toca.
- **Auditoría periódica de accesos de administrador** (ADR 0003 §1): práctica
  recurrente, no un pendiente puntual.

## Consecuencias

### Positivas

- La validación anti-HTML pasa de ser una afirmación en la documentación a un
  control que efectivamente detiene el build, con test de regresión que lo cubre.
- Los tests corren en cada pull request, así que las protecciones no pueden
  volver a quedar huérfanas en silencio.
- La CSP aplica en los dos alojamientos, no solo en producción.
- Las versiones de pnpm y de las dependencias transitivas son reproducibles.

### Costos

- `script-src 'none'` es una trampa diferida: no rompe el build, rompe el
  navegador el día que se agregue JavaScript. Queda avisado arriba y en el
  comentario de `BaseLayout.astro`.
- El audit bloqueante hará fallar el CI cuando aparezca una advisory nueva en una
  dependencia transitiva, aunque no sea explotable en este sitio. Es el
  comportamiento buscado, pero implica atender esos rojos.
- Quitar el filtro `paths` genera builds de Pages que antes no ocurrían.

## Testing

- `pnpm test` — 10 tests, incluidos el de HTML ejecutable y el de falso positivo
  con `<` y `>` en prosa.
- `pnpm build` — falla con `Raw HTML is not allowed in ...` si se agrega
  `<script>` a una historia; verificado durante este cambio.
- `pnpm audit --prod` — sin advisories.
- `grep -o 'http-equiv="Content-Security-Policy"' dist/**/*.html` — la CSP está en
  las dos páginas generadas.
