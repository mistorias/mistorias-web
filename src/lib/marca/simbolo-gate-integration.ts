import type { AstroIntegration } from "astro";
import { assertBrandSymbolFileIsThemeReady } from "./simbolo-gate";

/**
 * Integración que impide compilar un símbolo de marca que no se adapte al
 * tema. Igual que `noRawHtml` y `storyAssetFolders`, cuelga del hook
 * `astro:config:setup` para correr tanto en `astro dev` como en `astro build`.
 */
export function simboloDeMarca(filePath?: string): AstroIntegration {
  return {
    name: "mistorias-simbolo-de-marca",
    hooks: {
      "astro:config:setup": async () => {
        await assertBrandSymbolFileIsThemeReady(filePath);
      }
    }
  };
}
