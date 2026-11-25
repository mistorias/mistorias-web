import {
  authorRoute,
  homeRoute,
  storyFeedRoute,
  storyRoute
} from "../routes";
import { sortByDateDescending } from "../stories";

/**
 * Feed de historias en JSON Feed 1.1 (ADR 0033).
 *
 * mistorias-redes-sociales lo lee cada hora para saber qué historia ya está
 * publicada y empezar su difusión; cualquier lector de feeds puede suscribirse
 * también. Es un contrato público: agregar un campo no rompe a nadie, quitar
 * uno sí.
 *
 * Recibe las historias ya resueltas (nombre de quien firma, ruta de la imagen
 * optimizada) para que la forma del feed se pruebe sin levantar
 * `astro:content` ni `astro:assets`; eso lo hace `src/pages/historias.json.ts`.
 * Las claves en inglés las impone el estándar.
 */

const JSON_FEED_VERSION = "https://jsonfeed.org/version/1.1";
const FEED_TITLE = "Mistorias";
const FEED_LANGUAGE = "es-PE";

export type FeedStory = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly date: Date;
  readonly themes: readonly string[];
  readonly author: { readonly slug: string; readonly name: string };
  /** Ruta, con la base del despliegue, de la imagen optimizada. */
  readonly imageSrc?: string;
};

export type JsonFeedItem = {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly summary: string;
  readonly content_text: string;
  readonly image?: string;
  readonly date_published: string;
  readonly authors: readonly { readonly name: string; readonly url: string }[];
  readonly tags: readonly string[];
};

export type JsonFeed = {
  readonly version: string;
  readonly title: string;
  readonly home_page_url: string;
  readonly feed_url: string;
  readonly language: string;
  readonly items: readonly JsonFeedItem[];
};

const absoluteUrl = (path: string, site: string | URL): string =>
  new URL(path, site).toString();

const buildItem = (
  story: FeedStory,
  site: string | URL,
  base: string
): JsonFeedItem => ({
  id: story.id,
  url: absoluteUrl(storyRoute(base, story.id), site),
  title: story.title,
  summary: story.summary,
  // El estándar exige un contenido; el cuerpo de la historia vive en su
  // página, así que va el mismo resumen.
  content_text: story.summary,
  ...(story.imageSrc && { image: absoluteUrl(story.imageSrc, site) }),
  date_published: story.date.toISOString(),
  authors: [
    {
      name: story.author.name,
      url: absoluteUrl(authorRoute(base, story.author.slug), site)
    }
  ],
  tags: story.themes
});

export const buildStoryFeed = (
  site: string | URL,
  base: string,
  stories: readonly FeedStory[]
): JsonFeed => ({
  version: JSON_FEED_VERSION,
  title: FEED_TITLE,
  home_page_url: absoluteUrl(homeRoute(base), site),
  feed_url: absoluteUrl(storyFeedRoute(base), site),
  language: FEED_LANGUAGE,
  items: sortByDateDescending(
    stories,
    (story) => story.id,
    (story) => story.date
  ).map((story) => buildItem(story, site, base))
});
