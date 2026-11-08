import type { CollectionEntry } from "astro:content";

interface CommentFixtureOverrides {
  story?: string;
  id?: string;
  author?: string;
  text?: string;
  submittedAt?: string;
}

export function buildCommentFixture(
  overrides?: CommentFixtureOverrides
): CollectionEntry<"comments"> {
  const story = overrides?.story ?? "historia-de-prueba";
  const id = overrides?.id ?? "0123456789abcdef";

  return {
    id: `${story}/comentario-${id}`,
    collection: "comments",
    data: {
      story,
      id,
      author: overrides?.author ?? "Rosa Quispe",
      text: overrides?.text ?? "Me hizo pensar en mi abuela.",
      submittedAt: overrides?.submittedAt ?? "2026-11-02T15:30:00-05:00"
    }
  };
}
