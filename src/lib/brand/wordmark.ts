/**
 * La palabra del logotipo en el build de desarrollo (issue #28): quien lo vea
 * no debe poder confundirlo con el sitio real, así que se reemplaza por una
 * palabra generada con un CSPRNG (no deducible) del mismo largo que
 * "Mistorias" y con la primera letra en mayúscula.
 *
 * Se calcula una sola vez, al cargar el módulo, no en cada llamada: un build
 * es un único proceso, así que todas las páginas terminan mostrando la misma
 * palabra; un build distinto (otro proceso) genera una palabra distinta.
 */

import { randomInt } from "node:crypto";
import { isDevelopmentTarget } from "../deployment";

const REAL_WORDMARK = "Mistorias";

const randomLowercaseLetter = (): string =>
  String.fromCharCode(97 + randomInt(26));

const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);

const DEVELOPMENT_WORDMARK = capitalize(
  Array.from({ length: REAL_WORDMARK.length }, randomLowercaseLetter).join("")
);

export const resolveWordmark = (target: string | undefined): string =>
  isDevelopmentTarget(target) ? DEVELOPMENT_WORDMARK : REAL_WORDMARK;
