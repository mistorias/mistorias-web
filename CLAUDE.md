# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Node version:** 24 (defined in `.nvmrc`)  
**Package manager:** pnpm 10.8.1 (pinned in `package.json`)

```bash
pnpm install
pnpm dev              # Start dev server on port 4321
pnpm build            # Build + type check
pnpm test             # Run Vitest tests
```

### Dev container (Docker)

To develop in isolation matching the deployment environment:

```bash
docker build -t mistorias-web-dev .
docker run --rm -it -p 4321:4321 \
  -v "$(pwd):/workspace" \
  -v mistorias-web-node-modules:/workspace/node_modules \
  -v mistorias-web-astro-cache:/workspace/.astro \
  mistorias-web-dev
```

Named volumes for `node_modules` and `.astro` avoid conflicts between host and container native binaries (esbuild, vite).

## Architecture

### Framework: Astro (Static Site Generator)

**Mistorias** is built with Astro for these core reasons (see `docs/adr/0002-astro-como-framework.md`):

1. **Content transparency via Git.** All editorial content lives in Markdown with version history — aligned with Mistorias' brand principle of traceability and auditability.
2. **Content Collections + typed schema.** Stories are validated against `storySchema` (in `src/lib/content/schema.ts`) at build time, enforcing editorial requirements (at least 2 of 3 content pillars: human story, explained data, context & reflection).
3. **Submodule content management.** Editorial content lives in a separate repo (`github.com/mistorias/mistorias-contenido`) and is pulled into this repo as a git submodule at `content/mistorias-contenido/`. This separates code and editorial concerns.
4. **Zero infrastructure cost.** Deploys to Netlify or GitHub Pages free tier.
5. **Extensible for future interactive data dashboard** without platform migration.

### Content Loading

The `src/lib/content/content-loader.ts` module:
- Scans `content/mistorias-contenido/stories/*.md` for story files
- Parses YAML frontmatter using a custom parser (not relying on gray-matter for transparency)
- Validates frontmatter against `storySchema` (Zod schema)
- Rejects raw HTML to prevent injection
- Sorts stories by date descending

Content is exposed via Astro's Content Collections API (`src/content.config.ts`), making stories queryable and type-safe in `.astro` pages.

### Pages & Routing

- `src/pages/index.astro` — homepage listing stories
- `src/pages/stories/[...id].astro` — dynamic story detail pages (file-based routing)

### Build Variants (DEPLOY_TARGET)

The build behaves differently based on the `DEPLOY_TARGET` environment variable (checked in `astro.config.mjs`):

- **GitHub Pages** (default / `development`): `site: https://mistorias.github.io`, `base: /mistorias-web`
- **Netlify** (`netlify`): `site: https://mistorias.pe`, `base: /`

This allows the same codebase to deploy to either platform with correct base paths. CI workflows set this env var when building.

## Common Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start hot-reload dev server on 4321 |
| `pnpm build` | Build + run type check; output in `dist/` |
| `pnpm preview` | Preview built site locally |
| `pnpm test` | Run all Vitest tests in `tests/**/*.spec.ts` |
| `pnpm astro check` | Type check without building |

### Running a Single Test

```bash
pnpm test -- tests/content-flow.spec.ts
```

Vitest is configured in `vitest.config.ts` with `environment: "node"`.

## Git Submodule

The content repo is tracked as a submodule. When cloning or switching branches:

```bash
git submodule update --init --recursive
```

The docker entrypoint runs this automatically. If you're developing and the content doesn't update, run the command above.

## TypeScript & Type Checking

- TypeScript 5.9.3 with strict mode (`tsconfig.json` extends `astro/tsconfigs/strict`)
- Type checking happens during `pnpm build` and in the CI pipeline
- `@astrojs/check` provides Astro-specific type validation

## CI Deployments

Two workflows in `.github/workflows/`:

1. **GitHub Pages** (`deploy-github-pages.yml`): Triggers on push to `main` or manual dispatch; uses `DEPLOY_TARGET=development`
2. **Netlify** (`deploy-netlify.yml`): Triggers on tag push or manual dispatch; uses `DEPLOY_TARGET=netlify`

Both check out with `--recursive` (initializes submodules) and run `pnpm install --frozen-lockfile` before building.

## Security & Validation

Stories reject raw HTML (see `assertNoRawHtml` in `content-loader.ts`) to prevent injection attacks. This is enforced on every build.
