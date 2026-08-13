import { readFile } from "node:fs/promises";
import path from "node:path";

export const defaultSymbolPath = path.resolve(
  process.cwd(),
  "src/assets/marca/simbolo-mistorias.svg"
);

const VIEWBOX_PATTERN = /\bviewBox\s*=/i;
// `fill`/`stroke` seguidos de `=`, sin capturar `fill-rule` ni `stroke-width`:
// el guion que las distingue no calza con `\s*=`.
const FIXED_COLOR_PATTERN =
  /\b(?:fill|stroke)\s*=\s*["'](?!currentColor|none|inherit)[^"']*["']/i;
const SCRIPT_TAG_PATTERN = /<script\b/i;
const STYLE_TAG_PATTERN = /<style\b/i;
const EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=/i;
const FOREIGN_OBJECT_PATTERN = /<foreignObject\b/i;
const EXTERNAL_REFERENCE_PATTERN =
  /\b(?:href|xlink:href)\s*=\s*["'](?!#)[^"']*["']/i;

/**
 * Valida que un símbolo de marca pueda inyectarse en línea sin romper el
 * tema ni la CSP. El SVG entra al documento con `set:html`, así que su
 * contenido es código: nada que no sea marcado de dibujo puede colarse.
 */
export function assertBrandSymbolIsThemeReady(
  content: string,
  filePath: string
): void {
  if (!VIEWBOX_PATTERN.test(content)) {
    throw new Error(
      `${filePath} no declara viewBox. Sin viewBox recortado, el alto del símbolo deja de ser el alto visible.`
    );
  }

  if (FIXED_COLOR_PATTERN.test(content)) {
    throw new Error(
      `${filePath} usa un color fijo en vez de currentColor. Así no hereda --color-acento y el tema oscuro deja de funcionar solo.`
    );
  }

  if (STYLE_TAG_PATTERN.test(content)) {
    throw new Error(
      `${filePath} trae un <style> incrustado. Inyectado con set:html se vuelve una hoja de estilos real del documento, y un currentColor ahí adentro puede resolver contra un color que la misma hoja fija, no contra --color-acento heredado. La presentación va en atributos (fill="currentColor"), no en una hoja de estilos aparte.`
    );
  }

  if (
    SCRIPT_TAG_PATTERN.test(content) ||
    EVENT_HANDLER_PATTERN.test(content) ||
    FOREIGN_OBJECT_PATTERN.test(content) ||
    EXTERNAL_REFERENCE_PATTERN.test(content)
  ) {
    throw new Error(
      `${filePath} contiene contenido no permitido en un SVG que se inyecta en línea (script, manejador de evento, foreignObject o referencia externa).`
    );
  }
}

export async function assertBrandSymbolFileIsThemeReady(
  filePath: string = defaultSymbolPath
): Promise<void> {
  const content = await readFile(filePath, "utf8");
  assertBrandSymbolIsThemeReady(content, filePath);
}
