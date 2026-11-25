import { describe, expect, it } from "vitest";
import { buildStoryFeed, type FeedStory } from "../src/lib/feed/story-feed";

// El feed es un contrato público (ADR 0033): lo lee mistorias-redes-sociales
// para empezar la difusión, y cualquier lector de feeds puede suscribirse. Las
// URLs van absolutas porque las lee otro sitio.
const SITE_NETLIFY = "https://mistorias.pe";
const SITE_PAGES = "https://mistorias.github.io";

const buildFeedStory = (overrides?: Partial<FeedStory>): FeedStory => ({
  id: "2026-11-19-la-ultima-clase",
  title: "La última clase de la semana",
  summary: "Resumen de la historia para el feed.",
  date: new Date("2026-11-19T00:00:00.000Z"),
  themes: ["educación", "piura"],
  author: { slug: "mateo-salazar", name: "Mateo Salazar" },
  ...overrides
});

describe("buildStoryFeed", () => {
  it("declara la versión, el sitio, el propio feed y el idioma", () => {
    const feed = buildStoryFeed(SITE_NETLIFY, "/", []);

    expect(feed).toEqual({
      version: "https://jsonfeed.org/version/1.1",
      title: "Mistorias",
      home_page_url: "https://mistorias.pe/",
      feed_url: "https://mistorias.pe/historias.json",
      language: "es-PE",
      items: []
    });
  });

  it("arma cada item con los datos de la historia", () => {
    const feed = buildStoryFeed(SITE_NETLIFY, "/", [buildFeedStory()]);

    expect(feed.items).toEqual([
      {
        id: "2026-11-19-la-ultima-clase",
        url: "https://mistorias.pe/historias/2026-11-19-la-ultima-clase/",
        title: "La última clase de la semana",
        summary: "Resumen de la historia para el feed.",
        content_text: "Resumen de la historia para el feed.",
        date_published: "2026-11-19T00:00:00.000Z",
        authors: [
          {
            name: "Mateo Salazar",
            url: "https://mistorias.pe/autores/mateo-salazar/"
          }
        ],
        tags: ["educación", "piura"]
      }
    ]);
  });

  it("respeta la base de GitHub Pages en cada URL", () => {
    const feed = buildStoryFeed(SITE_PAGES, "/mistorias-web/", [
      buildFeedStory({ imageSrc: "/mistorias-web/_astro/principal.abc.jpg" })
    ]);

    expect(feed.home_page_url).toBe("https://mistorias.github.io/mistorias-web/");
    expect(feed.feed_url).toBe(
      "https://mistorias.github.io/mistorias-web/historias.json"
    );
    expect(feed.items[0].url).toBe(
      "https://mistorias.github.io/mistorias-web/historias/2026-11-19-la-ultima-clase/"
    );
    expect(feed.items[0].authors[0].url).toBe(
      "https://mistorias.github.io/mistorias-web/autores/mateo-salazar/"
    );
    expect(feed.items[0].image).toBe(
      "https://mistorias.github.io/mistorias-web/_astro/principal.abc.jpg"
    );
  });

  it("omite la imagen cuando la historia no tiene", () => {
    const [item] = buildStoryFeed(SITE_NETLIFY, "/", [buildFeedStory()]).items;

    expect(item).not.toHaveProperty("image");
  });

  it("ordena del más reciente al más antiguo", () => {
    const feed = buildStoryFeed(SITE_NETLIFY, "/", [
      buildFeedStory({ id: "antigua", date: new Date("2026-07-24") }),
      buildFeedStory({ id: "reciente", date: new Date("2026-11-19") }),
      buildFeedStory({ id: "intermedia", date: new Date("2026-09-11") })
    ]);

    expect(feed.items.map((item) => item.id)).toEqual([
      "reciente",
      "intermedia",
      "antigua"
    ]);
  });
});
