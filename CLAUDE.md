# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Standards & Brand Alignment

Before writing code, commits, or PRs, consult:

- **[STANDARDS.md](STANDARDS.md)** — Code principles (SOLID, clean code, TDD), commit conventions (conventional commits, atomic, preemptive), and PR standards.
- **[Mistorias Esencia de Marca](https://github.com/mistorias/mistorias-esencia-de-marca)** — Brand principles (empatía, transparencia, empoderamiento, claridad) that guide all work. These principles translate to code that is human-first, transparent to contributors, and clear.

Claude Code must commit atomically while working on this repo, so each commit is a safe checkpoint to revert to if needed. See [STANDARDS.md](STANDARDS.md#atomic-commits) for details.

## Quick Start

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions.

Node version and pnpm version are defined in `.nvmrc` and `package.json` respectively — they may differ from values documented elsewhere.

Common commands: `pnpm dev`, `pnpm build`, `pnpm test`. For dev container setup, Docker commands, and detailed development workflow, see [CONTRIBUTING.md](CONTRIBUTING.md).

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



## TypeScript & Type Checking

Configured in strict mode (`tsconfig.json` extends `astro/tsconfigs/strict`). `@astrojs/check` validates Astro-specific types. See CONTRIBUTING.md for how to run type checks.

## CI Deployments

Two workflows in `.github/workflows/`:

1. **GitHub Pages** (`deploy-github-pages.yml`): Triggers on push to `main` or manual dispatch; uses `DEPLOY_TARGET=development`
2. **Netlify** (`deploy-netlify.yml`): Triggers on tag push or manual dispatch; uses `DEPLOY_TARGET=netlify`

Both check out with `--recursive` (initializes submodules) and run `pnpm install --frozen-lockfile` before building.

## Security & Validation

Stories reject raw HTML (see `assertNoRawHtml` in `content-loader.ts`) to prevent injection attacks. This is enforced on every build. See [SECURITY.md](SECURITY.md) for how to report vulnerabilities.
