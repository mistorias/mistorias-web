import { readFile } from "node:fs/promises";
import path from "node:path";
// Extensión `.ts` explícita: ver la nota equivalente en story-order-cache.ts.
import {
  defaultStoriesDirectory,
  readStoriesDirectoryEntries
} from "./stories-directory.ts";

const STORY_EXTENSION = ".md";

/**
 * Extrae el bloque de frontmatter (entre las dos primeras líneas `---`) sin
 * parsearlo como YAML: alcanza con el texto crudo para leer `date`, mismo
 * criterio que usa `story-image-requirements.ts` para no poder discrepar del
 * cargador real de Astro sobre qué contiene el archivo.
 */
function extractFrontmatter(fileText: string): string {
  const lines = fileText.split("\n");
  if (lines[0]?.trim() !== "---") {
    return "";
  }

  const closingIndex = lines
    .slice(1)
    .findIndex((line) => line.trim() === "---");
  if (closingIndex === -1) {
    return "";
  }

  return lines.slice(1, closingIndex + 1).join("\n");
}

function extractDate(frontmatter: string): Date | null {
  const match = frontmatter.match(/^date:\s*"?(\d{4}-\d{2}-\d{2})"?/m);
  return match ? new Date(match[1]) : null;
}

export type StoryDate = {
  readonly id: string;
  readonly date: Date;
};

/**
 * Lee `stories/*.md` directamente del disco —sin pasar por `getCollection`
 * ni el runtime de Astro— para que el script standalone
 * (`scripts/generate-story-order-cache.ts`) pueda correr fuera de un build
 * de Astro. Solo necesita `date`: `storySchema` (`schema.ts`) es quien valida
 * el resto del frontmatter en build.
 */
export async function readStoryDates(
  directory: string = defaultStoriesDirectory
): Promise<StoryDate[]> {
  const entries = await readStoriesDirectoryEntries(directory);
  const storyFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(STORY_EXTENSION)
  );

  return Promise.all(
    storyFiles.map(async (storyFile) => {
      const id = storyFile.name.slice(0, -STORY_EXTENSION.length);
      const storyPath = path.join(directory, storyFile.name);
      const storyText = await readFile(storyPath, "utf8");
      const date = extractDate(extractFrontmatter(storyText));

      if (date === null) {
        throw new Error(
          `${storyFile.name} no declara un "date" válido (yyyy-mm-dd) en su frontmatter.`
        );
      }

      return { id, date };
    })
  );
}
