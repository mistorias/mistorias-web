# Guía de Contribución

Este documento explica cómo configurar tu entorno de desarrollo y las estándares que rigen la contribución a mistorias-web.

## Antes de Comenzar

Lee estos documentos para alinear tu trabajo con los principios del proyecto:

- **[STANDARDS.md](STANDARDS.md)** — Estándares de código (SOLID, clean code, TDD), convenciones de commits (conventional commits, atomic, preemptive), y estándares de PRs.
- **[Mistorias Esencia de Marca](https://github.com/mistorias/mistorias-esencia-de-marca)** — Principios de marca (empatía, transparencia, empoderamiento, claridad) que guían todo el trabajo.

## Requisitos Previos

### Node.js y nvm

La versión de Node.js se define en `.nvmrc` (verifica el archivo para la versión exacta).

**Para Linux y macOS:**

Instala [nvm](https://github.com/nvm-sh/nvm), luego:

```bash
nvm install
nvm use
```

**Para Windows:**

Instala [nvm-windows](https://github.com/coreybutler/nvm-windows), luego:

```bash
nvm install $(cat .nvmrc)
nvm use
```

### Gestor de Paquetes (pnpm)

La versión de pnpm se define en el campo `packageManager` de `package.json`.

Recomendamos instalarlo con npm:

```bash
npm install -g pnpm
```

(Si usas corepack, también funciona, pero este proyecto documenta y soporta oficialmente npm.)

## Configuración Inicial

```bash
git clone https://github.com/mistorias/mistorias-web.git
cd mistorias-web
git submodule update --init --recursive
pnpm install
```

## Desarrollo Local

### Dev Server (Hot-Reload)

```bash
pnpm dev
```

El sitio estará disponible en `http://localhost:4321` y se actualizará automáticamente cuando edites archivos.

### Construcción y Validación

```bash
pnpm build      # Construye y valida tipos
pnpm astro check  # Solo validación de tipos sin build
```

### Tests

```bash
pnpm test       # Ejecuta todos los tests
pnpm test tests/content-flow.spec.ts  # Ejecuta un test específico
```

## Desarrollo en Docker

Para desarrollar en un contenedor que replica el entorno de despliegue:

```bash
docker build -t mistorias-web-dev .

docker run --rm -it \
  -p 4321:4321 \
  -v "$(pwd):/workspace" \
  -v mistorias-web-node-modules:/workspace/node_modules \
  -v mistorias-web-astro-cache:/workspace/.astro \
  mistorias-web-dev
```

El contenedor monta tu código como bind mount, permitiendo editar en tu editor local y ver los cambios en tiempo real dentro del contenedor.

### Otros comandos dentro del contenedor

```bash
# Build
docker run --rm \
  -v "$(pwd):/workspace" \
  -v mistorias-web-node-modules:/workspace/node_modules \
  -v mistorias-web-astro-cache:/workspace/.astro \
  mistorias-web-dev pnpm build

# Tests
docker run --rm \
  -v "$(pwd):/workspace" \
  -v mistorias-web-node-modules:/workspace/node_modules \
  mistorias-web-dev pnpm test
```

## Contenido por Submodulo

El contenido editorial vive en un repositorio separado: [`mistorias-contenido`](https://github.com/mistorias/mistorias-contenido)

Este sitio incluye ese repo como un **git submodule** en `content/mistorias-contenido/`.

### Cómo contribuir contenido

1. Haz cambios y abre un PR en [`mistorias-contenido`](https://github.com/mistorias/mistorias-contenido)
2. Una vez merged, actualiza el submodule en este repo:
   ```bash
   cd content/mistorias-contenido
   git checkout main && git pull origin main
   cd ../..
   git add content/mistorias-contenido
   git commit -m "chore: advance content submodule pointer"
   git push
   ```
3. El CI desplegará automáticamente con el contenido actualizado

### Inicializar submodule después de clonar

Si al clonar el repo el submodulo no se inicializa automáticamente:

```bash
git submodule update --init --recursive
```

## Flujo de Contribución de Código

1. Crea una rama descriptiva: `git checkout -b feat/descripcion-breve` o `fix/descripcion-breve`
2. Realiza tus cambios siguiendo los estándares de código en [STANDARDS.md](STANDARDS.md)
3. Asegúrate de que:
   - `pnpm build` pasa sin errores
   - `pnpm test` pasa
   - `pnpm astro check` no reporta errores de tipo
4. Haz commits atómicos siguiendo [convenciones de commits en STANDARDS.md](STANDARDS.md#commit-standards)
5. Abre un PR contra `main` con descripción siguiendo [estándares de PR en STANDARDS.md](STANDARDS.md#pull-request-standards)
6. El CI validará automáticamente; después del merge, el sitio se despliega automáticamente

## Decisiones Técnicas

Este proyecto usa Astro con las siguientes restricciones de seguridad y de marca:

- **No HTML crudo en contenido:** Todo el markdown es sanitizado; no se permite insertar HTML directo.
- **Content Collections tipadas:** Todos los posts deben cumplir el esquema definido en `src/lib/content/schema.ts`.
- **Transparencia de versionado:** Todo cambio de contenido o código queda registrado en Git.

Todo el trabajo se alinea con los [principios de marca](https://github.com/mistorias/mistorias-esencia-de-marca) (empatía, transparencia, empoderamiento, claridad), reflejados en [STANDARDS.md](STANDARDS.md).

Para más contexto arquitectónico, ver `CLAUDE.md` y `docs/adr/`.
