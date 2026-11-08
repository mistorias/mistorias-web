import type { StoryComment } from "../content/story-comment";

type CommentEntry = { data: StoryComment };

/**
 * Los comentarios aprobados de una historia, del más antiguo al más reciente
 * (se lee como una conversación que fue llegando). Compara instantes y no el
 * texto, porque cada comentario trae su propia zona horaria; el id desempata
 * para que dos builds den el mismo orden.
 */
export function commentsForStory<Entry extends CommentEntry>(
  entries: readonly Entry[],
  storyId: string
): Entry[] {
  return entries
    .filter((entry) => entry.data.story === storyId)
    .toSorted(
      (a, b) =>
        Date.parse(a.data.submittedAt) - Date.parse(b.data.submittedAt) ||
        a.data.id.localeCompare(b.data.id)
    );
}
