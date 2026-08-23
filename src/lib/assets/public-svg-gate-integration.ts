import type { AstroIntegration } from "astro";
import { assertPublicSvgsAreInert } from "./public-svg-gate";

/**
 * Integración que impide compilar un SVG ejecutable en public/. Igual que
 * noRawHtml, storyAssetFolders y brandSymbol, cuelga del hook
 * astro:config:setup para correr tanto en astro dev como en astro build.
 */
export function publicSvg(directory?: string): AstroIntegration {
  return {
    name: "mistorias-public-svg",
    hooks: {
      "astro:config:setup": async () => {
        await assertPublicSvgsAreInert(directory);
      }
    }
  };
}
