import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { assertStoryImageRequirementsAreValid } from "./story-image-requirements";
import { assertBuiltImagesAreOptimized } from "./assert-built-images-are-optimized";

/**
 * Integración que impide compilar una `principal.jpg` inválida (formato,
 * tamaño o dimensiones) o inconsistente con el frontmatter de su historia.
 * Complementa a `storyAssetFolders`, que valida carpeta y nombre pero no el
 * contenido del archivo. Cuelga de `astro:config:setup` para lo anterior, y
 * de `astro:build:done` para la aserción post-build de la decisión 5 del
 * ADR 0005 (ningún `<img src>` fuera de `/_astro/`).
 */
export function storyImageRequirements(directory?: string): AstroIntegration {
  return {
    name: "mistorias-story-image-requirements",
    hooks: {
      "astro:config:setup": async () => {
        await assertStoryImageRequirementsAreValid(directory);
      },
      "astro:build:done": async ({ dir }) => {
        await assertBuiltImagesAreOptimized(fileURLToPath(dir));
      }
    }
  };
}
