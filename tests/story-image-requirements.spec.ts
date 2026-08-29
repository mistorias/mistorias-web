import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";
import { assertStoryImageRequirementsAreValid } from "../src/lib/content/story-image-requirements";

const temporaryDirectories: string[] = [];

async function prepareStoriesDirectory(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "mistorias-web-img-"));
  temporaryDirectories.push(tempRoot);
  const storiesDirectory = path.join(tempRoot, "stories");
  await mkdir(storiesDirectory, { recursive: true });
  return storiesDirectory;
}

async function writeStory(
  storiesDirectory: string,
  slug: string,
  frontmatterExtra = ""
): Promise<void> {
  await writeFile(
    path.join(storiesDirectory, `${slug}.md`),
    `---\ntitle: prueba\n${frontmatterExtra}---\ncuerpo\n`
  );
}

async function writeValidImage(
  storiesDirectory: string,
  slug: string,
  dimensions: { width: number; height: number } = { width: 10, height: 10 }
): Promise<void> {
  const folder = path.join(storiesDirectory, slug);
  await mkdir(folder, { recursive: true });
  const buffer = await sharp({
    create: {
      width: dimensions.width,
      height: dimensions.height,
      channels: 3,
      background: { r: 10, g: 20, b: 30 }
    }
  })
    .jpeg()
    .toBuffer();
  await writeFile(path.join(folder, "principal.jpg"), buffer);
}

async function writeDisguisedImage(
  storiesDirectory: string,
  slug: string
): Promise<void> {
  const folder = path.join(storiesDirectory, slug);
  await mkdir(folder, { recursive: true });
  await writeFile(
    path.join(folder, "principal.jpg"),
    "<svg onload=\"alert(1)\"></svg>"
  );
}

const IMAGE_FRONTMATTER =
  'imageAlt: "Descripción"\nimageCredit: "Equipo Mistorias"\nimageLicense: "CC BY-NC 4.0"\n';

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    })
  );
});

describe("assertStoryImageRequirementsAreValid", () => {
  it("acepta una historia sin imagen y sin ninguna de las tres claves", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "sin-imagen");

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("acepta una historia con imagen válida y las tres claves declaradas", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "con-imagen", IMAGE_FRONTMATTER);
    await writeValidImage(storiesDirectory, "con-imagen");

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("rechaza una imagen sin ninguna de las tres claves en el frontmatter", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "con-imagen");
    await writeValidImage(storiesDirectory, "con-imagen");

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).rejects.toThrow(/no declara: imageAlt, imageCredit, imageLicense/);
  });

  it("rechaza una imagen a la que le falta una sola clave", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(
      storiesDirectory,
      "con-imagen",
      'imageAlt: "Descripción"\nimageCredit: "Equipo Mistorias"\n'
    );
    await writeValidImage(storiesDirectory, "con-imagen");

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).rejects.toThrow(/no declara: imageLicense/);
  });

  it("rechaza las tres claves declaradas cuando no existe la imagen", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "sin-imagen", IMAGE_FRONTMATTER);

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).rejects.toThrow(/no existe sin-imagen\/principal\.jpg/);
  });

  it("rechaza un archivo disfrazado de JPEG (cabecera real distinta)", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "con-imagen", IMAGE_FRONTMATTER);
    await writeDisguisedImage(storiesDirectory, "con-imagen");

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).rejects.toThrow(/no se pudo leer como imagen/);
  });

  it("rechaza una imagen que excede el tamaño máximo en bytes", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "con-imagen", IMAGE_FRONTMATTER);
    const folder = path.join(storiesDirectory, "con-imagen");
    await mkdir(folder, { recursive: true });
    const oversizedBuffer = Buffer.concat([
      await sharp({
        create: { width: 10, height: 10, channels: 3, background: "#000" }
      })
        .jpeg()
        .toBuffer(),
      Buffer.alloc(6 * 1024 * 1024)
    ]);
    await writeFile(path.join(folder, "principal.jpg"), oversizedBuffer);

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).rejects.toThrow(/pesa \d+ bytes, más del máximo permitido/);
  });

  it("rechaza una imagen que excede las dimensiones máximas", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "con-imagen", IMAGE_FRONTMATTER);
    await writeValidImage(storiesDirectory, "con-imagen", {
      width: 4001,
      height: 10
    });

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).rejects.toThrow(/más del máximo permitido \(4000px por lado\)/);
  });

  it("rechaza un archivo que decodifica pero no como JPEG (formato real distinto)", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "con-imagen", IMAGE_FRONTMATTER);
    const folder = path.join(storiesDirectory, "con-imagen");
    await mkdir(folder, { recursive: true });
    const pngBuffer = await sharp({
      create: { width: 10, height: 10, channels: 3, background: "#000" }
    })
      .png()
      .toBuffer();
    await writeFile(path.join(folder, "principal.jpg"), pngBuffer);

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).rejects.toThrow(/no es un JPEG real \(se detectó "png"\)/);
  });

  it("acepta una historia sin frontmatter y sin imagen (archivo mal formado, sin `---` inicial)", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeFile(
      path.join(storiesDirectory, "sin-frontmatter.md"),
      "cuerpo sin frontmatter\n"
    );

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("acepta una historia con `---` inicial pero sin cierre, y sin imagen", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeFile(
      path.join(storiesDirectory, "frontmatter-sin-cierre.md"),
      "---\ntitle: prueba\ncuerpo sin cierre\n"
    );

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).resolves.toBeUndefined();
  });

  it("relanza un error de sistema de archivos que no sea ENOENT al comprobar la imagen", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    // "obstaculo" es un archivo, no una carpeta: intentar leer algo debajo de
    // él falla con ENOTDIR, no con ENOENT, y ese es el código que
    // `statOrNull` no debe tragarse.
    await writeStory(storiesDirectory, "obstaculo");
    await writeFile(path.join(storiesDirectory, "obstaculo"), "no es una carpeta");

    await expect(
      assertStoryImageRequirementsAreValid(storiesDirectory)
    ).rejects.toThrow(/ENOTDIR/);
  });
});
