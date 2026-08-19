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

export type DeploymentConfig = {
  readonly site: string;
  readonly base: string;
};

/** El destino que asume quien construye sin declarar ninguno (`astro dev`). */
export const DEFAULT_TARGET = "development";

const TARGETS: Readonly<Record<string, DeploymentConfig>> = {
  development: { site: "https://mistorias.github.io", base: "/mistorias-web" },
  netlify: { site: "https://mistorias.pe", base: "/" }
};

const resolveTargetName = (target: string | undefined): string => {
  const name = target ?? DEFAULT_TARGET;

  if (!TARGETS[name]) {
    const valid = Object.keys(TARGETS).join(", ");

    throw new Error(
      `DEPLOY_TARGET desconocido: "${name}". Destinos válidos: ${valid}.`
    );
  }

  return name;
};

export const resolveDeploymentConfig = (
  target: string | undefined
): DeploymentConfig => TARGETS[resolveTargetName(target)];

/**
 * `development` es el único destino que no es de cara al público: GitHub
 * Pages sirve el build de trabajo en progreso, mientras que `netlify` es
 * mistorias.pe. Se usa para decidir marcadores visuales (issue #28) que no
 * deben aparecer nunca en producción.
 */
export const isDevelopmentTarget = (target: string | undefined): boolean =>
  resolveTargetName(target) === "development";
