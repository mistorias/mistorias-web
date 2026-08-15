#!/usr/bin/env bash
#
# Replica localmente el chequeo que ya corre en
# .github/workflows/deploy-netlify.yml antes de publicar en mistorias.pe: si
# el artefacto de build conserva la base de GitHub Pages (/mistorias-web/),
# el sitio de Netlify se publica sin estilos y con cada enlace roto, y el
# build no falla solo por eso (issue #29). Correr esto en local antes de un
# `netlify deploy` manual, o para diagnosticar un artefacto sospechoso.
#
# Uso: scripts/check_build_base.sh [ruta-al-dist] [base-prohibida]
# Por defecto revisa ./dist buscando "/mistorias-web/".

set -euo pipefail

dist_dir="${1:-dist}"
forbidden_base="${2:-/mistorias-web/}"

if [[ ! -d "$dist_dir" ]]; then
    echo "No existe \"$dist_dir\". Corre \"pnpm build\" primero." >&2
    exit 1
fi

if grep -rl "\"$forbidden_base" "$dist_dir" > /dev/null 2>&1; then
    echo "El artefacto en \"$dist_dir\" conserva la base \"$forbidden_base\"." >&2
    echo "Si el destino es Netlify (mistorias.pe), el build corrió sin DEPLOY_TARGET=netlify." >&2
    grep -rl "\"$forbidden_base" "$dist_dir" >&2
    exit 1
fi

echo "OK: \"$dist_dir\" no contiene referencias a la base \"$forbidden_base\"."
