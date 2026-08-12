import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

export const defaultStoriesDirectory = path.resolve(
  process.cwd(),
  "content/mistorias-contenido/stories"
);

/**
 * Lee las entradas de `stories/`, con el mismo mensaje de error para todo lo
 * que valida esa carpeta (gate anti-HTML y gate de carpetas de imagen).
 */
export async function readStoriesDirectoryEntries(
  directory: string
): Promise<Dirent[]> {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (cause) {
    throw new Error(
      `No se pudo leer ${directory}. Revisa que el submódulo de contenido esté inicializado: git submodule update --init --recursive`,
      { cause }
    );
  }
}
