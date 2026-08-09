import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Solo etiquetas HTML reales: una comparación numérica en prosa ("de < 5% a
// > 8%") no debe bloquear la publicación de una historia.
const RAW_HTML_PATTERN = /<\/?[a-zA-Z][^>]*>/;

const defaultStoriesDirectory = path.resolve(
  process.cwd(),
  "content/mistorias-contenido/stories"
);

export function assertNoRawHtml(value: string, filePath: string): void {
  if (RAW_HTML_PATTERN.test(value)) {
    throw new Error(`Raw HTML is not allowed in ${filePath}.`);
  }
}

async function readStoryFilenames(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name);
  } catch (cause) {
    throw new Error(
      `No se pudo leer ${directory}. Revisa que el submódulo de contenido esté inicializado: git submodule update --init --recursive`,
      { cause }
    );
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
  const filenames = await readStoryFilenames(directory);

  for (const filename of filenames) {
    const filePath = path.join(directory, filename);
    assertNoRawHtml(await readFile(filePath, "utf8"), filePath);
  }
}
