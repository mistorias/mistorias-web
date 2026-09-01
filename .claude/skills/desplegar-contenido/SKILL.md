---
name: desplegar-contenido
description: >
  Guía paso a paso para publicar contenido editorial nuevo (historias) en
  mistorias-web: actualizar el submódulo de contenido, validar que las
  historias pasan los gates de seguridad y el schema, verificar que el
  listado de la portada y las páginas de temas (índice y detalle)
  muestren las historias y los conteos correctos, confirmar el DEPLOY_TARGET
  correcto para el destino (GitHub Pages o Netlify/mistorias.pe), y evitar
  los incidentes de despliegue ya conocidos en este repo (issue #29: base
  incorrecta publicada en silencio). Solo se invoca explícitamente (por
  nombre o con `/desplegar-contenido`) — no se debe activar por inferencia a
  partir de menciones sueltas de "desplegar", "publicar" o "contenido".
---

# Desplegar contenido nuevo en Mistorias

Este skill cubre el flujo completo desde que hay historias nuevas en el
submódulo de contenido hasta que quedan publicadas, con los chequeos que
antes había que hacer a mano (y que ya causaron un incidente real en
producción — ver issue #29 y `src/lib/deployment.ts`).

## Por qué cada paso importa

El contenido editorial vive en un repo separado
(`github.com/mistorias/mistorias-contenido`), montado como submódulo en
`content/mistorias-contenido/`. El sitio lo consume vía Astro Content
Collections (`src/content.config.ts`), validado contra `storySchema`
(`src/lib/content/schema.ts`) y contra varios *gates* de seguridad que
corren como integraciones de Astro (`astro.config.mjs`): HTML crudo
(`raw-html-gate.ts`), carpetas de imágenes (`story-asset-folders.ts`) y el
símbolo de marca. Todos fallan el build si algo no cumple — así que un
`pnpm build` limpio ya es la primera señal de que el contenido es publicable.

Pero un build limpio no garantiza que el sitio se *vea* bien: la portada
decide sola cuál historia es la "destacada" (la más reciente, vía
`sortByDateDescending`) y cuáles van a "Historias anteriores"; las páginas
de temas (`/temas` y `/temas/<tema>`) agrupan y cuentan
historias con `groupByTheme` (`src/lib/themes.ts`). Si una historia nueva no
trae `themes`, o los trae mal escritos, el conteo cambia sin que ningún test
lo detecte solo. Por eso este skill pide revisar esas páginas
específicamente, no solo confiar en que el build pasó.

Por último, el destino de publicación (GitHub Pages vs. Netlify) cambia
`base` y `site` según `DEPLOY_TARGET` (`src/lib/deployment.ts`). Un valor
desconocido detiene el build a propósito — antes no lo hacía, y eso publicó
mistorias.pe con la base de GitHub Pages, sin estilos y con todos los
enlaces rotos, sin que el build fallara (issue #29). El paso de verificación
del destino existe para no repetir ese incidente.

## Flujo paso a paso

### 1. Traer el contenido nuevo

```bash
git submodule update --init --recursive
cd content/mistorias-contenido && git fetch origin && git checkout origin/main && cd -
```

Si el contenido ya venía como parte de un checkout `--recursive` (como hace
CI), este paso es solo para confirmar el commit que se va a publicar:

```bash
git submodule status
```

Si el submódulo queda en un commit distinto al que estaba antes de este
despliegue, ese es el diff de contenido que se va a publicar — vale la pena
mencionarlo en el commit del bump (`chore(contenido): ...`, ver
`git log --oneline` para el estilo de mensajes usados antes).

### 2. Regenerar el orden cronológico de historias

`data/story-order.json` es el cache versionado (commiteado en git, ver
[ADR 0012](../../../docs/adr/0012-cache-versionado-orden-cronologico-historias.md))
que usa cada página de historia para calcular los enlaces "anterior" y
"siguiente". El build nunca lo escribe — es responsabilidad de quien trae
contenido nuevo correrlo y commitearlo:

```bash
pnpm story-order
```

Si el hash del orden actual ya coincide con el del cache, el script no
escribe nada y lo dice explícitamente ("ya está al día"). Si hace falta
forzar la reescritura sin importar el hash:

```bash
pnpm story-order -- --rebuild
```

Commitear `data/story-order.json` junto con el cambio de contenido (bump del
submódulo). Si se omite este paso, el sitio sigue siendo correcto — el build
cae al cálculo en memoria (ver `resolveNeighbors`) — pero el cache
commiteado queda desactualizado y dejará de ser el artefacto auditable que
busca el ADR 0012.

### 3. Validar el contenido: schema y gates de seguridad

```bash
pnpm install --frozen-lockfile   # si no se hizo ya
pnpm build                       # astro check && astro build
```

Si falla, el error dice cuál gate lo detuvo:

- **Frontmatter inválido** → no cumple `storySchema` (falta `title`,
  `summary`, `date`, `author`, o `themes` no es una lista). Corregir en el
  archivo de la historia, dentro del submódulo de contenido.
- **HTML crudo detectado** → `assertStoriesHaveNoRawHtml` encontró una
  etiqueta HTML real en el Markdown. El contenido editorial no debe traer
  HTML ejecutable.
- **Carpeta de imágenes inválida** → revisar la estructura de assets junto a
  la historia (ver ADR 0005).

No hay forma de saltarse estos gates a propósito: son la defensa contra
contenido malicioso o mal formado llegando a producción (ver ADR 0004).

### 4. Verificar el listado de la portada

Con el build corriendo (`pnpm dev` o `pnpm preview` después de `pnpm build`),
revisar `/`:

- La historia con la fecha más reciente debe aparecer como "Última historia"
  (destacada), no en "Historias anteriores".
- Si solo hay una historia, "Historias anteriores" no debe aparecer (el
  layout ya maneja ese caso, pero confirmarlo si acaba de publicarse la
  primera historia de todas).
- El enlace "Explorar las historias por tema" solo aparece si *alguna*
  historia tiene al menos un tema no vacío — si el contenido nuevo trae la
  primera historia con temas del sitio, confirmar que el enlace aparezca.

### 5. Verificar el conteo de temas

Esto es lo más fácil de romper en silencio: un tema mal tipeado (con
mayúscula distinta, un espacio de más, plural vs. singular) no falla el
build — simplemente crea un tema nuevo con una sola historia en vez de
sumarse al existente.

Correr el script de verificación antes de mirar el navegador — genera la
tabla de "cuántas historias debería tener cada tema" leyendo el contenido
directamente:

```bash
node .claude/skills/desplegar-contenido/scripts/check_theme_counts.mjs
```

Comparar esa tabla contra lo que renderiza el sitio:

- `/temas` — cada tema debe mostrar "N historia(s)" igual al script, y debe
  listarlos ordenados de más a menos historias (empate → alfabético).
- `/temas/<tema>` — el conteo del encabezado y la cantidad de tarjetas
  mostradas deben coincidir con el número del script.

- En cada `/historias/<slug>`, el pie "Temas relacionados" debe listar los
  mismos temas del frontmatter y el enlace "Explorar otros temas" debe
  llevar a `/temas`.

Si algo no coincide, el problema casi siempre está en el frontmatter
(`themes:`, o `tags:` si la historia todavía no migró) de la historia nueva,
no en el código del sitio — `groupByTheme` normaliza a minúsculas y recorta
espacios, pero no corrige errores de tipeo ni singular/plural.

### 6. Confirmar el destino de despliegue

Antes de construir para publicar (no para desarrollo local), confirmar que
`DEPLOY_TARGET` es el correcto para dónde va a vivir este contenido:

```bash
.claude/skills/desplegar-contenido/scripts/check_deploy_target.sh netlify      # o development
```

- `development` → GitHub Pages, se publica solo con push a `main` (workflow
  `deploy-github-pages.yml`).
- `netlify` → mistorias.pe, se publica con un push de tag (workflow
  `deploy-netlify.yml`).

Si el despliegue va por CI (lo normal), no hace falta construir localmente
con esa variable — los workflows ya la fijan. Este paso importa sobre todo
si se va a correr `pnpm build` o `netlify deploy` a mano.

### 7. Si se construye o despliega manualmente: validar el artefacto

Si por alguna razón se va a correr `netlify deploy` fuera del workflow (no
es el flujo normal — el workflow ya usa `--no-build` para publicar
exactamente lo que él mismo construyó y validó), correr el mismo chequeo que
corre en CI antes de subir nada:

```bash
DEPLOY_TARGET=netlify pnpm build
scripts/check_build_base.sh dist
```

`scripts/check_build_base.sh` (en la raíz del repo, no dentro de este
skill) es el único lugar donde vive esta lógica: el paso "Check the artifact
is not built for GitHub Pages" de `.github/workflows/deploy-netlify.yml`
llama al mismo script en vez de tener el chequeo duplicado inline. Si el
chequeo necesita cambiar, se edita ahí una sola vez y tanto CI como
cualquier corrida local quedan al día.

Falla si el `dist/` generado todavía contiene referencias a
`/mistorias-web/` — la señal exacta del incidente del issue #29. Un build
para Netlify nunca debe contener esa cadena.

### 8. Publicar

El flujo normal es dejar que CI lo haga:

- **GitHub Pages**: push (o merge) a `main` dispara
  `deploy-github-pages.yml` automáticamente.
- **Netlify / mistorias.pe**: push de un tag dispara
  `deploy-netlify.yml`, que construye, corre el chequeo de base y publica
  con `--no-build --prod`.

**Nunca publicar a Netlify si no es a través de un tag.** No hay un flujo
alterno válido: nada de `netlify deploy --prod` desde una máquina local,
desde `main`, ni disparando `deploy-netlify.yml` por `workflow_dispatch`
como atajo habitual — el tag es la única vía normal, porque es lo que dispara
el workflow que construye con el `DEPLOY_TARGET` correcto, corre
`scripts/check_build_base.sh` sobre el artefacto y recién entonces publica
con `--no-build --prod`. Un deploy que se salte ese camino puede repetir el
incidente del issue #29 (base de GitHub Pages publicada en mistorias.pe) sin
que nada lo detenga a tiempo. Un deploy manual (paso 7) es solo para
emergencia declarada, nunca la vía por defecto.

No hace falta (ni se recomienda) reemplazar estos workflows con un deploy
manual salvo emergencia — y en ese caso, seguir el paso 7 primero.

## Recordatorios rápidos

- Nunca hardcodear un `href` interno: todo enlace usa los helpers de
  `src/lib/routes.ts`, porque `base` cambia según el destino.
- Un build exitoso no es lo mismo que un listado o un conteo de temas
  correcto — son chequeos independientes, hacer los dos.
- Un `DEPLOY_TARGET` desconocido detiene el build a propósito (no hay
  fallback silencioso) — si un build para producción falla ahí, es una señal
  de que la variable no llegó, no un bug a saltarse.
- `pnpm test` corre con cobertura mínima de 90%; si se tocó código de
  `src/lib` como parte de este trabajo (poco común en un despliegue de solo
  contenido), correrlo también.
- **Netlify (mistorias.pe) se publica solo vía push de tag.** Nunca a mano,
  nunca desde `main`. Ver paso 8.
- Contenido nuevo o re-fechado siempre trae consigo un `data/story-order.json`
  regenerado (paso 2) — no es opcional ni un detalle de "nice to have": es
  parte del mismo cambio.
