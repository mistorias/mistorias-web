#!/usr/bin/env bash
#
# Arma la descripción del PR que abre actualizar-contenido.yml, siguiendo las
# secciones de .github/pull_request_template.md que aplican a un bump de
# contenido: qué, por qué y cómo verificar. Incluye los commits que entran y
# la tabla de conteo por tema, porque un tema mal escrito no falla el build:
# crea un tema nuevo con una sola historia.
#
# Uso: scripts/build_content_pr_body.sh <commit-anterior> <commit-nuevo> [ruta-al-submodulo]
# Escribe el Markdown en la salida estándar.

set -euo pipefail

anterior="${1:?Falta el commit anterior}"
nuevo="${2:?Falta el commit nuevo}"
content_path="${3:-${CONTENT_PATH:-content/mistorias-contenido}}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cat <<MD
## Qué

El submódulo \`$content_path\` avanza a \`${nuevo:0:7}\` (antes \`${anterior:0:7}\`) y el orden cronológico de historias queda al día.

## Por qué

Hay contenido nuevo en [mistorias-contenido](https://github.com/mistorias/mistorias-contenido) que todavía no está en el sitio. Cambios que entran:

MD

git -C "$content_path" log --no-merges --format='- %s (`%h`)' "$anterior..$nuevo"

cat <<'MD'

## Cómo verificar

- [x] `pnpm build` pasó en el workflow (schema y gates de seguridad)
- [ ] La historia más reciente aparece como destacada en la portada
- [ ] Los conteos de `/temas` coinciden con la tabla de abajo; un tema mal escrito no falla el build, crea un tema nuevo con una sola historia

<details><summary>Conteo esperado por tema</summary>

```
MD

node "$repo_root/.claude/skills/desplegar-contenido/scripts/check_theme_counts.mjs"

cat <<'MD'
```

</details>

Fusionar este PR a `main` publica en GitHub Pages. Mistorias.pe se publica aparte, con un tag.

---
_Abierto por el workflow `Actualizar contenido`._
MD
