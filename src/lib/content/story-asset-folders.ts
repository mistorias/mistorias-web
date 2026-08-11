import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  defaultStoriesDirectory,
  readStoriesDirectoryEntries
} from "./content-loader";

const ALLOWED_ASSET_FILENAME = "principal.jpg";
const STORY_EXTENSION = ".md";

/**
 * Rechaza cualquier carpeta anidada dentro de `stories/` que no cumpla las
 * reglas de la imagen de una historia (issue #29, prerrequisito del ADR 0005):
 * la carpeta debe espejar el nombre de una historia existente, no puede
 * anidar otra carpeta, y solo puede contener `principal.jpg`. Un `.md` (u
 * otro archivo) colado ahí es exactamente el hallazgo que el ADR describe
 * como agujero del gate anti-HTML cuando no era recursivo.
 */
export async function assertStoryAssetFoldersAreValid(
  directory = defaultStoriesDirectory
): Promise<void> {
  const entries = await readStoriesDirectoryEntries(directory);

  const storySlugs = new Set(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(STORY_EXTENSION))
      .map((entry) => entry.name.slice(0, -STORY_EXTENSION.length))
  );

  const assetFolders = entries.filter((entry) => entry.isDirectory());

  for (const folder of assetFolders) {
    const folderPath = path.join(directory, folder.name);

    if (!storySlugs.has(folder.name)) {
      throw new Error(
        `La carpeta ${folderPath} no coincide con ninguna historia. Debe llamarse igual que su historia (${folder.name}${STORY_EXTENSION}).`
      );
    }

    const assetEntries = await readdir(folderPath, { withFileTypes: true });

    for (const assetEntry of assetEntries) {
      const assetPath = path.join(folderPath, assetEntry.name);

      if (assetEntry.isDirectory()) {
        throw new Error(
          `No se permite más de un nivel de carpeta anidada: ${assetPath}.`
        );
      }

      if (assetEntry.name !== ALLOWED_ASSET_FILENAME) {
        throw new Error(
          `${assetPath} no está permitido. Solo se admite "${ALLOWED_ASSET_FILENAME}" dentro de la carpeta de una historia.`
        );
      }
    }
  }
}
