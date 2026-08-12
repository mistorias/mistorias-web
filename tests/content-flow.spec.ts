import { cp, mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AstroIntegration } from "astro";
import { afterEach, describe, expect, it } from "vitest";
import { assertStoriesHaveNoRawHtml } from "../src/lib/content/raw-html-gate";
import { noRawHtml } from "../src/lib/content/no-raw-html-integration";

type ConfigSetupHook = NonNullable<
  AstroIntegration["hooks"]["astro:config:setup"]
>;
type ConfigSetupOptions = Parameters<ConfigSetupHook>[0];

const fixturePath = (name: string): string =>
  path.resolve(process.cwd(), "tests/fixtures", name);

const temporaryDirectories: string[] = [];

async function prepareStoriesDirectory(
  ...fixtureFilenames: string[]
): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "mistorias-web-"));
  temporaryDirectories.push(tempRoot);
  const storiesDirectory = path.join(tempRoot, "stories");
  await mkdir(storiesDirectory, { recursive: true });

  for (const fixtureFilename of fixtureFilenames) {
    await cp(
      fixturePath(fixtureFilename),
      path.join(storiesDirectory, fixtureFilename)
    );
  }

  return storiesDirectory;
}

async function runConfigSetupHook(directory: string): Promise<void> {
  const hook = noRawHtml(directory).hooks["astro:config:setup"];
  await hook?.({} as ConfigSetupOptions);
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    })
  );
});

describe("assertStoriesHaveNoRawHtml", () => {
  it("acepta una historia en markdown sin HTML crudo", async () => {
    const storiesDirectory = await prepareStoriesDirectory("valid-story.md");

    await expect(
      assertStoriesHaveNoRawHtml(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("acepta comparaciones numéricas que usan los signos < y >", async () => {
    const storiesDirectory = await prepareStoriesDirectory(
      "valid-story-with-comparisons.md"
    );

    await expect(
      assertStoriesHaveNoRawHtml(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("rechaza una historia con HTML ejecutable en el cuerpo", async () => {
    const storiesDirectory = await prepareStoriesDirectory(
      "invalid-story-raw-html.md"
    );

    await expect(assertStoriesHaveNoRawHtml(storiesDirectory)).rejects.toThrow(
      /Raw HTML is not allowed/
    );
  });

  it("rechaza el directorio completo cuando solo una historia trae HTML crudo", async () => {
    const storiesDirectory = await prepareStoriesDirectory(
      "valid-story.md",
      "invalid-story-raw-html.md"
    );

    await expect(assertStoriesHaveNoRawHtml(storiesDirectory)).rejects.toThrow(
      /invalid-story-raw-html\.md/
    );
  });

  it("avisa que el submódulo de contenido no está inicializado", async () => {
    const missingDirectory = path.join(os.tmpdir(), "mistorias-web-inexistente");

    await expect(assertStoriesHaveNoRawHtml(missingDirectory)).rejects.toThrow(
      /submódulo de contenido/
    );
  });
});

describe("integración noRawHtml", () => {
  it("deja compilar cuando todas las historias son válidas", async () => {
    const storiesDirectory = await prepareStoriesDirectory("valid-story.md");

    await expect(
      runConfigSetupHook(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("detiene la compilación cuando una historia trae HTML ejecutable", async () => {
    const storiesDirectory = await prepareStoriesDirectory(
      "invalid-story-raw-html.md"
    );

    await expect(runConfigSetupHook(storiesDirectory)).rejects.toThrow(
      /Raw HTML is not allowed/
    );
  });
});
