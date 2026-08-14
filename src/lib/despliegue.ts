/**
 * Resolución del destino de despliegue.
 *
 * `DEPLOY_TARGET` decide con qué origen y con qué base se construye el sitio:
 * GitHub Pages sirve bajo `/mistorias-web` y Netlify bajo la raíz. Antes, todo
 * valor que no fuera `netlify` caía en el destino de GitHub Pages sin avisar,
 * así que un build de producción al que la variable no llegaba publicaba
 * mistorias.pe con la base equivocada —sin estilos y con cada enlace roto—
 * mientras el build reportaba éxito (issue #29).
 *
 * Acá los destinos son explícitos y lo desconocido detiene el build: es
 * preferible un despliegue que falla a uno que se publica mal.
 */

export type ConfiguracionDeDespliegue = {
  readonly site: string;
  readonly base: string;
};

/** El destino que asume quien construye sin declarar ninguno (`astro dev`). */
export const DESTINO_POR_DEFECTO = "development";

const DESTINOS: Readonly<Record<string, ConfiguracionDeDespliegue>> = {
  development: { site: "https://mistorias.github.io", base: "/mistorias-web" },
  netlify: { site: "https://mistorias.pe", base: "/" }
};

export const configuracionDeDespliegue = (
  destino: string | undefined
): ConfiguracionDeDespliegue => {
  const nombre = destino ?? DESTINO_POR_DEFECTO;
  const configuracion = DESTINOS[nombre];

  if (!configuracion) {
    const validos = Object.keys(DESTINOS).join(", ");

    throw new Error(
      `DEPLOY_TARGET desconocido: "${nombre}". Destinos válidos: ${validos}.`
    );
  }

  return configuracion;
};
