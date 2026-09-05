import type { CollectionEntry } from "astro:content";
import type { Authorship } from "../../src/lib/content/schema";

interface StoryFixtureOverrides {
  id?: string;
  title?: string;
  summary?: string;
  date?: Date;
  authorId?: string;
  authorship?: Authorship;
  themes?: string[];
  imageAlt?: string;
  imageCredit?: string;
  imageLicense?: string;
}

export function buildStoryFixture(
  overrides?: StoryFixtureOverrides
): CollectionEntry<"stories"> {
  return {
    id: overrides?.id ?? "historia-de-prueba",
    collection: "stories",
    data: {
      title: overrides?.title ?? "Historia de prueba",
      summary: overrides?.summary ?? "Resumen breve",
      date: overrides?.date ?? new Date("2026-04-26"),
      // `author` es una referencia a `authors/`, no un nombre: la forma la fija
      // `reference("authors")` en el esquema.
      author: {
        collection: "authors",
        id: overrides?.authorId ?? "paolo-carrasco"
      },
      authorship: overrides?.authorship ?? "escrito-con-ia",
      themes: overrides?.themes ?? ["educacion"],
      imageAlt: overrides?.imageAlt,
      imageCredit: overrides?.imageCredit,
      imageLicense: overrides?.imageLicense,
    },
  } as CollectionEntry<"stories">;
}
