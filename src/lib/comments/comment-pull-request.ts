import {
  commentFilename,
  storyCommentSchema,
  type StoryComment
} from "../content/story-comment";

export type CommentPullRequest = {
  branch: string;
  path: string;
  contents: string;
  commitMessage: string;
  title: string;
  body: string;
};

/**
 * La cerca de código de Markdown más corta que el texto no puede cerrar: una
 * secuencia de backticks más larga que cualquiera del texto. Dentro de ella
 * GitHub no renderiza Markdown ni HTML, no carga imágenes de rastreo y no
 * notifica las @menciones.
 */
export function fenceFor(text: string): string {
  const longestRun = Math.max(
    0,
    ...(text.match(/`+/g) ?? []).map((run) => run.length)
  );
  return "`".repeat(Math.max(3, longestRun + 1));
}

function fenced(value: string): string {
  const fence = fenceFor(value);
  return `${fence}\n${value}\n${fence}`;
}

/**
 * Arma lo que se le pide a GitHub para un comentario. Ningún dato del lector
 * llega a la rama, a la ruta, al título ni al mensaje de commit: solo la
 * historia (ya validada contra las publicadas) y el id (hexadecimal). El
 * nombre y el texto van únicamente dentro del archivo y del cuerpo, que es
 * código cercado.
 */
export function buildCommentPullRequest(input: StoryComment): CommentPullRequest {
  const comment = storyCommentSchema.parse(input);
  const contents = JSON.stringify(
    {
      story: comment.story,
      id: comment.id,
      author: comment.author,
      text: comment.text,
      submittedAt: comment.submittedAt
    },
    null,
    2
  );

  return {
    branch: `comentarios/${comment.story}-${comment.id}`,
    path: `stories/${comment.story}/${commentFilename(comment.id)}`,
    contents: `${contents}\n`,
    commitMessage: `chore(comentarios): llega un comentario de lector en «${comment.story}»`,
    title: `Comentario de lector en «${comment.story}»`,
    body: [
      `Un lector pidió publicar este comentario bajo «${comment.story}».`,
      "",
      "**Fusionar = aprobar · Cerrar = rechazar**",
      "",
      "Nombre:",
      "",
      fenced(comment.author),
      "",
      "Comentario:",
      "",
      fenced(comment.text),
      ""
    ].join("\n")
  };
}
