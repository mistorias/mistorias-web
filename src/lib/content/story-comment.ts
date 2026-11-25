import { z } from "astro/zod";

export const COMMENT_FILENAME_PATTERN = /^comentario-([a-f0-9]{16})\.json$/;

export const COMMENT_AUTHOR_MAX_LENGTH = 60;
export const COMMENT_TEXT_MAX_LENGTH = 1500;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Forma de un comentario público de lector. Es la única fuente de verdad:
 * la usan el gate de carpetas, la colección `comments` y la función de
 * Netlify que arma el PR (ADR 0036). Estricto a propósito: un campo de más
 * en un archivo que escribe un bot y aprueba una persona es una señal, no
 * un detalle.
 */
export const storyCommentSchema = z.strictObject({
  story: z.string().regex(SLUG_PATTERN),
  id: z.string().regex(/^[a-f0-9]{16}$/),
  author: z.string().min(1).max(COMMENT_AUTHOR_MAX_LENGTH),
  text: z.string().min(1).max(COMMENT_TEXT_MAX_LENGTH),
  submittedAt: z.iso.datetime({ offset: true })
});

export type StoryComment = z.infer<typeof storyCommentSchema>;

export function commentFilename(id: string): string {
  return `comentario-${id}.json`;
}

function parseJson(contents: string, fileName: string, filePath: string): unknown {
  try {
    return JSON.parse(contents);
  } catch {
    throw new Error(`${filePath}: ${fileName} no es JSON válido.`);
  }
}

/**
 * Valida un `comentario-<id>.json` que llega por PR desde la función de
 * Netlify. Además del esquema comprueba dos coincidencias: la historia del
 * archivo debe ser la de su carpeta y el id debe ser el de su nombre, para
 * que nadie cuele un comentario bajo otra historia ni dos archivos con el
 * mismo id. `fileName` ya pasó por `COMMENT_FILENAME_PATTERN`.
 */
export function assertStoryCommentIsValid(
  contents: string,
  folderName: string,
  fileName: string,
  filePath: string
): void {
  const result = storyCommentSchema.safeParse(
    parseJson(contents, fileName, filePath)
  );

  if (!result.success) {
    throw new Error(
      `${filePath}: ${fileName} no cumple el esquema. ${z.prettifyError(result.error)}`
    );
  }

  if (result.data.story !== folderName) {
    throw new Error(
      `${filePath}: el comentario dice "${result.data.story}" pero está en la carpeta de "${folderName}".`
    );
  }

  const idInFileName = COMMENT_FILENAME_PATTERN.exec(fileName)?.[1];
  if (result.data.id !== idInFileName) {
    throw new Error(
      `${filePath}: el id "${result.data.id}" no coincide con el del nombre del archivo ("${idInFileName}").`
    );
  }
}
