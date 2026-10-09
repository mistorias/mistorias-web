#!/usr/bin/env bash
#
# Avanza el submódulo de contenido al último commit de mistorias-contenido y
# dice, vía $GITHUB_OUTPUT, si hubo cambios (hay_cambios) y entre qué commits
# (anterior, nuevo). Lo llama .github/workflows/actualizar-contenido.yml.
#
# Falla si el commit nuevo no desciende del fijado: el puntero debe avanzar,
# no retroceder. Si main de contenido quedó atrás, es una reescritura de
# historia y una persona tiene que mirarla.
#
# Los nombres de las salidas (hay_cambios, anterior, nuevo) son el contrato con
# el workflow, que las lee como steps.contenido.outputs.*.
#
# Uso: scripts/update_content_pointer.sh [ruta-al-submodulo]
# Por defecto usa $CONTENT_PATH, o content/mistorias-contenido si no existe.
# Sin $GITHUB_OUTPUT (corrida local) imprime las salidas en la consola.

set -euo pipefail

content_path="${1:-${CONTENT_PATH:-content/mistorias-contenido}}"
output="${GITHUB_OUTPUT:-/dev/stdout}"
summary="${GITHUB_STEP_SUMMARY:-/dev/stdout}"

# actions/checkout trae el submódulo con --depth=1. Sin historia,
# merge-base --is-ancestor no puede probar la ascendencia y respondería "no
# desciende" aunque el puntero esté avanzando con normalidad.
if [[ "$(git -C "$content_path" rev-parse --is-shallow-repository)" == "true" ]]; then
    git -C "$content_path" fetch --unshallow --quiet origin
fi

previous=$(git -C "$content_path" rev-parse HEAD)
git submodule update --remote "$content_path"
next=$(git -C "$content_path" rev-parse HEAD)

if [[ "$previous" == "$next" ]]; then
    echo "El contenido ya está al día ($previous)." >> "$summary"
    echo "hay_cambios=false" >> "$output"
    exit 0
fi

if ! git -C "$content_path" merge-base --is-ancestor "$previous" "$next"; then
    echo "::error::El commit nuevo ($next) no desciende del fijado ($previous). Revisar a mano."
    exit 1
fi

{
    echo "hay_cambios=true"
    echo "anterior=$previous"
    echo "nuevo=$next"
} >> "$output"
