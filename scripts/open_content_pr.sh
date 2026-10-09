#!/usr/bin/env bash
#
# Commitea el avance del contenido en la rama del bot y abre el PR, o lo
# actualiza si ya hay uno abierto. Lo llama
# .github/workflows/actualizar-contenido.yml con GH_TOKEN ya definido.
#
# La rama es del bot: se rehace desde la base en cada corrida, así siempre
# refleja el último contenido y no acumula commits viejos (por eso el push es
# --force). Nunca fusiona ni etiqueta: publicar lo decide una persona.
#
# Uso: scripts/open_content_pr.sh <commit-nuevo> <archivo-con-el-cuerpo> <rama-base>
# Requiere $BRANCH (rama del bot) y, opcionalmente, $CONTENT_PATH.

set -euo pipefail

next="${1:?Falta el commit nuevo}"
body_file="${2:?Falta el archivo con el cuerpo del PR}"
base="${3:?Falta la rama base}"
branch="${BRANCH:?Falta BRANCH}"
content_path="${CONTENT_PATH:-content/mistorias-contenido}"

title="chore(contenido): el sitio incluye el contenido de \`${next:0:7}\`"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git checkout -B "$branch"
git add "$content_path" data/story-order.json
git commit -m "$title"
git push --force origin "$branch"

if gh pr view "$branch" --json state --jq '.state' 2>/dev/null | grep -qx OPEN; then
    gh pr edit "$branch" --title "$title" --body-file "$body_file"
else
    gh pr create --head "$branch" --base "$base" \
        --title "$title" --body-file "$body_file"
fi
