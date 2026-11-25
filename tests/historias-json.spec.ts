import type { APIContext, ImageMetadata } from "astro";
import { Ajv } from "ajv";
import addFormatsModule from "ajv-formats";
import { describe, expect, it, vi } from "vitest";
import fixtureImage from "./fixtures/principal.jpg";
import feedSchema from "./fixtures/json-feed/feed.json";
import feedSchemaDefinitions from "./fixtures/json-feed/feed-1.json";
import { buildAuthorFixture } from "./support/author-fixture";
import { buildStoryFixture } from "./support/story-fixture";

// Las historias y la imagen salen de fixtures y no del submódulo: el test no
// depende de qué historias estén publicadas en cada momento.
const STORY_ID_WITH_IMAGE = "2026-11-19-con-imagen";
const STORY_ID_WITHOUT_IMAGE = "2026-11-12-sin-imagen";

vi.mock("astro:content", () => ({
  getCollection: async (collection: string) =>
    collection === "authors"
      ? [buildAuthorFixture({ id: "mateo-salazar", name: "Mateo Salazar" })]
      : [
          buildStoryFixture({
            id: STORY_ID_WITHOUT_IMAGE,
            date: new Date("2026-11-12"),
            summary: "Una historia que llega al feed sin imagen propia.",
            body: "## Noticias principales\n\n**La noticia sin foto.** Texto."
          }),
          buildStoryFixture({
            id: STORY_ID_WITH_IMAGE,
            date: new Date("2026-11-19"),
            summary: "Una historia que llega al feed con su imagen principal.",
            imageAlt: "Descripción de la imagen de prueba",
            imageCredit: "Foto de prueba",
            imageLicense: "CC BY 4.0",
            body: "## Noticias principales\n\n- **La noticia con foto.** Texto."
          })
        ]
}));

vi.mock("../src/lib/content/story-images", () => ({
  getStoryImage: (storyId: string): ImageMetadata | undefined =>
    storyId === STORY_ID_WITH_IMAGE
      ? (fixtureImage as unknown as ImageMetadata)
      : undefined
}));

const { GET } = await import("../src/pages/historias.json");

// El esquema es el de SchemaStore (https://www.schemastore.org/feed.json y
// feed-1.json, Apache-2.0), copiado tal cual en tests/fixtures/json-feed/:
// validar contra un esquema escrito acá repetiría la misma lectura del
// estándar que hizo el código.
// `ajv-formats` se publica en CommonJS: según quién lo cargue, la función
// llega directa o envuelta en `default`.
const addFormats = ((addFormatsModule as { default?: unknown }).default ??
  addFormatsModule) as (ajv: Ajv) => Ajv;
const ajv = addFormats(new Ajv({ allErrors: true }));
ajv.addSchema(feedSchemaDefinitions);
const validateJsonFeed = ajv.compile(feedSchema);

const requestFeed = async () => {
  const response = await GET({
    site: new URL("https://mistorias.pe")
  } as APIContext);

  return { response, feed: await response.json() };
};

describe("el endpoint /historias.json", () => {
  it("cumple el esquema de JSON Feed", async () => {
    const { feed } = await requestFeed();

    const isValid = validateJsonFeed(feed);

    // Los errores primero: si falla, dicen qué campo rompe el estándar.
    expect(validateJsonFeed.errors ?? []).toEqual([]);
    expect(isValid).toBe(true);
  });

  it("se sirve con el tipo de JSON Feed", async () => {
    const { response } = await requestFeed();

    expect(response.headers.get("Content-Type")).toBe(
      "application/feed+json; charset=utf-8"
    );
  });

  it("publica las historias de la más reciente a la más antigua", async () => {
    const { feed } = await requestFeed();

    expect(feed.items.map((item: { id: string }) => item.id)).toEqual([
      STORY_ID_WITH_IMAGE,
      STORY_ID_WITHOUT_IMAGE
    ]);
  });

  it("firma cada historia con el nombre de su ficha de autoría", async () => {
    const { feed } = await requestFeed();

    expect(feed.items[0].authors).toEqual([
      { name: "Mateo Salazar", url: "https://mistorias.pe/autores/mateo-salazar/" }
    ]);
  });

  // La imagen del feed es la misma que ya se comparte en redes (og:image):
  // JPEG recortado a 1200×630 por astro:assets, nunca el archivo crudo.
  it("trae la imagen optimizada como URL absoluta cuando la historia tiene", async () => {
    const { feed } = await requestFeed();

    expect(feed.items[0].image).toMatch(/^https:\/\/mistorias\.pe\//);
    // En tests astro:assets sirve el recorte por su endpoint `/_image`, con el
    // archivo original como parámetro: lo que importa es no apuntar a él.
    expect(feed.items[0].image).not.toMatch(/principal\.jpg$/);
    expect(feed.items[1]).not.toHaveProperty("image");
  });

  it("trae la primera noticia y el texto alternativo en _mistorias (issue #264)", async () => {
    const { feed } = await requestFeed();

    expect(feed.items[0]._mistorias).toEqual({
      primeraNoticia: "La noticia con foto.",
      imageAlt: "Descripción de la imagen de prueba"
    });
    expect(feed.items[1]._mistorias).toEqual({
      primeraNoticia: "La noticia sin foto."
    });
  });
});
