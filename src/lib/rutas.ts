/**
 * Construcción de rutas internas del sitio.
 *
 * `astro.config.mjs` cambia `base` según `DEPLOY_TARGET`: GitHub Pages sirve
 * bajo `/mistorias-web` y Netlify bajo la raíz. Un `href` escrito a mano acierta
 * en un destino y falla en el otro sin romper el build, así que todo enlace
 * interno pasa por acá y los nombres de sección viven en un solo lugar.
 */

const SECCION_HISTORIAS = "historias";
const SECCION_ETIQUETAS = "etiquetas";
const SECCION_ACERCA = "acerca";

const partirEnSegmentos = (valor: string): readonly string[] =>
  valor.split("/").filter((segmento) => segmento.length > 0);

export const construirRuta = (
  base: string,
  ...segmentos: readonly string[]
): string => {
  const partes = [base, ...segmentos].flatMap(partirEnSegmentos);

  return partes.length === 0 ? "/" : `/${partes.join("/")}/`;
};

export const rutaInicio = (base: string): string => construirRuta(base);

export const rutaHistoria = (base: string, id: string): string =>
  construirRuta(base, SECCION_HISTORIAS, id);

export const rutaEtiquetas = (base: string): string =>
  construirRuta(base, SECCION_ETIQUETAS);

export const rutaEtiqueta = (base: string, etiqueta: string): string =>
  construirRuta(base, SECCION_ETIQUETAS, etiqueta);

export const rutaAcerca = (base: string): string =>
  construirRuta(base, SECCION_ACERCA);
