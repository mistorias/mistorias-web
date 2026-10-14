import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveDeploymentConfig } from "../deployment";
import { latestStoryRoute, storyRoute } from "../routes";
import type { StoryOrderCache } from "./story-order-cache";

/**
 * Redirección de `/ultima` a la historia más reciente (issue #170, ver
 * ADR 0025).
 *
 * La historia más reciente se lee de `data/story-order.json` —el archivo que
 * escribe `pnpm story-order`— y no se recalcula acá: así se sabe cuál es sin
 * correr el build. A diferencia de `resolveNeighbors`, que ante un cache
 * desfasado calcula en memoria, acá un desfase detiene el build: una
 * redirección que apunta a la historia anterior no rompe nada visible y nadie
 * lo notaría (la misma lección del issue #29).
 */

// Netlify es el único destino que interpreta `_redirects`; en GitHub Pages el
// archivo viaja inerte (ADR 0018).
const NETLIFY_BASE = resolveDeploymentConfig("netlify").base;

// Es temporal porque el destino cambia con cada historia nueva: un 301 lo
// guardarían en caché navegadores y buscadores.
const TEMPORARY_REDIRECT = "302";

const REDIRECTS_FILENAME = "_redirects";

/**
 * Id de la historia a la que debe llevar `/ultima`, o `null` si todavía no
 * hay historias. Lanza si `data/story-order.json` falta, no declara `latest`
 * o no coincide con la historia más reciente según las fechas actuales.
 */
export function resolveLatestStory(
  cache: StoryOrderCache | null,
  currentOrderedIds: readonly string[]
): string | null {
  const expected = currentOrderedIds.at(-1) ?? null;
  if (expected === null) {
    return null;
  }

  if (cache?.latest !== expected) {
    throw new Error(
      `data/story-order.json says the latest story is "${cache?.latest ?? "(none)"}", ` +
        `but by date it is "${expected}". Run \`pnpm story-order\` and commit the result.`
    );
  }

  return expected;
}

/**
 * Línea de `_redirects` que lleva `/ultima` a `storyId`. El origen va sin
 * barra final, como las reglas de `/etiquetas`: Netlify la aplica con y sin
 * ella.
 */
export const buildLatestStoryRedirectRule = (storyId: string): string => {
  const source = latestStoryRoute(NETLIFY_BASE).replace(/\/$/, "");

  return `${source}  ${storyRoute(NETLIFY_BASE, storyId)}  ${TEMPORARY_REDIRECT}`;
};

/**
 * Agrega la regla al `_redirects` del artefacto (`dist/`), después de las que
 * Astro copió desde `public/`. Escribe en el artefacto y no en `public/`: el
 * destino cambia cada semana y no debe exigir editar a mano un archivo
 * versionado.
 */
export async function appendLatestStoryRedirect(
  outputDirectory: string,
  storyId: string
): Promise<void> {
  const redirectsPath = path.join(outputDirectory, REDIRECTS_FILENAME);
  const existing = await readFile(redirectsPath, "utf8").catch(() => "");
  const separator = existing === "" || existing.endsWith("\n") ? "" : "\n";

  await writeFile(
    redirectsPath,
    `${existing}${separator}${buildLatestStoryRedirectRule(storyId)}\n`,
    "utf8"
  );
}
