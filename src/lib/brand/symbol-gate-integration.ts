import type { AstroIntegration } from "astro";
import { assertBrandSymbolFileIsThemeReady } from "./symbol-gate";

/**
 * Integración que impide compilar un símbolo de marca que no se adapte al
 * tema. Igual que `noRawHtml` y `storyAssetFolders`, cuelga del hook
 * `astro:config:setup` para correr tanto en `astro dev` como en `astro build`.
 */
export function brandSymbol(filePath?: string): AstroIntegration {
  return {
    name: "mistorias-brand-symbol",
    hooks: {
      "astro:config:setup": async () => {
        await assertBrandSymbolFileIsThemeReady(filePath);
      }
    }
  };
}
