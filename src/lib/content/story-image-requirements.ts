import { stat, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  defaultStoriesDirectory,
  readStoriesDirectoryEntries
} from "./stories-directory";

const ASSET_FILENAME = "principal.jpg";
const STORY_EXTENSION = ".md";
const REQUIRED_FRONTMATTER_KEYS = [
  "imageAlt",
  "imageCredit",
  "imageLicense"
] as const;

// Cualquier historia con imagen entra al build; estos límites acotan cuánto
// puede pesar y medir esa imagen (ADR 0005, decisión 5).
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION_PX = 4000;

async function statOrNull(filePath: string) {
  try {
    return await stat(filePath);
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw cause;
  }
}

/**
 * Extrae el bloque de frontmatter (entre las dos primeras líneas `---`) sin
 * parsearlo como YAML: alcanza con el texto crudo para buscar claves, y así
 * esta comprobación no puede discrepar del cargador de Astro sobre qué
 * significa el contenido (mismo criterio que `raw-html-gate.ts`).
 */
function extractFrontmatter(fileText: string): string {
  const lines = fileText.split("\n");
  if (lines[0]?.trim() !== "---") {
    return "";
  }

  const closingIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (closingIndex === -1) {
    return "";
  }

  return lines.slice(1, closingIndex + 1).join("\n");
}

function hasFrontmatterKey(frontmatter: string, key: string): boolean {
  return new RegExp(`^${key}:`, "m").test(frontmatter);
}

async function assertImageContentIsValid(imagePath: string): Promise<void> {
  const imageStats = await stat(imagePath);
  if (imageStats.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `${imagePath} pesa ${imageStats.size} bytes, más del máximo permitido (${MAX_IMAGE_BYTES}).`
    );
  }

  let metadata;
  try {
    metadata = await sharp(imagePath).metadata();
  } catch (cause) {
    throw new Error(
      `${imagePath} no se pudo leer como imagen: el nombre del archivo no garantiza su contenido.`,
      { cause }
    );
  }

  if (metadata.format !== "jpeg") {
    throw new Error(
      `${imagePath} no es un JPEG real (se detectó "${metadata.format}"). El nombre del archivo no garantiza su contenido.`
    );
  }

  // Ya se confirmó arriba que es un JPEG real: sharp siempre informa ancho y
  // alto para ese formato, no hace falta un valor por defecto que nunca se usa.
  const width = metadata.width!;
  const height = metadata.height!;
  if (width > MAX_IMAGE_DIMENSION_PX || height > MAX_IMAGE_DIMENSION_PX) {
    throw new Error(
      `${imagePath} mide ${width}x${height}px, más del máximo permitido (${MAX_IMAGE_DIMENSION_PX}px por lado).`
    );
  }
}

/**
 * Valida lo que el gate de carpetas (`story-asset-folders.ts`) no cubre:
 * que `principal.jpg` sea de verdad un JPEG dentro de límites razonables de
 * tamaño y dimensiones, y que su presencia sea consistente con el
 * frontmatter de la historia — `imageAlt`, `imageCredit` e `imageLicense`
 * deben declararse los tres juntos si hay imagen, y ninguno si no la hay.
 */
export async function assertStoryImageRequirementsAreValid(
  directory = defaultStoriesDirectory
): Promise<void> {
  const entries = await readStoriesDirectoryEntries(directory);
  const storyFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(STORY_EXTENSION)
  );

  for (const storyFile of storyFiles) {
    const slug = storyFile.name.slice(0, -STORY_EXTENSION.length);
    const storyPath = path.join(directory, storyFile.name);
    const imagePath = path.join(directory, slug, ASSET_FILENAME);

    const imageExists = (await statOrNull(imagePath)) !== null;
    const storyText = await readFile(storyPath, "utf8");
    const frontmatter = extractFrontmatter(storyText);
    const declaredKeys = REQUIRED_FRONTMATTER_KEYS.filter((key) =>
      hasFrontmatterKey(frontmatter, key)
    );

    if (imageExists) {
      const missingKeys = REQUIRED_FRONTMATTER_KEYS.filter(
        (key) => !declaredKeys.includes(key)
      );
      if (missingKeys.length > 0) {
        throw new Error(
          `${storyFile.name} tiene imagen (${slug}/${ASSET_FILENAME}) pero no declara: ${missingKeys.join(", ")}.`
        );
      }
      await assertImageContentIsValid(imagePath);
    } else if (declaredKeys.length > 0) {
      throw new Error(
        `${storyFile.name} declara ${declaredKeys.join(", ")} pero no existe ${slug}/${ASSET_FILENAME}.`
      );
    }
  }
}
