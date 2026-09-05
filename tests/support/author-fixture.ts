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
    id: overrides?.id ?? "paolo-carrasco",
    collection: "authors",
    data: {
      name: overrides?.name ?? "Paolo Carrasco",
      bio: overrides?.bio ?? "Escribe Mistorias desde Barcelona.",
      link: overrides?.link,
      linkLabel: overrides?.linkLabel,
    },
  } as CollectionEntry<"authors">;
}
