import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const defaultPublicDirectory = path.resolve(process.cwd(), "public");

// Mismos patrones que src/lib/brand/symbol-gate.ts para script, manejadores
// de evento, foreignObject y referencias externas. Este gate no reusa los
// patrones de color fijo ni la prohibición de <style> de ese archivo: acá el
// color es irrelevante (el SVG se consume como máscara CSS, no se inyecta en
// línea) y una hoja de estilos interna no se escapa del documento SVG cuando
// se sirve como archivo aparte.
const SCRIPT_TAG_PATTERN = /<script\b/i;
const EVENT_HANDLER_PATTERN = /\son[a-z]+\s*=/i;
const FOREIGN_OBJECT_PATTERN = /<foreignObject\b/i;
const EXTERNAL_REFERENCE_PATTERN =
  /\b(?:href|xlink:href)\s*=\s*["'](?!#)[^"']*["']/i;

/**
 * Valida que un SVG servido tal cual desde `public/` sea inerte si el
 * navegador lo abre directo como documento (no como máscara CSS ni <img>).
 * En GitHub Pages `public/_headers` no se aplica, así que un <script> en un
 * SVG navegado directamente correría en el origen del sitio; en Netlify lo
 * frena `script-src 'none'`, pero este gate no depende del destino de
 * despliegue.
 */
export function assertPublicSvgIsInert(content: string, filePath: string): void {
  if (
    SCRIPT_TAG_PATTERN.test(content) ||
    EVENT_HANDLER_PATTERN.test(content) ||
    FOREIGN_OBJECT_PATTERN.test(content) ||
    EXTERNAL_REFERENCE_PATTERN.test(content)
  ) {
    throw new Error(
      `${filePath} contiene contenido no permitido en un SVG servido desde public/ (script, manejador de evento, foreignObject o referencia externa). Navegado directo, sin CSP de Netlify, ese SVG ejecutaría en el origen del sitio.`
    );
  }
}

export async function assertPublicSvgsAreInert(
  directory: string = defaultPublicDirectory
): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  const svgFiles = entries.filter(
    (entry) => entry.isFile() && entry.name.endsWith(".svg")
  );

  for (const entry of svgFiles) {
    const filePath = path.join(directory, entry.name);
    const content = await readFile(filePath, "utf8");
    assertPublicSvgIsInert(content, filePath);
  }
}
