/**
 * Construcción de rutas internas del sitio.
 *
 * `astro.config.mjs` cambia `base` según `DEPLOY_TARGET`: GitHub Pages sirve
 * bajo `/mistorias-web` y Netlify bajo la raíz. Un `href` escrito a mano acierta
 * en un destino y falla en el otro sin romper el build, así que todo enlace
 * interno pasa por acá y los nombres de sección viven en un solo lugar.
 *
 * Los valores de sección quedan en castellano: son las direcciones que ve quien
 * lee el sitio, parte del lenguaje ubicuo del proyecto y no del código.
 */

const STORIES_SECTION = "historias";
const TAGS_SECTION = "etiquetas";
const ABOUT_SECTION = "acerca";

const splitIntoSegments = (value: string): readonly string[] =>
  value.split("/").filter((segment) => segment.length > 0);

export const buildRoute = (
  base: string,
  ...segments: readonly string[]
): string => {
  const parts = [base, ...segments].flatMap(splitIntoSegments);

  return parts.length === 0 ? "/" : `/${parts.join("/")}/`;
};

export const homeRoute = (base: string): string => buildRoute(base);

export const storyRoute = (base: string, id: string): string =>
  buildRoute(base, STORIES_SECTION, id);

export const tagsRoute = (base: string): string =>
  buildRoute(base, TAGS_SECTION);

export const tagRoute = (base: string, tag: string): string =>
  buildRoute(base, TAGS_SECTION, tag);

export const aboutRoute = (base: string): string =>
  buildRoute(base, ABOUT_SECTION);
