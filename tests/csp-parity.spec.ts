import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import BaseLayout from "../src/layouts/BaseLayout.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// La CSP vive en dos lugares que nada obliga a mantener iguales: el <meta> de
// BaseLayout (única barrera en GitHub Pages, que no permite cabeceras) y
// `public/_headers` (producción en Netlify). Si se cambia una y no la otra, el
// build pasa y los dos entornos se comportan distinto en silencio (ADR 0004,
// ADR 0005 §7). Estas pruebas hacen fallar el cambio de uno solo.

const HEADERS = readFileSync(
  path.resolve(process.cwd(), "public/_headers"),
  "utf8"
);

// Un <meta> no puede expresar `frame-ancestors`: solo la cabecera lo aplica.
const HEADER_ONLY_DIRECTIVE = "frame-ancestors 'none'";

const headerValue = (name: string): string | undefined => {
  const line = HEADERS.split("\n")
    .map((entry) => entry.trim())
    .find((entry) => entry.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return line?.slice(line.indexOf(":") + 1).trim();
};

const directives = (policy: string): string[] =>
  policy
    .split(";")
    .map((directive) => directive.trim())
    .filter((directive) => directive.length > 0);

describe("paridad de la CSP entre el <meta> y public/_headers", () => {
  it("la cabecera repite las directivas del <meta> y solo agrega frame-ancestors", async () => {
    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "T" },
      slots: { default: "" },
    });
    const metaPolicy =
      html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
    const headerPolicy = headerValue("Content-Security-Policy") ?? "";

    expect(directives(metaPolicy)).not.toHaveLength(0);
    expect(directives(headerPolicy).sort()).toEqual(
      [...directives(metaPolicy), HEADER_ONLY_DIRECTIVE].sort()
    );
  });

  it("la cabecera declara frame-ancestors una sola vez", () => {
    const policy = directives(headerValue("Content-Security-Policy") ?? "");

    expect(policy.filter((directive) => directive.startsWith("frame-ancestors"))).toEqual([
      "frame-ancestors 'none'",
    ]);
  });
});

describe("public/_headers", () => {
  it.each([
    ["X-Content-Type-Options", "nosniff"],
    ["X-Frame-Options", "DENY"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
    ["Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"],
    ["Cross-Origin-Opener-Policy", "same-origin"],
  ])("conserva la cabecera %s", (name, value) => {
    expect(headerValue(name)).toBe(value);
  });
});
