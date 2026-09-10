#!/usr/bin/env bash
#
# Punto único de verdad para el chequeo que mantiene sincronizados el tag del
# release y el campo "version" de package.json.
#
# La página "Acerca de" muestra el tag cuando el build viene de uno, y el
# "version" de package.json cuando no (ver src/lib/version.ts y ADR 0017). Si
# ambos se separan, el sitio dice una versión en producción y otra en
# desarrollo, y ninguna de las dos es confiable. Este chequeo detiene el
# despliegue antes de que eso llegue a mistorias.pe.
#
# Vive como script y no como paso inline del workflow para poder correrlo en
# local antes de empujar un tag, igual que scripts/check_build_base.sh.
#
# Uso: scripts/check_release_version.sh <tag>
# Ejemplo: scripts/check_release_version.sh v0.1.0

set -euo pipefail

tag="${1:-}"

if [[ -z "$tag" ]]; then
    echo "Falta el tag. Uso: scripts/check_release_version.sh <tag>" >&2
    exit 1
fi

package_version="$(node -p "require('./package.json').version")"
expected_tag="v$package_version"

if [[ "$tag" != "$expected_tag" ]]; then
    echo "El tag \"$tag\" no coincide con la versión de package.json (\"$package_version\")." >&2
    echo "Se esperaba el tag \"$expected_tag\"." >&2
    echo "Sube \"version\" en package.json y vuelve a etiquetar, o etiqueta con \"$expected_tag\"." >&2
    exit 1
fi

echo "OK: el tag \"$tag\" coincide con la versión de package.json."
