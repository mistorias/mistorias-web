# Testing Astro Components

As of issue #33, `.astro` components can be tested with Vitest using the `experimental_AstroContainer` API from `astro/container`. Tests live in `tests/` alongside TS tests (e.g. `tests/logotipo-mistorias.spec.ts` for `src/components/LogotipoMistorias.astro`).

**Patterns:**

- Import and render a component via `renderAstroComponent(Component, { props: {...}, slots: {...} })` (defined in `tests/support/render-astro-component.ts`).
- Pages render the same way when they take no props: `tests/acerca.spec.ts` renders `src/pages/acerca.astro` directly and asserts only what has logic (the version line, the shared authorship labels), not its editorial prose.
- Assert on the HTML string it produces (no DOM API in Node tests, so use `.toContain()` for substrings).
- For data fixtures (e.g. `CollectionEntry<"stories">`), use `buildStoryFixture(overrides?)` from `tests/support/story-fixture.ts`, and `buildAuthorFixture(overrides?)` from `tests/support/author-fixture.ts` for `CollectionEntry<"authors">`.
- Stub environment variables with `vi.stubEnv("DEPLOY_TARGET", "netlify")` and clean up in `afterEach(() => vi.unstubAllEnvs())`.

**Coverage:**

- `coverage.config.ts` explicitly lists only the `.astro` files under test (not `src/**/*.astro`, which would count all untested components at 0%). Add a component there when you add its test.
- The 90% coverage threshold applies to those files, plus every `.ts` under `src/` — `src/**/*.ts` is a glob, so a new helper in `src/lib/` must arrive with its tests or it drags coverage below the threshold.

**Limitations:**

- The Container API renders in a Node environment without a browser, so CSS media queries, viewport-dependent layouts, and DOM interactions can't be asserted. Test the *markup structure* (classes, attributes, text content) that these depend on instead.
- `Astro.site` and `Astro.url` are not available (or undefined) in tests; features that need canonical URLs or depend on full site config should be deferred or tested differently.
