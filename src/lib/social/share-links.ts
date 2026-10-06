/**
 * Enlaces para compartir una historia en redes sociales (issue #151).
 *
 * Son URLs comunes y corrientes que cada red publica para compartir: abrirlas
 * es solo navegar, así que funcionan con la CSP del sitio (`script-src
 * 'none'`) y sin cargar nada de terceros en la página. Instagram no está
 * porque no tiene una URL así: solo se comparte desde su app o con la Web
 * Share API, que exige JavaScript.
 *
 * Facebook y LinkedIn no aceptan texto en la URL: arman la vista previa
 * leyendo `og:title`, `og:description` y `og:image`, que `BaseLayout` ya emite.
 * X y Pinterest sí lo aceptan, y ahí viajan el título y el resumen.
 */

export type ShareNetwork = "x" | "facebook" | "pinterest" | "linkedin";

export type ShareLink = {
  readonly network: ShareNetwork;
  readonly label: string;
  readonly href: string;
};

export type SharedStory = {
  readonly url: URL | string;
  readonly title: string;
  readonly summary: string;
  /** URL absoluta de la og:image: Pinterest no crea un pin sin imagen. */
  readonly imageUrl: string;
};

/**
 * X cuenta cualquier enlace como 23 caracteres y lo separa del texto con un
 * espacio: lo que queda de los 280 es para el título y el resumen.
 */
const X_POST_LIMIT = 280;
const X_LINK_WEIGHT = 23;
export const X_TEXT_LIMIT = X_POST_LIMIT - X_LINK_WEIGHT - 1;

const ELLIPSIS = "…";

function withUtmSource(url: URL | string, network: ShareNetwork): string {
  const tagged = new URL(url);
  tagged.searchParams.set("utm_source", network);
  return tagged.toString();
}

function shareText(story: SharedStory): string {
  return `${story.title}\n\n${story.summary}`;
}

/**
 * Corta en el último espacio que entra, para no dejar una palabra a medias.
 * Cuenta puntos de código y no unidades UTF-16, que es más cerca de cómo
 * cuenta X.
 */
function fitToLimit(text: string, limit: number): string {
  const characters = [...text];
  if (characters.length <= limit) return text;

  const room = characters.slice(0, limit - ELLIPSIS.length).join("");
  const lastSpace = room.lastIndexOf(" ");
  const cut = lastSpace > 0 ? room.slice(0, lastSpace) : room;
  return `${cut.trimEnd()}${ELLIPSIS}`;
}

function shareUrl(endpoint: string, params: Record<string, string>): string {
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function buildShareLinks(story: SharedStory): readonly ShareLink[] {
  const text = shareText(story);

  return [
    {
      network: "x",
      label: "X",
      href: shareUrl("https://x.com/intent/post", {
        text: fitToLimit(text, X_TEXT_LIMIT),
        url: withUtmSource(story.url, "x"),
      }),
    },
    {
      network: "facebook",
      label: "Facebook",
      href: shareUrl("https://www.facebook.com/sharer/sharer.php", {
        u: withUtmSource(story.url, "facebook"),
      }),
    },
    {
      network: "pinterest",
      label: "Pinterest",
      href: shareUrl("https://www.pinterest.com/pin/create/button/", {
        url: withUtmSource(story.url, "pinterest"),
        media: story.imageUrl,
        description: text,
      }),
    },
    {
      network: "linkedin",
      label: "LinkedIn",
      href: shareUrl("https://www.linkedin.com/sharing/share-offsite/", {
        url: withUtmSource(story.url, "linkedin"),
      }),
    },
  ];
}
