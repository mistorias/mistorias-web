#!/usr/bin/env bash
#
# Falla si el cambio sin commitear es algo distinto de una sola línea
# "version" en package.json. Lo corre .github/workflows/subir-version.yml
# antes de abrir el PR de versión, para que ese PR nunca lleve otro cambio
# por accidente (issue #194).
#
# Es también el mecanismo de seguridad del que partirá un eventual auto-merge
# de estos PR: si el diff es solo esa línea, no hay nada más que revisar.
#
# Uso: scripts/check_version_only_diff.sh

set -euo pipefail

numstat="$(git diff HEAD --numstat)"
untracked="$(git ls-files --others --exclude-standard)"

if [[ "$numstat" != $'1\t1\tpackage.json' || -n "$untracked" ]]; then
    echo "El cambio debe ser solo la línea \"version\" de package.json, y es:" >&2
    git diff HEAD --stat >&2
    [[ -n "$untracked" ]] && echo "Archivos sin trackear: $untracked" >&2
    exit 1
fi

changed_lines="$(git diff HEAD --unified=0 package.json | grep -E '^[-+] ' || true)"
version_pattern='^[-+]  "version": "[0-9]+\.[0-9]+\.[0-9]+",$'

if grep -qvE "$version_pattern" <<<"$changed_lines"; then
    echo "La línea cambiada en package.json no es \"version\":" >&2
    echo "$changed_lines" >&2
    exit 1
fi

echo "OK: el cambio es solo la línea \"version\" de package.json."
