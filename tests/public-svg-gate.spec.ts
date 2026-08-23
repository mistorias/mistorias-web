import path from "node:path";
import type { AstroIntegration } from "astro";
import { describe, expect, it } from "vitest";
import {
  assertPublicSvgIsInert,
  assertPublicSvgsAreInert
} from "../src/lib/assets/public-svg-gate";
import { publicSvg } from "../src/lib/assets/public-svg-gate-integration";

type ConfigSetupHook = NonNullable<
  AstroIntegration["hooks"]["astro:config:setup"]
>;
type ConfigSetupOptions = Parameters<ConfigSetupHook>[0];

const fixtureDir = (name: string): string =>
  path.resolve(process.cwd(), "tests/fixtures", name);

async function runConfigSetupHook(directory: string): Promise<void> {
  const hook = publicSvg(directory).hooks["astro:config:setup"];
  await hook?.({} as ConfigSetupOptions);
}

describe("assertPublicSvgIsInert", () => {
  it("acepta un SVG de dibujo sin script ni referencias externas", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path fill="#1E2328" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertPublicSvgIsInert(svg, "silueta.svg")).not.toThrow();
  });

  it("no rechaza un color fijo, a diferencia del gate del símbolo de marca", () => {
    // Este SVG se consume como máscara CSS: el color no importa, solo el
    // canal alfa. No hereda --color-acento porque no se inyecta en línea.
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path fill="#8B0F0F" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertPublicSvgIsInert(svg, "silueta.svg")).not.toThrow();
  });

  it("no rechaza un <style> incrustado, a diferencia del gate del símbolo de marca", () => {
    // Nunca se inyecta con set:html, así que una hoja de estilos interna no
    // se escapa hacia el documento que lo consume.
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><style>.x { fill: #8B0F0F; }</style><path class="x" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertPublicSvgIsInert(svg, "silueta.svg")).not.toThrow();
  });

  it("rechaza un <script>", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><script>alert(1)</script></svg>';

    expect(() => assertPublicSvgIsInert(svg, "silueta.svg")).toThrow(
      /no permitido/
    );
  });

  it("rechaza un manejador de evento", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path onclick="alert(1)" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertPublicSvgIsInert(svg, "silueta.svg")).toThrow(
      /no permitido/
    );
  });

  it("rechaza un foreignObject", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><foreignObject><body xmlns="http://www.w3.org/1999/xhtml">hola</body></foreignObject></svg>';

    expect(() => assertPublicSvgIsInert(svg, "silueta.svg")).toThrow(
      /no permitido/
    );
  });

  it("rechaza una referencia externa", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><image href="https://evil.example/x.png" /></svg>';

    expect(() => assertPublicSvgIsInert(svg, "silueta.svg")).toThrow(
      /no permitido/
    );
  });

  it("no confunde una referencia interna (#id) con una externa", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><use href="#pieza" /></svg>';

    expect(() => assertPublicSvgIsInert(svg, "silueta.svg")).not.toThrow();
  });
});

describe("assertPublicSvgsAreInert", () => {
  it("acepta un directorio donde todos los SVG son inertes", async () => {
    await expect(
      assertPublicSvgsAreInert(fixtureDir("public-svg-dir"))
    ).resolves.toBeUndefined();
  });

  it("rechaza el directorio en cuanto encuentra un SVG con <script>", async () => {
    await expect(
      assertPublicSvgsAreInert(fixtureDir("public-svg-dir-bad"))
    ).rejects.toThrow(/no permitido/);
  });

  it("ignora archivos que no son .svg", async () => {
    await expect(
      assertPublicSvgsAreInert(fixtureDir("public-svg-dir"))
    ).resolves.toBeUndefined();
  });
});

describe("integración publicSvg", () => {
  it("deja compilar cuando todos los SVG de public/ son inertes", async () => {
    await expect(
      runConfigSetupHook(fixtureDir("public-svg-dir"))
    ).resolves.toBeUndefined();
  });

  it("detiene la compilación en cuanto un SVG trae un <script>", async () => {
    await expect(
      runConfigSetupHook(fixtureDir("public-svg-dir-bad"))
    ).rejects.toThrow(/no permitido/);
  });
});
