import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { AstroIntegration } from "astro";
import { afterEach, describe, expect, it } from "vitest";
import { assertStoryAssetFoldersAreValid } from "../src/lib/content/story-asset-folders";
import { storyAssetFolders } from "../src/lib/content/story-asset-folders-integration";

type ConfigSetupHook = NonNullable<
  AstroIntegration["hooks"]["astro:config:setup"]
>;
type ConfigSetupOptions = Parameters<ConfigSetupHook>[0];

const temporaryDirectories: string[] = [];

async function prepareStoriesDirectory(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "mistorias-web-"));
  temporaryDirectories.push(tempRoot);
  const storiesDirectory = path.join(tempRoot, "stories");
  await mkdir(storiesDirectory, { recursive: true });
  return storiesDirectory;
}

async function writeStory(storiesDirectory: string, slug: string): Promise<void> {
  await writeFile(
    path.join(storiesDirectory, `${slug}.md`),
    "---\ntitle: prueba\n---\ncuerpo\n"
  );
}

async function writeAsset(
  storiesDirectory: string,
  ...segments: string[]
): Promise<void> {
  const assetPath = path.join(storiesDirectory, ...segments);
  await mkdir(path.dirname(assetPath), { recursive: true });
  await writeFile(assetPath, "contenido-de-prueba");
}

async function runConfigSetupHook(directory: string): Promise<void> {
  const hook = storyAssetFolders(directory).hooks["astro:config:setup"];
  await hook?.({} as ConfigSetupOptions);
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    })
  );
});

describe("assertStoryAssetFoldersAreValid", () => {
  it("acepta historias sin ninguna carpeta anidada", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "valid-story");

    await expect(
      assertStoryAssetFoldersAreValid(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("acepta una carpeta anidada que coincide con su historia y solo trae principal.jpg", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "valid-story");
    await writeAsset(storiesDirectory, "valid-story", "principal.jpg");

    await expect(
      assertStoryAssetFoldersAreValid(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("acepta una carpeta anidada todavía sin imagen", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "valid-story");
    await mkdir(path.join(storiesDirectory, "valid-story"), {
      recursive: true
    });

    await expect(
      assertStoryAssetFoldersAreValid(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("rechaza una carpeta anidada que no coincide con ninguna historia", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "valid-story");
    await writeAsset(storiesDirectory, "otra-carpeta", "principal.jpg");

    await expect(
      assertStoryAssetFoldersAreValid(storiesDirectory)
    ).rejects.toThrow(/no coincide con ninguna historia/);
  });

  it("rechaza un archivo fuera de la allow list dentro de la carpeta anidada", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "valid-story");
    await writeAsset(storiesDirectory, "valid-story", "imagen.png");

    await expect(
      assertStoryAssetFoldersAreValid(storiesDirectory)
    ).rejects.toThrow(/no está permitido/);
  });

  it("rechaza variantes del nombre permitido (mayúsculas o extensión distinta)", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "valid-story");
    await writeAsset(storiesDirectory, "valid-story", "Principal.jpg");

    await expect(
      assertStoryAssetFoldersAreValid(storiesDirectory)
    ).rejects.toThrow(/no está permitido/);
  });

  it("rechaza un .md anidado, cerrando el hallazgo del ADR 0005 sobre el gate no recursivo", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "anidada");
    await writeAsset(storiesDirectory, "anidada", "prueba.md");

    await expect(
      assertStoryAssetFoldersAreValid(storiesDirectory)
    ).rejects.toThrow(/no está permitido/);
  });

  it("rechaza más de un nivel de carpeta anidada", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "valid-story");
    await writeAsset(
      storiesDirectory,
      "valid-story",
      "mas-anidado",
      "principal.jpg"
    );

    await expect(
      assertStoryAssetFoldersAreValid(storiesDirectory)
    ).rejects.toThrow(/más de un nivel/);
  });

  it("avisa que el submódulo de contenido no está inicializado", async () => {
    const missingDirectory = path.join(os.tmpdir(), "mistorias-web-inexistente");

    await expect(
      assertStoryAssetFoldersAreValid(missingDirectory)
    ).rejects.toThrow(/submódulo de contenido/);
  });
});

describe("integración storyAssetFolders", () => {
  it("deja compilar cuando la carpeta anidada es válida", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "valid-story");
    await writeAsset(storiesDirectory, "valid-story", "principal.jpg");

    await expect(
      runConfigSetupHook(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("detiene la compilación cuando la carpeta anidada trae un archivo no permitido", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "valid-story");
    await writeAsset(storiesDirectory, "valid-story", "imagen.png");

    await expect(runConfigSetupHook(storiesDirectory)).rejects.toThrow(
      /no está permitido/
    );
  });
});
