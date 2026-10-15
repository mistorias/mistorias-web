import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { AstroIntegration } from "astro";
import { afterEach, describe, expect, it } from "vitest";
import {
  appendLatestStoryRedirect,
  buildLatestStoryRedirectRule,
  resolveLatestStory
} from "../src/lib/content/latest-story";
import { latestStoryRedirect } from "../src/lib/content/latest-story-redirect-integration";
import { writeCache, type StoryOrderCache } from "../src/lib/content/story-order-cache";

type ConfigSetupOptions = Parameters<
  NonNullable<AstroIntegration["hooks"]["astro:config:setup"]>
>[0];
type BuildDoneOptions = Parameters<
  NonNullable<AstroIntegration["hooks"]["astro:build:done"]>
>[0];

const temporaryDirectories: string[] = [];

async function makeTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "latest-story-"));
  temporaryDirectories.push(directory);
  return directory;
}

const cacheWithLatest = (latest: string | null): StoryOrderCache => ({
  generatedAt: "2026-10-14T00:00:00.000Z",
  hash: "irrelevante",
  order: [],
  latest,
  stories: {}
});

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    })
  );
});

describe("resolveLatestStory", () => {
  it("devuelve la última historia cuando el archivo coincide con las fechas", () => {
    expect(
      resolveLatestStory(cacheWithLatest("segunda"), ["primera", "segunda"])
    ).toBe("segunda");
  });

  it("devuelve null cuando todavía no hay historias", () => {
    expect(resolveLatestStory(cacheWithLatest(null), [])).toBeNull();
  });

  it("detiene el build cuando el archivo apunta a una historia anterior", () => {
    expect(() =>
      resolveLatestStory(cacheWithLatest("primera"), ["primera", "segunda"])
    ).toThrow(
      'data/story-order.json says the latest story is "primera", but by date it is "segunda". Run `pnpm story-order` and commit the result.'
    );
  });

  it("detiene el build cuando el archivo no existe", () => {
    expect(() => resolveLatestStory(null, ["primera"])).toThrow(
      'the latest story is "(none)"'
    );
  });

  it("detiene el build cuando el archivo no declara latest", () => {
    const { latest: _omitted, ...withoutLatest } = cacheWithLatest("primera");

    expect(() =>
      resolveLatestStory(withoutLatest as StoryOrderCache, ["primera"])
    ).toThrow('the latest story is "(none)"');
  });
});

// Netlify sirve el sitio en la raíz (`resolveDeploymentConfig`): la regla se
// escribe sin la base de GitHub Pages (issue #29). Las expectativas son texto
// literal, no el resultado de `routes.ts`: la prueba se lee sin saber qué
// devuelven esas funciones.
describe("buildLatestStoryRedirectRule", () => {
  it("lleva /ultima, sin barra final, a la página de la historia", () => {
    expect(buildLatestStoryRedirectRule("2026-10-09-freddy")).toBe(
      "/ultima  /historias/2026-10-09-freddy/  302"
    );
  });

  // El destino cambia con cada historia nueva: un 301 quedaría en caché.
  it("redirige de forma temporal", () => {
    expect(buildLatestStoryRedirectRule("segunda")).toMatch(/ 302$/);
  });

  it("no arrastra la base de GitHub Pages", () => {
    expect(buildLatestStoryRedirectRule("segunda")).not.toContain(
      "/mistorias-web"
    );
  });
});

describe("appendLatestStoryRedirect", () => {
  it("agrega la regla después de las que ya trae el artefacto", async () => {
    const outputDirectory = await makeTemporaryDirectory();
    const redirectsPath = path.join(outputDirectory, "_redirects");
    await writeFile(redirectsPath, "/etiquetas  /temas/  301\n");

    await appendLatestStoryRedirect(outputDirectory, "segunda");

    expect(await readFile(redirectsPath, "utf8")).toBe(
      "/etiquetas  /temas/  301\n/ultima  /historias/segunda/  302\n"
    );
  });

  it("no pega la regla a la última línea si esta no termina en salto", async () => {
    const outputDirectory = await makeTemporaryDirectory();
    const redirectsPath = path.join(outputDirectory, "_redirects");
    await writeFile(redirectsPath, "/etiquetas  /temas/  301");

    await appendLatestStoryRedirect(outputDirectory, "segunda");

    expect(await readFile(redirectsPath, "utf8")).toBe(
      "/etiquetas  /temas/  301\n/ultima  /historias/segunda/  302\n"
    );
  });

  it("crea el archivo cuando el artefacto no lo trae", async () => {
    const outputDirectory = await makeTemporaryDirectory();

    await appendLatestStoryRedirect(outputDirectory, "segunda");

    expect(
      await readFile(path.join(outputDirectory, "_redirects"), "utf8")
    ).toBe("/ultima  /historias/segunda/  302\n");
  });
});

describe("latestStoryRedirect", () => {
  async function prepareStories(
    stories: Record<string, string>
  ): Promise<string> {
    const storiesDirectory = path.join(await makeTemporaryDirectory(), "stories");
    await mkdir(storiesDirectory, { recursive: true });
    await Promise.all(
      Object.entries(stories).map(([id, date]) =>
        writeFile(
          path.join(storiesDirectory, `${id}.md`),
          `---\ntitle: prueba\ndate: ${date}\n---\ncuerpo\n`
        )
      )
    );
    return storiesDirectory;
  }

  async function runBuild(
    integration: AstroIntegration,
    outputDirectory: string
  ): Promise<void> {
    await integration.hooks["astro:config:setup"]?.({} as ConfigSetupOptions);
    await integration.hooks["astro:build:done"]?.({
      dir: pathToFileURL(`${outputDirectory}/`)
    } as BuildDoneOptions);
  }

  it("publica /ultima hacia la historia más reciente por fecha", async () => {
    const storiesDirectory = await prepareStories({
      reciente: "2026-10-09",
      antigua: "2026-07-24"
    });
    const cachePath = path.join(await makeTemporaryDirectory(), "order.json");
    writeCache(["antigua", "reciente"], cachePath);
    const outputDirectory = await makeTemporaryDirectory();

    await runBuild(latestStoryRedirect(storiesDirectory, cachePath), outputDirectory);

    expect(
      await readFile(path.join(outputDirectory, "_redirects"), "utf8")
    ).toBe("/ultima  /historias/reciente/  302\n");
  });

  it("detiene el build si falta correr pnpm story-order", async () => {
    const storiesDirectory = await prepareStories({
      antigua: "2026-07-24",
      nueva: "2026-10-16"
    });
    const cachePath = path.join(await makeTemporaryDirectory(), "order.json");
    writeCache(["antigua"], cachePath);

    await expect(
      latestStoryRedirect(storiesDirectory, cachePath).hooks[
        "astro:config:setup"
      ]?.({} as ConfigSetupOptions)
    ).rejects.toThrow("Run `pnpm story-order`");
  });

  it("no escribe ninguna regla cuando no hay historias", async () => {
    const storiesDirectory = await prepareStories({});
    const cachePath = path.join(await makeTemporaryDirectory(), "order.json");
    const outputDirectory = await makeTemporaryDirectory();

    await runBuild(latestStoryRedirect(storiesDirectory, cachePath), outputDirectory);

    await expect(
      readFile(path.join(outputDirectory, "_redirects"), "utf8")
    ).rejects.toThrow();
  });
});
