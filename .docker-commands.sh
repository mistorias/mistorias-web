#!/bin/bash
# Comandos útiles para trabajar con el dev container
# Fuente: issue #19 - Tener disponible un dev container del sitio

set -e

REPO_NAME="mistorias-web-dev"
NODE_MODULES_VOLUME="mistorias-web-node-modules"
ASTRO_CACHE_VOLUME="mistorias-web-astro-cache"

echo "📦 Construcción de la imagen Docker..."
docker build -t "$REPO_NAME" .

echo ""
echo "✅ Imagen construida. Comandos disponibles:"
echo ""
echo "1️⃣  Desarrollo (hot-reload):"
echo "   docker run --rm -it \\"
echo "     -p 4321:4321 \\"
echo "     -v \"\$(pwd):/workspace\" \\"
echo "     -v $NODE_MODULES_VOLUME:/workspace/node_modules \\"
echo "     -v $ASTRO_CACHE_VOLUME:/workspace/.astro \\"
echo "     $REPO_NAME"
echo ""
echo "2️⃣  Build:"
echo "   docker run --rm \\"
echo "     -v \"\$(pwd):/workspace\" \\"
echo "     -v $NODE_MODULES_VOLUME:/workspace/node_modules \\"
echo "     -v $ASTRO_CACHE_VOLUME:/workspace/.astro \\"
echo "     $REPO_NAME pnpm build"
echo ""
echo "3️⃣  Tests:"
echo "   docker run --rm \\"
echo "     -v \"\$(pwd):/workspace\" \\"
echo "     -v $NODE_MODULES_VOLUME:/workspace/node_modules \\"
echo "     $REPO_NAME pnpm test"
echo ""
echo "4️⃣  Build para Netlify (emular base paths):"
echo "   docker run --rm -e DEPLOY_TARGET=netlify \\"
echo "     -v \"\$(pwd):/workspace\" \\"
echo "     -v $NODE_MODULES_VOLUME:/workspace/node_modules \\"
echo "     -v $ASTRO_CACHE_VOLUME:/workspace/.astro \\"
echo "     $REPO_NAME pnpm build"
echo ""
echo "💡 Volúmenes nombrados evitan conflictos con binarios nativos (esbuild/vite)."
echo "   Si necesitas limpiar: docker volume rm $NODE_MODULES_VOLUME $ASTRO_CACHE_VOLUME"
