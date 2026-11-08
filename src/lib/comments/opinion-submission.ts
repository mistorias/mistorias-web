import { commentId } from "./comment-id";
import { checkCommentContent, type ContentSkipReason } from "./content-rules";
import type { StoryComment } from "../content/story-comment";

export type SkipReason =
  | "other-form"
  | "honeypot"
  | "not-public"
  | "invalid-story"
  | "unpublished-story"
  | ContentSkipReason;

const FORM_NAME = "opinion-historia";
const HONEYPOT_FIELD = "opinion-empresa";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function field(data: Record<string, string | undefined>, name: string): string {
  const value = data[name];
  return typeof value === "string" ? value : "";
}

/**
 * Decide si un envío de Netlify Forms es un comentario público publicable.
 * Devuelve el comentario ya validado o el motivo por el que se ignora; nunca
 * lanza, porque un envío ignorado no es un error: sigue en el panel privado.
 *
 * `form-name` solo descarta si viene y es otro: no se sabe con certeza que
 * Netlify lo entregue en `event.data`, y los demás campos (visibilidad,
 * historia publicada, nombre y texto) ya distinguen este formulario del de
 * «Reportar un problema».
 */
export function parsePublicComment(
  data: Record<string, string | undefined>,
  publishedStoryIds: readonly string[],
  now: Date
): { comment: StoryComment } | { skipped: SkipReason } {
  const formName = data["form-name"];
  if (formName !== undefined && formName !== FORM_NAME) {
    return { skipped: "other-form" };
  }
  if (field(data, HONEYPOT_FIELD) !== "") {
    return { skipped: "honeypot" };
  }
  if (field(data, "visibilidad") !== "publico") {
    return { skipped: "not-public" };
  }

  const story = field(data, "historia");
  if (!SLUG_PATTERN.test(story)) {
    return { skipped: "invalid-story" };
  }
  if (!publishedStoryIds.includes(story)) {
    return { skipped: "unpublished-story" };
  }

  const checked = checkCommentContent({
    author: field(data, "nombre"),
    text: field(data, "comentario")
  });
  if ("skipped" in checked) {
    return checked;
  }

  return {
    comment: {
      story,
      id: commentId(story, checked.author, checked.text),
      author: checked.author,
      text: checked.text,
      submittedAt: now.toISOString()
    }
  };
}
