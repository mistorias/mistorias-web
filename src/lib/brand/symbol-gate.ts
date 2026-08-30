import { readFile } from "node:fs/promises";
import path from "node:path";
import { assertInlineSvgIsThemeReady } from "../assets/inline-svg-gate";

export const defaultSymbolPath = path.resolve(
  process.cwd(),
  "src/assets/brand/symbol-mistorias.svg"
);

/**
 * Valida que el símbolo de marca pueda inyectarse en línea sin romper el
 * tema ni la CSP. El contrato es el mismo que el de cualquier SVG que entre
 * al documento con `set:html`, así que vive en `assets/inline-svg-gate.ts` y
 * lo comparte con la ilustración de portada.
 */
export function assertBrandSymbolIsThemeReady(
  content: string,
  filePath: string
): void {
  assertInlineSvgIsThemeReady(content, filePath);
}

export async function assertBrandSymbolFileIsThemeReady(
  filePath: string = defaultSymbolPath
): Promise<void> {
  const content = await readFile(filePath, "utf8");
  assertBrandSymbolIsThemeReady(content, filePath);
}
