import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
// Extensión `.ts` explícita (a diferencia del resto de src/lib): este módulo
// también lo ejecuta Node directamente sin bundler, vía
// scripts/generate-story-order-cache.ts — ver la nota en ese archivo.
import { hashOrderedIds, neighborsFor, type StoryNeighbors } from "./story-order.ts";

/**
 * Cache versionado del orden cronológico de las historias (issue #34, ver
 * ADR 0012). Se guarda como JSON legible en `data/story-order.json`,
 * trackeado en git —no en `.gitignore`— para que sea reusable entre
 * máquinas y CI sin regenerarse en cada checkout.
 */
export type StoryOrderCache = {
  readonly generatedAt: string;
  readonly hash: string;
  readonly order: readonly string[];
  readonly stories: Readonly<Record<string, StoryNeighbors>>;
};

export const defaultStoryOrderCachePath = path.resolve(
  process.cwd(),
  "data/story-order.json"
);

const buildNeighborsMap = (
  orderedIds: readonly string[]
): Record<string, StoryNeighbors> =>
  Object.fromEntries(
    orderedIds.map((id) => [id, neighborsFor(orderedIds, id)])
  );

/**
 * Lee el cache del disco. `null` si el archivo no existe o no es JSON
 * válido —nunca lanza—, para que quien lo consuma en build siempre tenga un
 * camino de reserva (ver `resolveNeighbors`).
 */
export function readCache(
  cachePath: string = defaultStoryOrderCachePath
): StoryOrderCache | null {
  try {
    const raw = readFileSync(cachePath, "utf8");
    return JSON.parse(raw) as StoryOrderCache;
  } catch {
    return null;
  }
}

/**
 * El cache es válido si su hash coincide con el de la secuencia actual de
 * ids: el hash depende solo del orden (ver `hashOrderedIds` en
 * `story-order.ts`), así que esta comparación es la única señal que hace
 * falta para saber si `cache.stories` sigue describiendo el vecindario real.
 */
export function isCacheValid(
  cache: StoryOrderCache | null,
  currentOrderedIds: readonly string[]
): cache is StoryOrderCache {
  return cache !== null && cache.hash === hashOrderedIds(currentOrderedIds);
}

/**
 * Calcula y escribe el cache para `orderedIds`. Legible por humanos:
 * indentado, con `generatedAt` (marca de tiempo de esta escritura) y `order`
 * explícito además del mapa `stories` que consume el build. Usado solo por
 * el script standalone (`scripts/generate-story-order-cache.ts`) — el build
 * del sitio nunca escribe acá, ver `resolveNeighbors`.
 */
export function writeCache(
  orderedIds: readonly string[],
  cachePath: string = defaultStoryOrderCachePath
): StoryOrderCache {
  const cache: StoryOrderCache = {
    generatedAt: new Date().toISOString(),
    hash: hashOrderedIds(orderedIds),
    order: orderedIds,
    stories: buildNeighborsMap(orderedIds)
  };

  mkdirSync(path.dirname(cachePath), { recursive: true });
  writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");

  return cache;
}

/**
 * Vecinos de cada historia, para consumo en build. Usa el cache si existe y
 * sigue vigente; si no —falta el archivo, o alguien agregó, quitó o
 * renombró una historia sin regenerarlo—, los calcula en memoria a partir de
 * `currentOrderedIds`. Nunca escribe: el build no debe mutar un archivo
 * versionado en git como efecto secundario de renderizar páginas.
 */
export function resolveNeighbors(
  currentOrderedIds: readonly string[],
  cachePath: string = defaultStoryOrderCachePath
): Readonly<Record<string, StoryNeighbors>> {
  const cache = readCache(cachePath);
  if (isCacheValid(cache, currentOrderedIds)) {
    return cache.stories;
  }

  return buildNeighborsMap(currentOrderedIds);
}
