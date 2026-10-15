#!/usr/bin/env bash
#
# Commitea la subida de versión en la rama del bot y abre el PR, o lo
# actualiza si ya hay uno abierto. Lo llama
# .github/workflows/subir-version.yml con GH_TOKEN ya definido, después de
# scripts/check_version_only_diff.sh.
#
# Igual que scripts/open_content_pr.sh: la rama es del bot y se rehace desde
# la base en cada corrida (por eso el push es --force). Nunca fusiona ni
# etiqueta: publicar lo decide una persona.
#
# Uso: scripts/open_version_pr.sh <version-anterior> <version-nueva> <archivo-con-el-cuerpo> <rama-base>
# Requiere $BRANCH (rama del bot).

set -euo pipefail

previous="${1:?Falta la versión anterior}"
next="${2:?Falta la versión nueva}"
body_file="${3:?Falta el archivo con el cuerpo del PR}"
base="${4:?Falta la rama base}"
branch="${BRANCH:?Falta BRANCH}"

title="chore: la versión va de ${previous} a ${next}"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git checkout -B "$branch"
git add package.json
git commit -m "$title"
git push --force origin "$branch"

if gh pr view "$branch" --json state --jq '.state' 2>/dev/null | grep -qx OPEN; then
    gh pr edit "$branch" --title "$title" --body-file "$body_file"
else
    gh pr create --head "$branch" --base "$base" \
        --title "$title" --body-file "$body_file"
fi
