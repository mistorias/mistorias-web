# mistorias-web

Sitio web de Mistorias construido con Astro.

## Node.js y nvm

Este proyecto usa Node.js 24. La version se define en `.nvmrc`; activala con nvm antes de instalar dependencias o ejecutar scripts.

For Linux and Mac, install [nvm](https://github.com/nvm-sh/nvm), then execute:

```bash
nvm use
```

For Windows users, install [nvm-windows](https://github.com/coreybutler/nvm-windows), and then:

```bash
nvm install 24
nvm use 24
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

## Tests

```bash
pnpm test
```

## Contenido por submodulo

Este proyecto espera el repositorio `mistorias-contenido` en:

`content/mistorias-contenido`

El flujo recomendado es avanzar el puntero del submodulo con PR en este repo tras revisar y mergear contenido en `mistorias-contenido`.
