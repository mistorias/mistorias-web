import type { AstroIntegration } from "astro";
import { assertAuthorsHaveNoRawHtml } from "./raw-html-gate";

/**
 * Integración que impide compilar fichas de autoría con HTML crudo.
 *
 * Va aparte de `noRawHtml()` en vez de sumarle una segunda carpeta porque cada
 * gate recibe su propio directorio inyectable y mezclarlos dejaría a las
 * pruebas de historias dependiendo de que exista `authors/`.
 */
export function authorsNoRawHtml(directory?: string): AstroIntegration {
  return {
    name: "mistorias-authors-no-raw-html",
    hooks: {
      "astro:config:setup": async () => {
        await assertAuthorsHaveNoRawHtml(directory);
      }
    }
  };
}
