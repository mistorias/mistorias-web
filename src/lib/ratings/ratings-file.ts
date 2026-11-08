import { z } from "astro/zod";

export const RATINGS_FILE_PATH = "data/ratings.json";

const STORY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const countSchema = z.number().int().nonnegative();

const ratingDistributionSchema = z.strictObject({
  "1": countSchema,
  "2": countSchema,
  "3": countSchema,
  "4": countSchema,
  "5": countSchema
});

// Sin timestamp a propósito: el archivo solo cambia cuando cambian las
// calificaciones, así el PR diario no se abre por nada (ADR 0037).
const ratingsFileSchema = z.strictObject({
  stories: z.record(z.string().regex(STORY_ID_PATTERN), ratingDistributionSchema)
});

export type RatingDistribution = z.infer<typeof ratingDistributionSchema>;
export type RatingsFile = z.infer<typeof ratingsFileSchema>;

/**
 * Lee y valida `data/ratings.json`, el conteo de calificaciones por historia
 * que trae el workflow diario (ADR 0037). Falla con un mensaje claro en vez de
 * dejar que una forma inesperada llegue a la página como un promedio falso.
 */
export function parseRatingsFile(contents: string): RatingsFile {
  let raw: unknown;

  try {
    raw = JSON.parse(contents);
  } catch {
    throw new Error(`${RATINGS_FILE_PATH} no es JSON válido.`);
  }

  const result = ratingsFileSchema.safeParse(raw);

  if (!result.success) {
    throw new Error(
      `${RATINGS_FILE_PATH} no cumple el esquema. ${z.prettifyError(result.error)}`
    );
  }

  return result.data;
}

/**
 * Escribe el archivo de forma determinista: historias ordenadas por slug,
 * calificaciones del 1 al 5, sangría de 2 espacios y salto de línea final. Dos
 * corridas con los mismos datos dan el mismo texto, así el PR diario solo se
 * abre cuando algo cambió de verdad.
 */
export function serializeRatingsFile(file: RatingsFile): string {
  const stories = Object.fromEntries(
    Object.keys(file.stories)
      .sort()
      .map((slug) => {
        const { "1": one, "2": two, "3": three, "4": four, "5": five } =
          file.stories[slug];
        return [slug, { "1": one, "2": two, "3": three, "4": four, "5": five }];
      })
  );

  return `${JSON.stringify({ stories }, null, 2)}\n`;
}
