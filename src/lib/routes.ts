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
const THEMES_SECTION = "temas";
const ABOUT_SECTION = "acerca";
const EDITORIAL_CONTENT_SECTION = "contenido";
const SITE_CODE_SECTION = "codigo";
const BRAND_SECTION = "marca";
const REPORT_SECTION = "reportar";

const splitIntoSegments = (value: string): readonly string[] =>
  value.split("/").filter((segment) => segment.length > 0);

const joinSegments = (values: readonly string[]): readonly string[] =>
  values.flatMap(splitIntoSegments);

export const buildRoute = (
  base: string,
  ...segments: readonly string[]
): string => {
  const parts = joinSegments([base, ...segments]);

  return parts.length === 0 ? "/" : `/${parts.join("/")}/`;
};

/**
 * Ruta de un archivo que se sirve tal cual desde `public/`: iconos, manifiesto,
 * `robots.txt`.
 *
 * Lleva la base del despliegue como cualquier enlace, pero termina en el nombre
 * del archivo: `favicon.ico/` no existe. Pasa por acá y no por interpolación de
 * cadenas porque `BASE_URL` puede llegar sin barra final, y `${base}favicon.ico`
 * daría `/mistorias-webfavicon.ico` —un 404 que el build no reporta.
 */
export const assetRoute = (
  base: string,
  ...segments: readonly string[]
): string => `/${joinSegments([base, ...segments]).join("/")}`;

export const homeRoute = (base: string): string => buildRoute(base);

export const storyRoute = (base: string, id: string): string =>
  buildRoute(base, STORIES_SECTION, id);

export const themesRoute = (base: string): string =>
  buildRoute(base, THEMES_SECTION);

export const themeRoute = (base: string, theme: string): string =>
  buildRoute(base, THEMES_SECTION, theme);

export const aboutRoute = (base: string): string =>
  buildRoute(base, ABOUT_SECTION);

export const editorialContentRoute = (base: string): string =>
  buildRoute(base, EDITORIAL_CONTENT_SECTION);

export const siteCodeRoute = (base: string): string =>
  buildRoute(base, SITE_CODE_SECTION);

export const brandRoute = (base: string): string =>
  buildRoute(base, BRAND_SECTION);

export const reportRoute = (base: string): string =>
  buildRoute(base, REPORT_SECTION);
