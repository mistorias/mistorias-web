import type { Dirent } from "node:fs";
import path from "node:path";
import { readStoriesDirectoryEntries } from "./stories-directory";

export const defaultAuthorsDirectory = path.resolve(
  process.cwd(),
  "content/mistorias-contenido/authors"
);

/**
 * Lee las entradas de `authors/`.
 *
 * Reusa el lector de `stories/` porque lo que hay que decir cuando la carpeta
 * no existe es exactamente lo mismo: el submódulo de contenido no está
 * inicializado, y así se inicializa.
 */
export const readAuthorsDirectoryEntries = (
  directory: string
): Promise<Dirent[]> => readStoriesDirectoryEntries(directory);
