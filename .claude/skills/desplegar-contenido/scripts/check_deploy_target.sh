#!/usr/bin/env bash
#
# Verifica que DEPLOY_TARGET tenga un valor válido antes de invertir tiempo en
# un build. src/lib/deployment.ts ya detiene el build si el valor es
# desconocido (issue #29: antes cualquier valor no reconocido caía en
# GitHub Pages en silencio), pero conviene detectarlo acá, antes de instalar
# dependencias o construir.
#
# Uso: scripts/check_deploy_target.sh <development|netlify>

set -euo pipefail

target="${1:-${DEPLOY_TARGET:-}}"

if [[ -z "$target" ]]; then
    echo "Uso: $0 <development|netlify>" >&2
    echo "O exporta DEPLOY_TARGET antes de llamar al script." >&2
    exit 1
fi

case "$target" in
    development)
        echo "DEPLOY_TARGET=development -> site=https://mistorias.github.io base=/mistorias-web"
        ;;
    netlify)
        echo "DEPLOY_TARGET=netlify -> site=https://mistorias.pe base=/"
        ;;
    *)
        echo "DEPLOY_TARGET desconocido: \"$target\". Destinos válidos: development, netlify." >&2
        exit 1
        ;;
esac
