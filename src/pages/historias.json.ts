import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { authorNameFor, buildAuthorNameMap } from "../lib/content/authors";
import { getStoryImage } from "../lib/content/story-images";
import { buildStoryFeed, type FeedStory } from "../lib/feed/story-feed";
import { ogImageFromStoryImage } from "../lib/social/og-image";

/**
 * `/historias.json`: el feed de historias publicadas (ADR 0033).
 *
 * Solo resuelve lo que necesita Astro —colecciones, nombre de quien firma,
 * recorte de la imagen— y delega la forma del feed en `buildStoryFeed`.
 */

// La imagen es el mismo recorte 1200×630 en JPEG que ya va en og:image: es lo
// que se comparte en redes, y JPEG es lo que todas aceptan.
const optimizedImageSrc = async (
  story: CollectionEntry<"stories">
): Promise<string | undefined> => {
  const image = getStoryImage(story.id);

  // El gate de imágenes (story-image-requirements.ts) exige `imageAlt` siempre
  // que exista principal.jpg.
  return image
    ? (await ogImageFromStoryImage(image, story.data.imageAlt!)).src
    : undefined;
};

export const GET: APIRoute = async ({ site }) => {
  const base = import.meta.env.BASE_URL;
  const [stories, authors] = await Promise.all([
    getCollection("stories"),
    getCollection("authors")
  ]);
  const authorNames = buildAuthorNameMap(
    authors,
    (author) => author.id,
    (author) => author.data.name
  );

  const feedStories: FeedStory[] = await Promise.all(
    stories.map(async (story) => ({
      id: story.id,
      title: story.data.title,
      summary: story.data.summary,
      date: story.data.date,
      themes: story.data.themes,
      author: {
        slug: story.data.author.id,
        name: authorNameFor(authorNames, story.data.author.id)
      },
      imageSrc: await optimizedImageSrc(story)
    }))
  );

  // `site` siempre existe en un build: `astro.config.mjs` lo fija por destino.
  return new Response(JSON.stringify(buildStoryFeed(site!, base, feedStories)), {
    headers: { "Content-Type": "application/feed+json; charset=utf-8" }
  });
};
