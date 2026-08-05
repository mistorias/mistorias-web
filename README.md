# mistorias-web

Sitio web de Mistorias construido con Astro.

## Node.js y nvm

Este proyecto usa Node.js 24. La version se define en `.nvmrc`; activala con nvm antes de instalar dependencias o ejecutar scripts.

For Linux and Mac, install [nvm](https://github.com/nvm-sh/nvm), then execute:

```bash
nvm install
nvm use
```

For Windows users, install [nvm-windows](https://github.com/coreybutler/nvm-windows), and then:

```bash
nvm install 24 -- check the version configured in the .nvmrc file, this was a version for the example
nvm use 24 -- idem
```

## Gestor de paquetes (pnpm)

Este repositorio usa `pnpm`. Recomendamos instalarlo con `npm` para mantener un flujo simple y estable:

```bash
npm install -g pnpm
```

Si ya usas `corepack`, puedes seguir haciendolo como alternativa, pero este proyecto documenta y soporta oficialmente la instalacion via `npm`.

## Desarrollo

```bash
pnpm install
pnpm dev
```

### Dev container (Docker)

Para ejecutar el sitio en un contenedor Docker que emule el entorno de despliegue:

```bash
docker build -t mistorias-web-dev .

docker run --rm -it \
  -p 4321:4321 \
  -v "$(pwd):/workspace" \
  -v mistorias-web-node-modules:/workspace/node_modules \
  -v mistorias-web-astro-cache:/workspace/.astro \
  mistorias-web-dev
```

El contenedor usa volúmenes nombrados para `node_modules` y `.astro` cache; esto evita
conflictos con binarios nativos compilados en tu máquina host (esbuild, vite, etc.).
El código fuente se monta como bind mount, permitiendo editar en el editor del host
y ver hot-reload dentro del contenedor.

#### Correr otros comandos dentro del contenedor

Para ejecutar `build` o `test`:

```bash
docker run --rm \
  -v "$(pwd):/workspace" \
  -v mistorias-web-node-modules:/workspace/node_modules \
  -v mistorias-web-astro-cache:/workspace/.astro \
  mistorias-web-dev pnpm build

docker run --rm \
  -v "$(pwd):/workspace" \
  -v mistorias-web-node-modules:/workspace/node_modules \
  mistorias-web-dev pnpm test
```

#### Emular entorno Netlify

Para que el build reproduzca la configuración de base paths de Netlify:

```bash
docker run --rm -e DEPLOY_TARGET=netlify \
  -v "$(pwd):/workspace" \
  -v mistorias-web-node-modules:/workspace/node_modules \
  -v mistorias-web-astro-cache:/workspace/.astro \
  mistorias-web-dev pnpm build
```

## Tests

```bash
pnpm test
```

## Contenido por submodulo

Este proyecto espera el repositorio `mistorias-contenido` en:

`content/mistorias-contenido`

El flujo recomendado es avanzar el puntero del submodulo con PR en este repo tras revisar y mergear contenido en `mistorias-contenido`.
