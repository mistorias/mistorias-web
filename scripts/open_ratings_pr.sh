#!/usr/bin/env bash
#
# Commitea el conteo de calificaciones en la rama del bot y abre el PR, o lo
# actualiza si ya hay uno abierto. Lo llama
# .github/workflows/actualizar-calificaciones.yml con GH_TOKEN ya definido.
#
# La rama es del bot: se rehace desde la base en cada corrida, así siempre
# refleja el último conteo y no acumula commits viejos (por eso el push es
# --force). Nunca fusiona ni etiqueta: publicar lo decide una persona.
#
# Uso: scripts/open_ratings_pr.sh <archivo-con-el-cuerpo> <rama-base>
# Requiere $BRANCH (rama del bot).

set -euo pipefail

body_file="${1:?Falta el archivo con el cuerpo del PR}"
base="${2:?Falta la rama base}"
branch="${BRANCH:?Falta BRANCH}"

# La fecha es la de Lima, que es la del equipo que revisa el PR.
date="$(TZ=America/Lima date +%Y-%m-%d)"
title="chore(calificaciones): el sitio incluye las calificaciones del ${date}"

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

git checkout -B "$branch"
git add data/ratings.json
git commit -m "$title"
git push --force origin "$branch"

if gh pr view "$branch" --json state --jq '.state' 2>/dev/null | grep -qx OPEN; then
    gh pr edit "$branch" --title "$title" --body-file "$body_file"
else
    gh pr create --head "$branch" --base "$base" \
        --title "$title" --body-file "$body_file"
fi
