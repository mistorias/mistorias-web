import type { AstroIntegration } from "astro";
import { assertStoryAssetFoldersAreValid } from "./story-asset-folders";

/**
 * Integración que impide compilar carpetas de imagen inválidas dentro de
 * `stories/`. Igual que `noRawHtml`, cuelga del hook `astro:config:setup`
 * para correr tanto en `astro dev` como en `astro build`.
 */
export function storyAssetFolders(directory?: string): AstroIntegration {
  return {
    name: "mistorias-story-asset-folders",
    hooks: {
      "astro:config:setup": async () => {
        await assertStoryAssetFoldersAreValid(directory);
      }
    }
  };
}
