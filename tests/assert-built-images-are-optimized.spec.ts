import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertBuiltImagesAreOptimized } from "../src/lib/content/assert-built-images-are-optimized";

const temporaryDirectories: string[] = [];

async function prepareDistDirectory(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "mistorias-web-dist-"));
  temporaryDirectories.push(tempRoot);
  return tempRoot;
}

async function writeHtml(
  distDirectory: string,
  relativePath: string,
  html: string
): Promise<void> {
  const filePath = path.join(distDirectory, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, html);
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    })
  );
});

describe("assertBuiltImagesAreOptimized", () => {
  it("acepta un dist sin ninguna imagen", async () => {
    const distDirectory = await prepareDistDirectory();
    await writeHtml(distDirectory, "index.html", "<html><body>sin fotos</body></html>");

    await expect(
      assertBuiltImagesAreOptimized(distDirectory)
    ).resolves.toBeUndefined();
  });

  it("acepta un <img src> servido desde /_astro/", async () => {
    const distDirectory = await prepareDistDirectory();
    await writeHtml(
      distDirectory,
      "historias/una/index.html",
      '<img src="/_astro/principal.abc123.webp" alt="Una historia" />'
    );

    await expect(
      assertBuiltImagesAreOptimized(distDirectory)
    ).resolves.toBeUndefined();
  });

  it("acepta un <img src> con el base de GitHub Pages antepuesto", async () => {
    const distDirectory = await prepareDistDirectory();
    await writeHtml(
      distDirectory,
      "index.html",
      '<img src="/mistorias-web/_astro/principal.abc123.webp" alt="" />'
    );

    await expect(
      assertBuiltImagesAreOptimized(distDirectory)
    ).resolves.toBeUndefined();
  });

  it("rechaza un <img src> que no viene de astro:assets", async () => {
    const distDirectory = await prepareDistDirectory();
    await writeHtml(
      distDirectory,
      "historias/otra/index.html",
      '<img src="/content/mistorias-contenido/stories/otra/principal.jpg" alt="" />'
    );

    await expect(
      assertBuiltImagesAreOptimized(distDirectory)
    ).rejects.toThrow(/no pasó por la optimización de astro:assets/);
  });

  it("ignora archivos que no son .html, como los propios binarios de /_astro/", async () => {
    const distDirectory = await prepareDistDirectory();
    await writeHtml(
      distDirectory,
      "index.html",
      '<img src="/_astro/principal.abc123.webp" alt="" />'
    );
    await mkdir(path.join(distDirectory, "_astro"), { recursive: true });
    await writeFile(
      path.join(distDirectory, "_astro", "principal.abc123.webp"),
      Buffer.from([0, 1, 2])
    );

    await expect(
      assertBuiltImagesAreOptimized(distDirectory)
    ).resolves.toBeUndefined();
  });

  it("revisa subcarpetas anidadas", async () => {
    const distDirectory = await prepareDistDirectory();
    await writeHtml(
      distDirectory,
      "temas/educacion/index.html",
      '<img src="https://externo.example/foto.jpg" alt="" />'
    );

    await expect(
      assertBuiltImagesAreOptimized(distDirectory)
    ).rejects.toThrow(/no pasó por la optimización de astro:assets/);
  });
});
