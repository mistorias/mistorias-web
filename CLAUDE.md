# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Standards & Brand Alignment

Before writing code, commits, or PRs, consult:

- **[docs/STANDARDS.md](docs/STANDARDS.md)** — Code principles (SOLID, clean code, TDD), commit conventions (conventional commits, atomic, preemptive), and PR standards.
- **[Mistorias Esencia de Marca](https://github.com/mistorias/mistorias-esencia-de-marca)** — Brand principles (empatía, transparencia, empoderamiento, claridad) that guide all work. These principles translate to code that is human-first, transparent to contributors, and clear.

Claude Code must commit atomically while working on this repo, so each commit is a safe checkpoint to revert to if needed. See [docs/STANDARDS.md](docs/STANDARDS.md#atomic-commits) for details.

### Language

Code is written in English — identifiers, filenames, frontmatter keys, build error messages. Astro components, pages and layouts stay in Spanish when they name a brand or editorial concept (`LogotipoMistorias.astro`, `TarjetaHistoria.astro`) — filenames and the props and variables inside them alike — and so do public routes and reader-facing text. Comments, docstrings, commit messages, PR descriptions and docs are written in Peruvian Spanish. The boundary is `src/lib/`, which is fully in English: a Spanish component consumes English helpers (`storyRoute`, `groupByTheme`). Full rules in [CONTRIBUTING.md](CONTRIBUTING.md#idioma).

### Documentation

New documents go in `docs/`. The repository root is reserved for files GitHub or tooling expects to find there (`README.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CLAUDE.md`, `CONTEXT.md`); anything else needs a reason stated in the PR. ADRs go in `docs/adr/` as `NNNN-titulo-en-kebab-case.md`.

A document is large past **300 lines**. At that point don't keep appending: extract a whole, self-contained topic into a new document under `docs/`, link to it instead of copying it, and leave a pointer where the section was. ADRs are exempt — one ADR is one decision; an oversized one usually means a second ADR is due. Full rules in [docs/STANDARDS.md](docs/STANDARDS.md#estándares-de-documentación).

## Quick Start

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions.

Node version and pnpm version are defined in `.nvmrc` and `package.json` respectively — they may differ from values documented elsewhere.

Common commands: `pnpm dev`, `pnpm build`, `pnpm test`. For dev container setup, Docker commands, and detailed development workflow, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Developer Workflow & Hooks

Claude Code is configured with automated hooks (`.claude/settings.json`) to catch issues early and prevent common mistakes when working **within Claude Code sessions**.

⚠️ **Important:** These hooks run **only during Claude Code interactions**, not in your terminal's `git` commands. They gate Claude's own work, not manual git operations.

### Post-Commit Hook
When Claude runs `git commit` in a session, the hook automatically executes:
```bash
pnpm test --coverage && pnpm build
```
**What it does:** Verifies that tests pass, coverage meets the threshold, and the build succeeds. If any step fails, the commit exists but cannot be pushed — the issue must be fixed before Claude retries.

**Why:** Catches broken commits before Claude shares them. Aligns with atomic-commit practices (see [docs/STANDARDS.md](docs/STANDARDS.md#atomic-commits)) — every commit should be a safe, working checkpoint.

### Pre-Push Hook
When Claude runs `git push` in a session, the hook validates the branch:
```bash
# Prevents push to main or master
```
**What it does:** Blocks accidental pushes to `main` or `master`. Feature work must go through a pull request instead.

**Why:** Protects the mainline branch from direct commits and enforces code review via PR.

### Disabling Hooks (if needed)
If a hook times out or interferes with Claude's work in a session, it can be skipped:
```bash
git commit --no-verify  # Skips all hooks for this commit
```
**Use sparingly** — hooks catch errors that CI would otherwise catch later, wasting time and tokens. If Claude needs to skip regularly, file an issue to adjust timeout or command.

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

`src/lib/content/story-image-requirements.ts` complements that folder/filename gate with what it doesn't check: that `principal.jpg` decodes as a real JPEG (via `sharp().metadata()`, which sniffs by content, not extension) within size and pixel limits, and that its presence is consistent with the story's frontmatter — `imageAlt`, `imageCredit` and `imageLicense` must all be declared together when there's an image, and none of them when there isn't. Registered via `story-image-requirements-integration.ts`, which also hooks `astro:build:done` to run `assert-built-images-are-optimized.ts` — failing the build if any `<img src>` in the emitted HTML didn't come out of `astro:assets` (i.e. doesn't contain `/_astro/`). `src/lib/content/story-images.ts` is the only place that loads image files into the bundle, via a literal `import.meta.glob("/content/mistorias-contenido/stories/*/principal.jpg")`; `TarjetaHistoria.astro` and the story detail page call its `getStoryImage(storyId)` and render nothing (card: just the brand symbol) when a story has no image.

`src/lib/brand/symbol-gate.ts` follows the same pattern for the brand symbol SVG (`src/assets/brand/symbol-mistorias.svg`): it rejects any fixed color (must stay `currentColor` so dark mode needs no second file) and anything beyond drawing markup (`<script>`, event handlers, `foreignObject`, external references), because the symbol is injected in line with `set:html`. Registered via `src/lib/brand/symbol-gate-integration.ts`. See [ADR 0007](docs/adr/0007-lockups-del-logo-y-alto-de-la-cabecera.md).

### Pages & Routing

- `src/layouts/BaseLayout.astro` — shared HTML skeleton; the `<meta>` Content-Security-Policy lives here and nowhere else. Also carries the header, the footer and the skip link, so every page shares them
- `src/pages/index.astro` — homepage: promise banner, featured story, older stories
- `src/pages/historias/[...id].astro` — dynamic story detail pages (file-based routing)
- `src/pages/temas/index.astro` and `src/pages/temas/[tema].astro` — theme index and per-theme listings
- `src/pages/acerca.astro`, `src/pages/404.astro`

Public URLs are in Spanish (`/historias/`, `/temas/`), matching the project's ubiquitous language. **Never hardcode an internal `href`**: `base` differs per deploy target, so a hand-written path silently breaks on GitHub Pages without failing the build. Build every internal link with the helpers in `src/lib/routes.ts`, which also own the section names.

### Design System

Derived from [Mistorias Esencia de Marca](https://github.com/mistorias/mistorias-esencia-de-marca); the reasoning is in [ADR 0006](docs/adr/0006-sistema-de-diseno-del-sitio.md).

- `src/styles/tokens.css` — the **only** file where a brand hex appears. Everything else consumes semantic tokens (`--color-acento`, `--color-metadato`). Dark mode redefines six variables and no component stylesheet changes; keep it that way.
- `src/styles/base.css` — reset, element defaults, editorial prose, and the few media queries the site needs. Layout is intrinsically responsive (`min()`, `clamp()`, `auto-fit`), so breakpoints exist only where a real constraint does — never per device.
- Typefaces are self-hosted via `@fontsource-variable` and served same-origin, so they fall under `default-src 'self'` and required no CSP change.
- Contrast ratios are annotated next to each token. Both themes clear WCAG AA; `--color-vivo` is restricted to non-text use because it does not.
- Story pages style prose uniformly and **do not** key off section titles: `storySchema` validates frontmatter only, so section names are editorial convention and a design that depends on them would break silently.
- The homepage opens with `src/components/PlantaDeLibros.astro` beside the text:
  `flex-wrap: wrap-reverse` puts the illustration left when there is width and
  below the text when there is not, from a single DOM order and with no width
  breakpoint. Its size is fluid (`clamp(7rem, 22vw, 18rem)`) so it is already
  small by the time the row wraps. A container query would have been the
  natural fit and does not work here: `container-type` applies `contain: layout`,
  which makes the container the containing block for `position: fixed`
  descendants and unpins `DatoConFuente`'s source bar from the viewport. See
  [ADR 0012](docs/adr/0012-ilustracion-de-portada.md).
- The homepage opens with two verifiable figures before the promise, read as one
  flowing paragraph, each wrapped in `src/components/DatoConFuente.astro`. That
  component is a native `details > summary + p` — the sentence is the `summary`
  and the source link lives in the `p` — so the source reveals on hover over its
  chip (pointer devices) or on tap (touch), with no JavaScript, which
  `script-src 'none'` would forbid anyway. The panel is fixed to the bottom of
  the viewport: it doesn't push content and doesn't cover any statement. See
  [ADR 0010](docs/adr/0010-apertura-de-portada-con-datos-verificables.md).
- The Mistorias logotype (`src/components/LogotipoMistorias.astro` + `SimboloMistorias.astro`) composes a `currentColor` SVG symbol with the word "Mistorias" in `--fuente-narrativa` (Lora 600) — the word is live text, never traced into the SVG, so `--fuente-narrativa` now also dresses the brand mark, not just narrative prose. It renders in three layouts (stacked, row, symbol-only) that respond to `max-height: 30rem`, the same short-viewport criterion ADR 0006 §6 already uses. `font-size` on the wrapping element is the only sizing knob; every call site reuses an existing `--paso-*` token rather than inventing a value. See [ADR 0007](docs/adr/0007-lockups-del-logo-y-alto-de-la-cabecera.md).

### Build Variants (DEPLOY_TARGET)

The build behaves differently based on the `DEPLOY_TARGET` environment variable. `src/lib/deployment.ts` resolves it into `site` and `base`, and `astro.config.mjs` does nothing else with it:

- **GitHub Pages** (default / `development`): `site: https://mistorias.github.io`, `base: /mistorias-web`
- **Netlify** (`netlify`): `site: https://mistorias.pe`, `base: /`

This allows the same codebase to deploy to either platform with correct base paths. CI workflows set this env var when building. An unrecognized value stops the build instead of falling back to the default target: a wrong-but-successful build publishes a site whose stylesheet and every link point at the other deploy's base, and nothing fails (issue #29).

`netlify.toml` declares the same target for whatever build Netlify runs on its side. `netlify deploy` rebuilds the site unless it is given `--no-build`, and that rebuild does not inherit the workflow's env — which is exactly how production ended up serving `/mistorias-web/…` links from mistorias.pe. The deploy workflow now passes `--no-build` and, before uploading, fails if the artifact still carries the GitHub Pages base.



## TypeScript & Type Checking

Configured in strict mode (`tsconfig.json` extends `astro/tsconfigs/strict`). `@astrojs/check` validates Astro-specific types. See CONTRIBUTING.md for how to run type checks.

## CI Deployments

Two workflows in `.github/workflows/`:

1. **GitHub Pages** (`deploy-github-pages.yml`): Triggers on push to `main` or manual dispatch; uses `DEPLOY_TARGET=development`
2. **Netlify** (`deploy-netlify.yml`): Triggers on tag push or manual dispatch; uses `DEPLOY_TARGET=netlify`

Both check out with `--recursive` (initializes submodules) and run `pnpm install --frozen-lockfile` before building.

## Security & Validation

Stories reject raw HTML (`assertStoriesHaveNoRawHtml` in `raw-html-gate.ts`) to prevent injection attacks. This is enforced on every `astro dev` and `astro build` through the integration registered in `astro.config.mjs` — the check only holds as long as that registration stays in place, so don't remove it.

Any SVG injected in line with `set:html` is executable markup, not just an image, so it goes through `assertInlineSvgIsThemeReady` in `src/lib/assets/inline-svg-gate.ts`: it requires a cropped `viewBox` and rejects fixed colors (as attributes *or* inside a `style` attribute, which is how SVGO writes them), `<style>`, `<script>`, event handlers, `foreignObject`, and external references. Two files consume it, both registered in `astro.config.mjs`: the brand symbol (`src/lib/brand/symbol-gate.ts`) and the cover illustration (`src/lib/assets/illustration-gate.ts`), which additionally requires the `ink-base` and `ink-acento` classes — without them the drawing gets no token and renders black on black in dark mode.

Pages ship a strict Content-Security-Policy from `src/layouts/BaseLayout.astro`. `script-src` is `'none'` because the site sends no JavaScript; adding an Astro island or view transitions requires relaxing it to `'self'` in both the layout and `public/_headers`, which would otherwise break in the browser without failing the build.

See [ADR 0004](docs/adr/0004-triaje-reportes-seguridad-github-pages.md) for the full security triage and [SECURITY.md](SECURITY.md) for how to report vulnerabilities.

## Testing Astro Components

As of issue #33, `.astro` components can be tested with Vitest using the `experimental_AstroContainer` API from `astro/container`. Tests live in `tests/` alongside TS tests (e.g. `tests/logotipo-mistorias.spec.ts` for `src/components/LogotipoMistorias.astro`).

**Patterns:**

- Import and render a component via `renderAstroComponent(Component, { props: {...}, slots: {...} })` (defined in `tests/support/render-astro-component.ts`).
- Assert on the HTML string it produces (no DOM API in Node tests, so use `.toContain()` for substrings).
- For data fixtures (e.g. `CollectionEntry<"stories">`), use `buildStoryFixture(overrides?)` from `tests/support/story-fixture.ts`.
- Stub environment variables with `vi.stubEnv("DEPLOY_TARGET", "netlify")` and clean up in `afterEach(() => vi.unstubAllEnvs())`.

**Coverage:**

- `coverage.config.ts` explicitly lists only the `.astro` files under test (not `src/**/*.astro`, which would count all untested components at 0%). Currently: `BaseLayout.astro`, `LogotipoMistorias.astro`, `TarjetaHistoria.astro`, `ListaTemas.astro`, `SimboloMistorias.astro`, `CabeceraSitio.astro`, `PieSitio.astro`.
- The 90% coverage threshold applies to those files (108 tests as of now pass; ~89% branches still needs work on `Astro.site`-dependent code in future iterations).

**Limitations:**

- The Container API renders in a Node environment without a browser, so CSS media queries, viewport-dependent layouts, and DOM interactions can't be asserted. Test the *markup structure* (classes, attributes, text content) that these depend on instead.
- `Astro.site` and `Astro.url` are not available (or undefined) in tests; features that need canonical URLs or depend on full site config should be deferred or tested differently.
