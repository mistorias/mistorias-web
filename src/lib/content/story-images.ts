import type { ImageMetadata } from "astro";

// El glob es el único punto de entrada de imágenes al bundle: un archivo que
// no calza este patrón literal no existe para el sitio (ADR 0005, decisión
// 2). La clave del mapa es el slug, tomado de la carpeta que lo contiene.
const storyImageModules = import.meta.glob<{ default: ImageMetadata }>(
  "/content/mistorias-contenido/stories/*/principal.jpg",
  { eager: true }
);

const storyImagesBySlug = new Map<string, ImageMetadata>(
  Object.entries(storyImageModules).map(([modulePath, module]) => {
    // El slug siempre está ahí: lo garantiza el patrón literal del glob
    // (.../stories/<slug>/principal.jpg), no input externo que validar.
    const slug = modulePath.split("/").at(-2)!;
    return [slug, module.default];
  })
);

export function getStoryImage(storyId: string): ImageMetadata | undefined {
  return storyImagesBySlug.get(storyId);
}
