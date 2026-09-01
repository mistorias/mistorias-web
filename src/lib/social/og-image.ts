import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import { assetRoute } from "../routes";

/**
 * `og:image` pide 1200×630 (issue #39): suficientemente grande para que
 * Facebook y X no la reescalen, y en la proporción 1.91:1 que ambos
 * recomiendan para que no aparezca recortada en el feed.
 */
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

const DEFAULT_OG_IMAGE_PATH = "imagenes/og-default.jpg";
const DEFAULT_OG_IMAGE_ALT =
    "Ilustración con risografía de Mistorias: metáfora de una planta con libros que florecen.";

export type OgImage = {
    readonly src: string;
    readonly alt: string;
    readonly width: number;
    readonly height: number;
};

/**
 * Recorta `principal.jpg` a 1200×630 vía `astro:assets` (mismo servicio de
 * Sharp que ya usan `<Picture>` en `TarjetaHistoria.astro` y la página de
 * historia): funciona igual en los dos destinos de despliegue porque corre
 * en el build, no depende de un servicio externo como el Image CDN de
 * Netlify que solo existe ahí y dejaría GitHub Pages sin og:image.
 */
export async function ogImageFromStoryImage(
    image: ImageMetadata,
    alt: string
): Promise<OgImage> {
    const recorte = await getImage({
        src: image,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        format: "jpg"
    });

    return {
        src: recorte.src,
        alt,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT
    };
}

/**
 * Imagen de respaldo para páginas sin cabecera propia (portada, temas,
 * acerca, historias sin `principal.jpg`). Vive pre-generada en `public/`
 * —`scripts/generate-default-og-image.ts` la produce— en vez de pasar por
 * `astro:assets`, porque no depende de contenido editorial y no hace falta
 * recalcularla en cada build.
 */
export function defaultOgImage(base: string): OgImage {
    return {
        src: assetRoute(base, DEFAULT_OG_IMAGE_PATH),
        alt: DEFAULT_OG_IMAGE_ALT,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT
    };
}
