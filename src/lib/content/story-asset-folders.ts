import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  assertBroadcastRecordIsValid,
  BROADCAST_RECORD_FILENAME
} from "./story-broadcast";
import {
  assertStoryCommentIsValid,
  COMMENT_FILENAME_PATTERN
} from "./story-comment";
import {
  defaultStoriesDirectory,
  readStoriesDirectoryEntries
} from "./stories-directory";

const IMAGE_FILENAME = "principal.jpg";
const ALLOWED_ASSET_FILENAMES = [IMAGE_FILENAME, BROADCAST_RECORD_FILENAME];
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

  if (
    !ALLOWED_ASSET_FILENAMES.includes(assetEntry.name) &&
    !COMMENT_FILENAME_PATTERN.test(assetEntry.name)
  ) {
    throw new Error(
      `${assetPath} no está permitido. Solo se admiten ${ALLOWED_ASSET_FILENAMES.map((name) => `"${name}"`).join(", ")} y "comentario-<id>.json" dentro de la carpeta de una historia.`
    );
  }
}

async function assertAssetFolderContentsAreValid(
  folderName: string,
  folderPath: string
): Promise<void> {
  const assetEntries = await readdir(folderPath, { withFileTypes: true });

  for (const assetEntry of assetEntries) {
    const assetPath = path.join(folderPath, assetEntry.name);
    assertAssetEntryIsAllowed(assetEntry, assetPath);

    if (assetEntry.name === BROADCAST_RECORD_FILENAME) {
      assertBroadcastRecordIsValid(
        await readFile(assetPath, "utf8"),
        folderName,
        assetPath
      );
    }

    if (COMMENT_FILENAME_PATTERN.test(assetEntry.name)) {
      assertStoryCommentIsValid(
        await readFile(assetPath, "utf8"),
        folderName,
        assetEntry.name,
        assetPath
      );
    }
  }
}

/**
 * Rechaza cualquier carpeta anidada dentro de `stories/` que no cumpla las
 * reglas de la imagen de una historia (issue #29, prerrequisito del ADR 0005):
 * la carpeta debe espejar el nombre de una historia existente, no puede
 * anidar otra carpeta, y solo puede contener `principal.jpg`, el registro
 * de difusión `difusion.json` (ADR 0032) y los comentarios públicos de
 * lectores `comentario-<id>.json` (ADR 0036), estos dos validados contra su
 * esquema. Los comentarios son el único nombre que admite un patrón y no un
 * literal: hay uno por archivo y no se conoce de antemano cuántos. Un
 * `.md` (u otro archivo) colado ahí es exactamente el hallazgo que el ADR 0005
 * describe como agujero del gate anti-HTML cuando no era recursivo.
 */
export async function assertStoryAssetFoldersAreValid(
  directory = defaultStoriesDirectory
): Promise<void> {
  const entries = await readStoriesDirectoryEntries(directory);
  const storySlugs = storySlugsIn(entries);

  for (const folder of assetFoldersIn(entries)) {
    const folderPath = path.join(directory, folder.name);
    assertFolderMatchesAStory(folder.name, folderPath, storySlugs);
    await assertAssetFolderContentsAreValid(folder.name, folderPath);
  }
}
