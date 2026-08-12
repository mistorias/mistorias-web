import type { AstroIntegration } from "astro";
import { assertStoriesHaveNoRawHtml } from "./raw-html-gate";

/**
 * Integración que impide compilar historias con HTML crudo.
 *
 * El hook `astro:config:setup` corre tanto en `astro dev` como en
 * `astro build`, así que quien edita el contenido ve el error de inmediato y
 * ningún despliegue puede publicar HTML ejecutable.
 */
export function noRawHtml(directory?: string): AstroIntegration {
  return {
    name: "mistorias-no-raw-html",
    hooks: {
      "astro:config:setup": async () => {
        await assertStoriesHaveNoRawHtml(directory);
      }
    }
  };
}
