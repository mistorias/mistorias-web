import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const IMG_SRC_PATTERN = /<img\b[^>]*\bsrc="([^"]+)"/gi;

async function htmlFilesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry): Promise<string[]> => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return htmlFilesIn(entryPath);
      }
      return entry.name.endsWith(".html") ? [entryPath] : [];
    })
  );
  return nested.flat();
}

/**
 * Aserción post-build de la decisión 5 del ADR 0005: la CSP no debe ser lo
 * único que impida servir una imagen que se coló sin pasar por
 * `astro:assets` — si algún `<img src>` no viene de esa optimización, el
 * build falla en vez de descubrirse recién en el navegador.
 */
export async function assertBuiltImagesAreOptimized(
  distDirectory: string
): Promise<void> {
  const htmlFiles = await htmlFilesIn(distDirectory);

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, "utf8");
    for (const match of html.matchAll(IMG_SRC_PATTERN)) {
      const src = match[1];
      if (!src.includes("/_astro/")) {
        throw new Error(
          `${htmlFile} tiene <img src="${src}"> fuera de "/_astro/": no pasó por la optimización de astro:assets.`
        );
      }
    }
  }
}
