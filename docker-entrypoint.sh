#!/bin/bash
set -e

cd /workspace

if [ -d .git ]; then
    git submodule update --init --recursive
fi

pnpm install

exec "$@"
