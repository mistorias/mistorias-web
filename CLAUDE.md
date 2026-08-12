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

Stories are loaded by Astro's Content Collections API. `src/content.config.ts` declares the `stories` collection with a `glob()` loader over `content/mistorias-contenido/stories/**/*.md`, validated against `storySchema` (`src/lib/content/schema.ts`). That loader is the single source of truth for parsing and validating frontmatter — do not add a second parser alongside it.

`src/lib/content/raw-html-gate.ts` complements it with the raw-HTML gate: `assertStoriesHaveNoRawHtml()` scans every story file and rejects real HTML tags. It validates the full file text rather than re-parsing frontmatter, precisely so it cannot disagree with Astro's loader about what the file contains.

The gate runs via `src/lib/content/no-raw-html-integration.ts`, an Astro integration registered in `astro.config.mjs`. Its `astro:config:setup` hook fires on both `astro dev` and `astro build`, so a story with executable HTML fails the build instead of being published. See [ADR 0004](docs/adr/0004-triaje-reportes-seguridad-github-pages.md) for why this exists.

`src/lib/content/story-asset-folders.ts` is the sibling gate for the image folders nested under `stories/` (see [ADR 0005](docs/adr/0005-imagenes-en-historias.md)), registered the same way via `src/lib/content/story-asset-folders-integration.ts`. Both gates share directory-reading helpers from `src/lib/content/stories-directory.ts`.

### Pages & Routing

- `src/layouts/BaseLayout.astro` — shared HTML skeleton; the `<meta>` Content-Security-Policy lives here and nowhere else
- `src/pages/index.astro` — homepage
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

Stories reject raw HTML (`assertStoriesHaveNoRawHtml` in `raw-html-gate.ts`) to prevent injection attacks. This is enforced on every `astro dev` and `astro build` through the integration registered in `astro.config.mjs` — the check only holds as long as that registration stays in place, so don't remove it.

Pages ship a strict Content-Security-Policy from `src/layouts/BaseLayout.astro`. `script-src` is `'none'` because the site sends no JavaScript; adding an Astro island or view transitions requires relaxing it to `'self'` in both the layout and `public/_headers`, which would otherwise break in the browser without failing the build.

See [ADR 0004](docs/adr/0004-triaje-reportes-seguridad-github-pages.md) for the full security triage and [SECURITY.md](SECURITY.md) for how to report vulnerabilities.
