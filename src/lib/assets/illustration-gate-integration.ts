import type { AstroIntegration } from "astro";
import { assertIllustrationFileIsThemeReady } from "./illustration-gate";

/**
 * Integración que impide compilar una ilustración que no se adapte al tema.
 * Igual que `brandSymbol` y los gates de contenido, cuelga del hook
 * `astro:config:setup` para correr tanto en `astro dev` como en `astro build`.
 */
export function coverIllustration(filePath?: string): AstroIntegration {
  return {
    name: "mistorias-cover-illustration",
    hooks: {
      "astro:config:setup": async () => {
        await assertIllustrationFileIsThemeReady(filePath);
      }
    }
  };
}
