// Extensión `.ts` explícita: este script corre con `node` directo (Node 24
// lo ejecuta nativo), igual que scripts/generate-story-order-cache.ts — ver
// la nota en ese archivo para el porqué.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ILLUSTRATION_PATH = path.resolve(
    process.cwd(),
    "src/assets/ilustraciones/planta-de-libros.svg"
);
const OUTPUT_PATH = path.resolve(
    process.cwd(),
    "public/imagenes/og-default.jpg"
);

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const ILLUSTRATION_HEIGHT = 560;

// Mismos hexadecimales que tokens.css en modo claro (--color-fondo,
// --color-texto, --color-analitico). La tarjeta social no tiene un <html>
// que active el modo oscuro, así que usa siempre la variante clara.
const COLOR_FONDO = "#f7f4ef";
const COLOR_INK_BASE = "#1e2328";
const COLOR_INK_ACENTO = "#5e2c3e";

/**
 * Genera `public/imagenes/og-default.jpg`, el `og:image` de respaldo para
 * páginas sin cabecera propia (issue #39): la ilustración risograph de
 * portada, que hasta ahora ninguna vista previa de enlace aprovechaba.
 *
 * `planta-de-libros.svg` trae sus dos tintas como `class="ink-base"` /
 * `class="ink-acento"` y depende del `<style>` de PlantaDeLibros.astro
 * (`currentColor` + `var(--color-analitico)`) para pintarse — funciona ahí
 * porque el navegador resuelve esa cascada CSS. Rasterizado aparte con Sharp
 * no hay cascada que resolver, así que este script sustituye ambas clases
 * por hexadecimales fijos antes de convertir el SVG a PNG.
 *
 * Se corre a mano (`pnpm og-default-image`) y el resultado se versiona en
 * git: a diferencia del `og:image` por historia (generado en cada build a
 * partir de `principal.jpg`, ver `src/lib/social/og-image.ts`), esta imagen
 * no depende de contenido editorial y solo cambia si cambia la ilustración
 * de marca.
 */
async function main(): Promise<void> {
    const svgOriginal = await readFile(ILLUSTRATION_PATH, "utf8");
    const svgConTintasFijas = svgOriginal
        .replace(/class="ink-base"/g, `fill="${COLOR_INK_BASE}"`)
        .replace(/class="ink-acento"/g, `fill="${COLOR_INK_ACENTO}"`);

    const ilustracion = await sharp(Buffer.from(svgConTintasFijas))
        .resize({ height: ILLUSTRATION_HEIGHT, fit: "inside" })
        .png()
        .toBuffer();

    const tarjeta = await sharp({
        create: {
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            channels: 3,
            background: COLOR_FONDO
        }
    })
        .composite([{ input: ilustracion, gravity: "center" }])
        .jpeg({ quality: 88 })
        .toBuffer();

    await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, tarjeta);

    console.log(`Generado ${OUTPUT_PATH} (${CARD_WIDTH}x${CARD_HEIGHT}px).`);
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
