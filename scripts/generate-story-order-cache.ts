// Extensiones `.ts` explícitas: este script corre con `node` directo (Node
// 24 lo ejecuta nativo, sin bundler ni tsx/ts-node), y la resolución de
// módulos ESM de Node exige la extensión real del archivo en cada import
// relativo — a diferencia del resto del código, que solo lo consume Vite/Astro.
import {
  hashOrderedIds,
  orderStoriesByDate
} from "../src/lib/content/story-order.ts";
import {
  defaultStoryOrderCachePath,
  isCacheValid,
  readCache,
  writeCache
} from "../src/lib/content/story-order-cache.ts";
import { readStoryDates } from "../src/lib/content/story-order-source.ts";

/**
 * Genera o actualiza `data/story-order.json`: el cache versionado del orden
 * cronológico de las historias que consume
 * `src/pages/historias/[...id].astro` para la navegación anterior/siguiente
 * (issue #34, ver docs/adr/0012-cache-versionado-orden-cronologico-historias.md).
 *
 * Uso:
 *   pnpm story-order                 # regenera solo si el orden cambió
 *   pnpm story-order -- --rebuild    # regenera siempre, sin importar el hash
 */
async function main(): Promise<void> {
  const rebuild = process.argv.includes("--rebuild");

  const stories = await readStoryDates();
  const orderedIds = orderStoriesByDate(
    stories,
    (story) => story.id,
    (story) => story.date
  );

  if (!rebuild && isCacheValid(readCache(), orderedIds)) {
    console.log(
      `${defaultStoryOrderCachePath} ya está al día (${orderedIds.length} historias, hash ${hashOrderedIds(orderedIds)}). Nada que hacer.`
    );
    return;
  }

  const cache = writeCache(orderedIds);
  console.log(
    `${defaultStoryOrderCachePath} generado con ${cache.order.length} historias (generatedAt ${cache.generatedAt}).`
  );
  console.log(cache.order.join(" -> "));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
