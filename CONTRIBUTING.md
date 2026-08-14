# Guía de Contribución

Este documento explica cómo configurar tu entorno de desarrollo y las estándares que rigen la contribución a mistorias-web.

## Antes de Comenzar

Lee estos documentos para alinear tu trabajo con los principios del proyecto:

- **[docs/STANDARDS.md](docs/STANDARDS.md)** — Estándares de código (SOLID, clean code, TDD), convenciones de commits (conventional commits, atomic, preemptive), y estándares de PRs.
- **[Mistorias Esencia de Marca](https://github.com/mistorias/mistorias-esencia-de-marca)** — Principios de marca (empatía, transparencia, empoderamiento, claridad) que guían todo el trabajo.

## Idioma

El proyecto escribe en dos idiomas y cada uno tiene su lugar. La regla corta:
**el código se lee en inglés; todo lo que explica el código se lee en
castellano peruano.**

### Código: inglés

Se escriben en inglés los identificadores (variables, funciones, tipos,
constantes), los nombres de archivos y módulos, las claves de frontmatter
(`title`, `summary`, `date`, `author`, `tags`) y los mensajes de error de las
validaciones del build.

No se mezclan idiomas dentro de un mismo identificador: `getStories` sí,
`getHistorias` no.

### Excepción: los componentes de Astro

Los componentes en `src/components/`, las páginas y los layouts se escriben en
castellano cuando nombran un elemento de la marca o del dominio editorial:
`LogotipoMistorias.astro`, `TarjetaHistoria.astro`, `CabeceraSitio.astro`. Son
el borde del sistema que da la cara al lector, y ahí el nombre del dominio
comunica mejor que su traducción.

La excepción no se queda en el nombre del archivo: alcanza también a lo que vive
adentro —props como `historia`, `etiquetaTextual` o `nivelTitulo`, y variables
como `grupos` o `enlace`—. Ese vocabulario es el mismo de
[CONTEXT.md](CONTEXT.md), y traducirlo solo dentro del componente partiría en dos
el lenguaje con que se habla de la misma cosa.

El límite es `src/lib/`: la lógica que no da la cara al lector se escribe en
inglés, y en la frontera el componente en castellano consume funciones en inglés
(`storyRoute`, `groupByTag`).

### Excepción: lenguaje de cara al lector

Las rutas públicas (`/historias/`, `/etiquetas/`) y todo el texto que ve
quien lee el sitio siguen en castellano. Son parte del lenguaje ubicuo del
proyecto, no del código — ver [CONTEXT.md](CONTEXT.md).

### Comentarios y documentación: castellano peruano

Los comentarios, los docstrings, los mensajes de commit, las descripciones de
PR y los documentos del repositorio se escriben en castellano peruano. Los
comentarios explican el *por qué*, no el *qué* (ver
[docs/STANDARDS.md](docs/STANDARDS.md#principios-fundamentales)).

### Código ya escrito en castellano

`src/lib/` ya está en inglés: ahí viven `dates.ts`, `stories.ts`, `tags.ts`,
`routes.ts`, `deployment.ts` y los gates de `content/` y `brand/`.

Los componentes, las páginas y los layouts siguen en castellano por la excepción
de arriba: no son deuda pendiente y no se traducen.

Lo que sí queda pendiente son los fixtures de `tests/fixtures/simbolo/` y la
carpeta `src/assets/marca/`. No se renombran en masa: un cambio de nombre masivo
ensucia el historial sin mejorar nada. Se traducen cuando el archivo se toque por
otra razón, y siempre en un commit aparte del cambio funcional, para que el
renombrado se pueda revisar y revertir solo.

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

`pnpm test` mide además la cobertura y falla si no supera el 90%, igual que en
CI: la tabla al final de la corrida dice en cuánto quedó y qué archivo la está
bajando. Ver [Control de cobertura](docs/STANDARDS.md#control-de-cobertura).

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
2. Realiza tus cambios siguiendo los estándares de código en [docs/STANDARDS.md](docs/STANDARDS.md)
3. Asegúrate de que:
   - `pnpm build` pasa sin errores
   - `pnpm test` pasa
   - `pnpm astro check` no reporta errores de tipo
4. Haz commits atómicos siguiendo [convenciones de commits en docs/STANDARDS.md](docs/STANDARDS.md#estándares-de-commits)
5. Abre un PR contra `main` con descripción siguiendo [estándares de PR en docs/STANDARDS.md](docs/STANDARDS.md#estándares-de-pull-requests)
6. El workflow de Verificación (`.github/workflows/ci.yml`) corre en tu PR: tests con cobertura, type check, build y `pnpm audit --prod`. El paso de tests es bloqueante si la cobertura no supera el 90%, y el resumen del job muestra en cuánto quedó. El paso de audit también es bloqueante a propósito, así que una advisory nueva en una dependencia pone el PR en rojo aunque no la hayas introducido tú
7. Una vez disponibles los cambios en `main`, el sitio se despliega a GitHub Pages (desarrollo). La Publicación a producción ocurre solo al empujar una etiqueta de versión — ver [CONTEXT.md](CONTEXT.md)

## Decisiones Técnicas

Este proyecto usa Astro con las siguientes restricciones de seguridad y de marca:

- **No HTML crudo en contenido:** el markdown no se sanitiza, se rechaza. Una historia con etiquetas HTML hace fallar `astro dev` y `astro build` con `Raw HTML is not allowed in ...`. Fallar en vez de limpiar en silencio deja el problema visible para quien edita.
- **Content Collections tipadas:** Todos los posts deben cumplir el esquema definido en `src/lib/content/schema.ts`.
- **Transparencia de versionado:** Todo cambio de contenido o código queda registrado en Git.

Todo el trabajo se alinea con los [principios de marca](https://github.com/mistorias/mistorias-esencia-de-marca) (empatía, transparencia, empoderamiento, claridad), reflejados en [docs/STANDARDS.md](docs/STANDARDS.md).

Para más contexto arquitectónico, ver `CLAUDE.md` y `docs/adr/`.
