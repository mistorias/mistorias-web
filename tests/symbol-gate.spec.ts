import path from "node:path";
import type { AstroIntegration } from "astro";
import { describe, expect, it } from "vitest";
import {
  assertBrandSymbolFileIsThemeReady,
  assertBrandSymbolIsThemeReady
} from "../src/lib/brand/symbol-gate";
import { brandSymbol } from "../src/lib/brand/symbol-gate-integration";

type ConfigSetupHook = NonNullable<
  AstroIntegration["hooks"]["astro:config:setup"]
>;
type ConfigSetupOptions = Parameters<ConfigSetupHook>[0];

const fixturePath = (name: string): string =>
  path.resolve(process.cwd(), "tests/fixtures/symbol", name);

async function runConfigSetupHook(filePath: string): Promise<void> {
  const hook = brandSymbol(filePath).hooks["astro:config:setup"];
  await hook?.({} as ConfigSetupOptions);
}

describe("assertBrandSymbolIsThemeReady", () => {
  it("acepta un símbolo en currentColor con viewBox recortado", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><path d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() =>
      assertBrandSymbolIsThemeReady(svg, "symbol.svg")
    ).not.toThrow();
  });

  it("no confunde fill-rule con un color fijo", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><path fill-rule="evenodd" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() =>
      assertBrandSymbolIsThemeReady(svg, "symbol.svg")
    ).not.toThrow();
  });

  it("rechaza un color de marca fijo en vez de currentColor", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path fill="#8B0F0F" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "symbol.svg")).toThrow(
      /currentColor/
    );
  });

  it("rechaza un símbolo sin viewBox", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "symbol.svg")).toThrow(
      /viewBox/
    );
  });

  it("rechaza un <script> dentro del SVG que se inyecta en línea", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><script>alert(1)</script><path d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "symbol.svg")).toThrow(
      /no permitido/
    );
  });

  it("rechaza un manejador de evento dentro del SVG", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><path onclick="alert(1)" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "symbol.svg")).toThrow(
      /no permitido/
    );
  });

  it("rechaza una referencia externa", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><image href="https://evil.example/x.png" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "symbol.svg")).toThrow(
      /no permitido/
    );
  });

  it("rechaza un <style> incrustado, aunque fije currentColor por dentro", () => {
    // currentColor ahí adentro resuelve contra el color que la misma regla
    // fija (#8B0F0F), no contra --color-acento heredado del documento: el
    // símbolo deja de cambiar de tema aunque el atributo diga currentColor.
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><style>.x { color: #8B0F0F; fill: currentColor; }</style><path class="x" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "symbol.svg")).toThrow(
      /<style>/
    );
  });
});

describe("assertBrandSymbolFileIsThemeReady", () => {
  it("acepta el fixture válido", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("valid.svg"))
    ).resolves.toBeUndefined();
  });

  it("rechaza el fixture con color fijo", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("fixed-color.svg"))
    ).rejects.toThrow(/currentColor/);
  });

  it("rechaza el fixture sin viewBox", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("missing-viewbox.svg"))
    ).rejects.toThrow(/viewBox/);
  });

  it("rechaza el fixture con <script>", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("script-tag.svg"))
    ).rejects.toThrow(/no permitido/);
  });

  it("rechaza el fixture con <style> incrustado", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("style-tag.svg"))
    ).rejects.toThrow(/<style>/);
  });

  it("avisa cuando el archivo no existe", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("missing.svg"))
    ).rejects.toThrow();
  });
});

describe("integración brandSymbol", () => {
  it("deja compilar cuando el símbolo es válido", async () => {
    await expect(
      runConfigSetupHook(fixturePath("valid.svg"))
    ).resolves.toBeUndefined();
  });

  it("detiene la compilación cuando el símbolo trae un color fijo", async () => {
    await expect(
      runConfigSetupHook(fixturePath("fixed-color.svg"))
    ).rejects.toThrow(/currentColor/);
  });
});
