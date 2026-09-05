import type { Dirent } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  defaultAuthorsDirectory,
  readAuthorsDirectoryEntries
} from "./authors-directory";
import {
  defaultStoriesDirectory,
  readStoriesDirectoryEntries
} from "./stories-directory";

// Solo etiquetas HTML reales: una comparación numérica en prosa ("de < 5% a
// > 8%") no debe bloquear la publicación de una historia.
const RAW_HTML_PATTERN = /<\/?[a-zA-Z][^>]*>/;

export function assertNoRawHtml(value: string, filePath: string): void {
  if (RAW_HTML_PATTERN.test(value)) {
    throw new Error(`Raw HTML is not allowed in ${filePath}.`);
  }
}

async function assertMarkdownFilesHaveNoRawHtml(
  directory: string,
  entries: readonly Dirent[]
): Promise<void> {
  const filenames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);

  for (const filename of filenames) {
    const filePath = path.join(directory, filename);
    assertNoRawHtml(await readFile(filePath, "utf8"), filePath);
  }
}

/**
 * Rechaza HTML crudo en las historias antes de que Astro las compile.
 *
 * Se valida el texto completo del archivo, sin volver a parsear el
 * frontmatter: un segundo parser que interpretara el archivo distinto a como
 * lo hace el loader `glob()` de Astro sería justamente por donde se colaría un
 * bypass de esta validación.
 */
export async function assertStoriesHaveNoRawHtml(
  directory = defaultStoriesDirectory
): Promise<void> {
  await assertMarkdownFilesHaveNoRawHtml(
    directory,
    await readStoriesDirectoryEntries(directory)
  );
}

/**
 * Lo mismo para las fichas de autoría.
 *
 * El cuerpo de una ficha es Markdown que el sitio renderiza igual que el de
 * una historia, así que sin este gate la biografía sería la vía de inyección
 * que las historias ya tienen cerrada.
 */
export async function assertAuthorsHaveNoRawHtml(
  directory = defaultAuthorsDirectory
): Promise<void> {
  await assertMarkdownFilesHaveNoRawHtml(
    directory,
    await readAuthorsDirectoryEntries(directory)
  );
}
