import type { CollectionEntry } from "astro:content";

interface AuthorFixtureOverrides {
  id?: string;
  name?: string;
  bio?: string;
  link?: string;
  linkLabel?: string;
}

export function buildAuthorFixture(
  overrides?: AuthorFixtureOverrides
): CollectionEntry<"authors"> {
  return {
    id: overrides?.id ?? "mateo-salazar",
    collection: "authors",
    data: {
      name: overrides?.name ?? "Mateo Salazar",
      bio: overrides?.bio ?? "Escribe historias de prueba para Mistorias.",
      link: overrides?.link,
      linkLabel: overrides?.linkLabel,
    },
  } as CollectionEntry<"authors">;
}
