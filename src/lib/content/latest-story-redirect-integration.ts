import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { appendLatestStoryRedirect, resolveLatestStory } from "./latest-story";
import { orderStoriesByDate } from "./story-order";
import { defaultStoryOrderCachePath, readCache } from "./story-order-cache";
import { readStoryDates } from "./story-order-source";

/**
 * Integración que publica `/ultima` (issue #170, ver ADR 0025). En
 * `astro:config:setup` —que corre en `astro dev` y en `astro build`— compara
 * la última historia que declara `data/story-order.json` con la que dicen las
 * fechas, y detiene el proceso si no coinciden. En `astro:build:done` agrega
 * la redirección al `_redirects` del artefacto.
 */
export function latestStoryRedirect(
  storiesDirectory?: string,
  cachePath: string = defaultStoryOrderCachePath
): AstroIntegration {
  let latestStory: string | null = null;

  return {
    name: "mistorias-latest-story-redirect",
    hooks: {
      "astro:config:setup": async () => {
        const stories = await readStoryDates(storiesDirectory);
        const orderedIds = orderStoriesByDate(
          stories,
          (story) => story.id,
          (story) => story.date
        );
        latestStory = resolveLatestStory(readCache(cachePath), orderedIds);
      },
      "astro:build:done": async ({ dir }) => {
        if (latestStory !== null) {
          await appendLatestStoryRedirect(fileURLToPath(dir), latestStory);
        }
      }
    }
  };
}
