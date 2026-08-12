import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  defaultStoriesDirectory,
  readStoriesDirectoryEntries
} from "./stories-directory";

const ALLOWED_ASSET_FILENAME = "principal.jpg";
const STORY_EXTENSION = ".md";

function storySlugsIn(entries: Dirent[]): Set<string> {
  return new Set(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(STORY_EXTENSION))
      .map((entry) => entry.name.slice(0, -STORY_EXTENSION.length))
  );
}

function assetFoldersIn(entries: Dirent[]): Dirent[] {
  return entries.filter((entry) => entry.isDirectory());
}

function assertFolderMatchesAStory(
  folderName: string,
  folderPath: string,
  storySlugs: Set<string>
): void {
  if (!storySlugs.has(folderName)) {
    throw new Error(
      `La carpeta ${folderPath} no coincide con ninguna historia. Debe llamarse igual que su historia (${folderName}${STORY_EXTENSION}).`
    );
  }
}

function assertAssetEntryIsAllowed(assetEntry: Dirent, assetPath: string): void {
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

async function assertAssetFolderContentsAreValid(
  folderPath: string
): Promise<void> {
  const assetEntries = await readdir(folderPath, { withFileTypes: true });

  for (const assetEntry of assetEntries) {
    assertAssetEntryIsAllowed(assetEntry, path.join(folderPath, assetEntry.name));
  }
}

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
  const storySlugs = storySlugsIn(entries);

  for (const folder of assetFoldersIn(entries)) {
    const folderPath = path.join(directory, folder.name);
    assertFolderMatchesAStory(folder.name, folderPath, storySlugs);
    await assertAssetFolderContentsAreValid(folderPath);
  }
}
