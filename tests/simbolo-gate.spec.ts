import path from "node:path";
import type { AstroIntegration } from "astro";
import { describe, expect, it } from "vitest";
import {
  assertBrandSymbolFileIsThemeReady,
  assertBrandSymbolIsThemeReady
} from "../src/lib/marca/simbolo-gate";
import { simboloDeMarca } from "../src/lib/marca/simbolo-gate-integration";

type ConfigSetupHook = NonNullable<
  AstroIntegration["hooks"]["astro:config:setup"]
>;
type ConfigSetupOptions = Parameters<ConfigSetupHook>[0];

const fixturePath = (name: string): string =>
  path.resolve(process.cwd(), "tests/fixtures/simbolo", name);

async function runConfigSetupHook(filePath: string): Promise<void> {
  const hook = simboloDeMarca(filePath).hooks["astro:config:setup"];
  await hook?.({} as ConfigSetupOptions);
}

describe("assertBrandSymbolIsThemeReady", () => {
  it("acepta un símbolo en currentColor con viewBox recortado", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><path d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() =>
      assertBrandSymbolIsThemeReady(svg, "simbolo.svg")
    ).not.toThrow();
  });

  it("no confunde fill-rule con un color fijo", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><path fill-rule="evenodd" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() =>
      assertBrandSymbolIsThemeReady(svg, "simbolo.svg")
    ).not.toThrow();
  });

  it("rechaza un color de marca fijo en vez de currentColor", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path fill="#8B0F0F" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "simbolo.svg")).toThrow(
      /currentColor/
    );
  });

  it("rechaza un símbolo sin viewBox", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "simbolo.svg")).toThrow(
      /viewBox/
    );
  });

  it("rechaza un <script> dentro del SVG que se inyecta en línea", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><script>alert(1)</script><path d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "simbolo.svg")).toThrow(
      /no permitido/
    );
  });

  it("rechaza un manejador de evento dentro del SVG", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><path onclick="alert(1)" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "simbolo.svg")).toThrow(
      /no permitido/
    );
  });

  it("rechaza una referencia externa", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="currentColor"><image href="https://evil.example/x.png" /></svg>';

    expect(() => assertBrandSymbolIsThemeReady(svg, "simbolo.svg")).toThrow(
      /no permitido/
    );
  });
});

describe("assertBrandSymbolFileIsThemeReady", () => {
  it("acepta el fixture válido", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("valido.svg"))
    ).resolves.toBeUndefined();
  });

  it("rechaza el fixture con color fijo", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("con-hex.svg"))
    ).rejects.toThrow(/currentColor/);
  });

  it("rechaza el fixture sin viewBox", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("sin-viewbox.svg"))
    ).rejects.toThrow(/viewBox/);
  });

  it("rechaza el fixture con <script>", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("con-script.svg"))
    ).rejects.toThrow(/no permitido/);
  });

  it("avisa cuando el archivo no existe", async () => {
    await expect(
      assertBrandSymbolFileIsThemeReady(fixturePath("no-existe.svg"))
    ).rejects.toThrow();
  });
});

describe("integración simboloDeMarca", () => {
  it("deja compilar cuando el símbolo es válido", async () => {
    await expect(
      runConfigSetupHook(fixturePath("valido.svg"))
    ).resolves.toBeUndefined();
  });

  it("detiene la compilación cuando el símbolo trae un color fijo", async () => {
    await expect(runConfigSetupHook(fixturePath("con-hex.svg"))).rejects.toThrow(
      /currentColor/
    );
  });
});
