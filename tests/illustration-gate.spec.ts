import path from "node:path";
import type { AstroIntegration } from "astro";
import { describe, expect, it } from "vitest";
import {
  assertIllustrationFileIsThemeReady,
  assertIllustrationIsThemeReady,
  defaultIllustrationPath
} from "../src/lib/assets/illustration-gate";
import { portadaIllustration } from "../src/lib/assets/illustration-gate-integration";

type ConfigSetupHook = NonNullable<
  AstroIntegration["hooks"]["astro:config:setup"]
>;
type ConfigSetupOptions = Parameters<ConfigSetupHook>[0];

const fixturePath = (name: string): string =>
  path.resolve(process.cwd(), "tests/fixtures/ilustracion", name);

async function runConfigSetupHook(filePath: string): Promise<void> {
  const hook = portadaIllustration(filePath).hooks["astro:config:setup"];
  await hook?.({} as ConfigSetupOptions);
}

describe("assertIllustrationIsThemeReady", () => {
  it("acepta un dibujo con sus dos clases de tinta", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><path class="ink-base" d="M0,0 L10,0 L10,10 L0,10 Z" /><path class="ink-acento" d="M0,10 L10,10 L10,20 L0,20 Z" /></svg>';

    expect(() =>
      assertIllustrationIsThemeReady(svg, "planta.svg")
    ).not.toThrow();
  });

  it("rechaza un dibujo al que le falta la tinta de acento", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><path class="ink-base" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertIllustrationIsThemeReady(svg, "planta.svg")).toThrow(
      /ink-acento/
    );
  });

  it("rechaza un dibujo al que le falta la tinta base", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><path class="ink-acento" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertIllustrationIsThemeReady(svg, "planta.svg")).toThrow(
      /ink-base/
    );
  });

  // Es el caso que motivó el gate: el dibujo llegó de la herramienta de diseño
  // con los colores en un <style>, y así no se adapta al tema.
  it("sigue rechazando lo que rechaza el gate compartido", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><style>.ink-base{fill:#000}</style><path class="ink-base" d="M0,0 Z" /><path class="ink-acento" d="M0,0 Z" /></svg>';

    expect(() => assertIllustrationIsThemeReady(svg, "planta.svg")).toThrow(
      /<style>/
    );
  });
});

describe("assertIllustrationFileIsThemeReady", () => {
  it("acepta la ilustración que sirve el sitio", async () => {
    await expect(
      assertIllustrationFileIsThemeReady()
    ).resolves.toBeUndefined();
  });

  it("apunta por defecto a la planta de libros", () => {
    expect(defaultIllustrationPath).toContain(
      path.join("src", "assets", "ilustraciones", "planta-de-libros.svg")
    );
  });

  it("acepta el fixture válido", async () => {
    await expect(
      assertIllustrationFileIsThemeReady(fixturePath("valid.svg"))
    ).resolves.toBeUndefined();
  });

  it("rechaza el fixture sin una de las tintas", async () => {
    await expect(
      assertIllustrationFileIsThemeReady(fixturePath("missing-ink.svg"))
    ).rejects.toThrow(/ink-acento/);
  });

  it("avisa cuando el archivo no existe", async () => {
    await expect(
      assertIllustrationFileIsThemeReady(fixturePath("missing.svg"))
    ).rejects.toThrow();
  });
});

describe("integración portadaIllustration", () => {
  it("deja compilar cuando la ilustración es válida", async () => {
    await expect(
      runConfigSetupHook(fixturePath("valid.svg"))
    ).resolves.toBeUndefined();
  });

  it("detiene la compilación cuando falta una tinta", async () => {
    await expect(
      runConfigSetupHook(fixturePath("missing-ink.svg"))
    ).rejects.toThrow(/ink-acento/);
  });
});
