import type { CollectionEntry } from "astro:content";

interface StoryFixtureOverrides {
  id?: string;
  title?: string;
  summary?: string;
  date?: Date;
  author?: string;
  tags?: string[];
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
      author: overrides?.author ?? "Equipo Mistorias",
      tags: overrides?.tags ?? ["educacion"],
    },
  } as CollectionEntry<"stories">;
}
