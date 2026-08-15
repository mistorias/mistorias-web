---
name: desplegar-contenido
description: >
  Guía paso a paso para publicar contenido editorial nuevo (historias) en
  mistorias-web: actualizar el submódulo de contenido, validar que las
  historias pasan los gates de seguridad y el schema, verificar que el
  listado de la portada y las páginas de etiquetas (índice y detalle)
  muestren las historias y los conteos correctos, confirmar el DEPLOY_TARGET
  correcto para el destino (GitHub Pages o Netlify/mistorias.pe), y evitar
  los incidentes de despliegue ya conocidos en este repo (issue #29: base
  incorrecta publicada en silencio). Usar este skill siempre que se pida
  desplegar, publicar, sacar, subir historias nuevas, actualizar el
  contenido del sitio, o revisar que el conteo de etiquetas o el listado de
  historias esté correcto antes de un release — incluso si no se menciona la
  palabra "skill" o "despliegue" explícitamente.
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
de etiquetas (`/etiquetas` y `/etiquetas/<etiqueta>`) agrupan y cuentan
historias con `groupByTag` (`src/lib/tags.ts`). Si una historia nueva no
trae `tags`, o los trae mal escritos, el conteo cambia sin que ningún test
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

### 2. Validar el contenido: schema y gates de seguridad

```bash
pnpm install --frozen-lockfile   # si no se hizo ya
pnpm build                       # astro check && astro build
```

Si falla, el error dice cuál gate lo detuvo:

- **Frontmatter inválido** → no cumple `storySchema` (falta `title`,
  `summary`, `date`, `author`, o `tags` no es una lista). Corregir en el
  archivo de la historia, dentro del submódulo de contenido.
- **HTML crudo detectado** → `assertStoriesHaveNoRawHtml` encontró una
  etiqueta HTML real en el Markdown. El contenido editorial no debe traer
  HTML ejecutable.
- **Carpeta de imágenes inválida** → revisar la estructura de assets junto a
  la historia (ver ADR 0005).

No hay forma de saltarse estos gates a propósito: son la defensa contra
contenido malicioso o mal formado llegando a producción (ver ADR 0004).

### 3. Verificar el listado de la portada

Con el build corriendo (`pnpm dev` o `pnpm preview` después de `pnpm build`),
revisar `/`:

- La historia con la fecha más reciente debe aparecer como "Última historia"
  (destacada), no en "Historias anteriores".
- Si solo hay una historia, "Historias anteriores" no debe aparecer (el
  layout ya maneja ese caso, pero confirmarlo si acaba de publicarse la
  primera historia de todas).
- El enlace "Explorar las historias por etiqueta" solo aparece si *alguna*
  historia tiene al menos una etiqueta no vacía — si el contenido nuevo trae
  la primera historia con tags del sitio, confirmar que el enlace aparezca.

### 4. Verificar el conteo de etiquetas

Esto es lo más fácil de romper en silencio: una etiqueta mal tipeada (con
mayúscula distinta, un espacio de más, plural vs. singular) no falla el
build — simplemente crea una etiqueta nueva con una sola historia en vez de
sumarse a la existente.

Correr el script de verificación antes de mirar el navegador — genera la
tabla de "cuántas historias debería tener cada etiqueta" leyendo el
contenido directamente:

```bash
node .claude/skills/desplegar-contenido/scripts/check_tag_counts.mjs
```

Comparar esa tabla contra lo que renderiza el sitio:

- `/etiquetas` — cada etiqueta debe mostrar "N historia(s)" igual al script,
  y debe listarlas ordenadas de más a menos historias (empate → alfabético).
- `/etiquetas/<etiqueta>` — el conteo del encabezado y la cantidad de
  tarjetas mostradas deben coincidir con el número del script.

Si algo no coincide, el problema casi siempre está en el frontmatter
(`tags:`) de la historia nueva, no en el código del sitio — `groupByTag`
normaliza a minúsculas y recorta espacios, pero no corrige errores de
tipeo ni singular/plural.

### 5. Confirmar el destino de despliegue

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

### 6. Si se construye o despliega manualmente: validar el artefacto

Si por alguna razón se va a correr `netlify deploy` fuera del workflow (no
es el flujo normal — el workflow ya usa `--no-build` para publicar
exactamente lo que él mismo construyó y validó), replicar el chequeo que
corre en CI antes de subir nada:

```bash
DEPLOY_TARGET=netlify pnpm build
.claude/skills/desplegar-contenido/scripts/check_build_base.sh dist
```

Este script falla si el `dist/` generado todavía contiene referencias a
`/mistorias-web/` — la señal exacta del incidente del issue #29. Un build
para Netlify nunca debe contener esa cadena.

### 7. Publicar

El flujo normal es dejar que CI lo haga:

- **GitHub Pages**: push (o merge) a `main` dispara
  `deploy-github-pages.yml` automáticamente.
- **Netlify / mistorias.pe**: push de un tag dispara
  `deploy-netlify.yml`, que construye, corre el chequeo de base y publica
  con `--no-build --prod`.

No hace falta (ni se recomienda) reemplazar estos workflows con un deploy
manual salvo emergencia — y en ese caso, seguir el paso 6 primero.

## Recordatorios rápidos

- Nunca hardcodear un `href` interno: todo enlace usa los helpers de
  `src/lib/routes.ts`, porque `base` cambia según el destino.
- Un build exitoso no es lo mismo que un listado o un conteo de etiquetas
  correcto — son chequeos independientes, hacer los dos.
- Un `DEPLOY_TARGET` desconocido detiene el build a propósito (no hay
  fallback silencioso) — si un build para producción falla ahí, es una señal
  de que la variable no llegó, no un bug a saltarse.
- `pnpm test` corre con cobertura mínima de 90%; si se tocó código de
  `src/lib` como parte de este trabajo (poco común en un despliegue de solo
  contenido), correrlo también.
