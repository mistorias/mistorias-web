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
  /**
   * La imagen optimizada: su ruta, con la base del despliegue, y su texto
   * alternativo. Van juntos porque el alt sin imagen no describe nada.
   */
  readonly image?: { readonly src: string; readonly alt: string };
  /** Ver `findLeadNewsTitle` (src/lib/content/lead-news.ts). */
  readonly leadNewsTitle?: string;
};

/**
 * Extensión propia del feed (issue #264). JSON Feed admite claves con prefijo
 * `_` para datos que el estándar no trae: mistorias-redes-sociales arma
 * «Noticia de la semana: …» con `primeraNoticia`, y Buffer exige un texto
 * alternativo por imagen. Los nombres los fija el issue #264 como contrato con
 * ese repositorio: cambiarlos lo rompe.
 */
export type MistoriasExtension = {
  readonly primeraNoticia?: string;
  readonly imageAlt?: string;
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
  readonly _mistorias?: MistoriasExtension;
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

// Sin datos no va la extensión: un objeto vacío no le dice nada a nadie.
const extensionOf = (
  story: FeedStory
): { readonly _mistorias?: MistoriasExtension } => {
  const extension: MistoriasExtension = {
    ...(story.leadNewsTitle && { primeraNoticia: story.leadNewsTitle }),
    ...(story.image && { imageAlt: story.image.alt })
  };

  return Object.keys(extension).length > 0 ? { _mistorias: extension } : {};
};

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
  ...(story.image && { image: absoluteUrl(story.image.src, site) }),
  date_published: story.date.toISOString(),
  authors: [
    {
      name: story.author.name,
      url: absoluteUrl(authorRoute(base, story.author.slug), site)
    }
  ],
  tags: story.themes,
  ...extensionOf(story)
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
