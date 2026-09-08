/**
 * Resolución de la versión visible del sitio.
 *
 * El issue #106 pide mostrar la versión en "Acerca de". Hay dos números que
 * podrían responder esa pregunta y no siempre coinciden: el tag de git con el
 * que se corta un release y el campo `version` de `package.json`.
 *
 * Manda el tag, porque es lo que identifica exactamente qué se publicó: el
 * workflow de Netlify se dispara con un tag y le pasa ese tag al build en
 * `SITE_VERSION`. Cuando no hay tag —`astro dev`, un build local, GitHub
 * Pages— no se inventa uno: se cae al `version` de `package.json`, que es el
 * dato más cercano y honesto disponible.
 *
 * Que ambos no se separen no se resuelve acá sino en CI:
 * `scripts/check_release_version.sh` detiene el despliegue si el tag empujado
 * no es `v` + la versión de `package.json`. Ver ADR 0017.
 */

import packageJson from "../../package.json" with { type: "json" };

/** La versión que se muestra cuando el build no viene de un tag. */
export const FALLBACK_VERSION = `v${packageJson.version}`;

/**
 * Devuelve el tag recibido si trae algo, y si no el respaldo de
 * `package.json`. Recibe la variable de entorno como argumento —como
 * `resolveDeploymentConfig` y `resolveWordmark`— para que se pueda probar sin
 * tocar el entorno del proceso.
 */
export const resolveSiteVersion = (tag: string | undefined): string => {
  const tagged = tag?.trim();

  return tagged ? tagged : FALLBACK_VERSION;
};
