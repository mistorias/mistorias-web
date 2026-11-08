// Extensión `.ts` explícita: este módulo también lo ejecuta Node directo, sin
// bundler, vía scripts/update-ratings.ts (ver la nota en
// scripts/generate-story-order-cache.ts).
import type { RatingDistribution, RatingsFile } from "./ratings-file.ts";

// Más de 50 calificaciones nuevas en un día en una sola historia no es lo
// normal para este sitio: es la señal para que quien revisa el PR mire con
// cuidado antes de fusionar (ADR 0037, "Inflar las calificaciones").
export const ANOMALY_THRESHOLD = 50;
export const ANOMALY_LABEL = "⚠️ revisar antes de fusionar";

/** Lo único que se lee de un envío de Netlify Forms: sus campos. */
export type Submission = {
  readonly data: Readonly<Record<string, unknown>>;
};

export type RatingsDeltaRow = {
  story: string;
  added: number;
  total: number;
  flagged: boolean;
};

const SCORE_PATTERN = /^[1-5]$/;

const emptyDistribution = (): Record<string, number> => ({
  "1": 0,
  "2": 0,
  "3": 0,
  "4": 0,
  "5": 0
});

/**
 * Cuenta las calificaciones de `opinion-historia` por historia. Ignora, sin
 * fallar, los envíos de historias que no están publicadas y los que traen una
 * calificación distinta de "1" a "5": un envío manipulado no debe poder tumbar
 * el conteo del día. Es pura: el mismo conjunto de envíos da siempre el mismo
 * resultado, sin importar el orden.
 */
export function tallyRatings(
  submissions: readonly Submission[],
  publishedStoryIds: readonly string[]
): RatingsFile {
  const published = new Set(publishedStoryIds);
  const counts = new Map<string, Record<string, number>>();

  for (const { data } of submissions) {
    const { historia: story, calificacion: score } = data;

    if (typeof story !== "string" || !published.has(story)) continue;
    if (typeof score !== "string" || !SCORE_PATTERN.test(score)) continue;

    const distribution = counts.get(story) ?? emptyDistribution();
    distribution[score] += 1;
    counts.set(story, distribution);
  }

  const stories = Object.fromEntries(
    [...counts.keys()]
      .sort()
      .map((story) => [story, counts.get(story) as RatingDistribution])
  );

  return { stories };
}

const totalOf = (distribution: RatingDistribution | undefined): number =>
  distribution === undefined
    ? 0
    : Object.values(distribution).reduce((sum, count) => sum + count, 0);

/**
 * Calificaciones nuevas por historia entre dos conteos, solo de las historias
 * que cambiaron. `added` es negativo si Netlify tiene menos envíos que antes
 * (por ejemplo, porque alguien borró spam en el panel).
 */
export function ratingsDelta(
  previous: RatingsFile,
  next: RatingsFile
): RatingsDeltaRow[] {
  const slugs = [
    ...new Set([...Object.keys(previous.stories), ...Object.keys(next.stories)])
  ].sort();

  return slugs
    .map((story) => {
      const total = totalOf(next.stories[story]);
      const added = total - totalOf(previous.stories[story]);

      return { story, added, total, flagged: added > ANOMALY_THRESHOLD };
    })
    .filter((row) => row.added !== 0);
}

const signed = (added: number): string => (added > 0 ? `+${added}` : `${added}`);

/** La tabla de "nuevas por historia" que va en el cuerpo del PR. */
export function renderRatingsDelta(rows: readonly RatingsDeltaRow[]): string {
  if (rows.length === 0) {
    return "Sin calificaciones nuevas.";
  }

  return [
    "| Historia | Nuevas | Total | Aviso |",
    "| --- | ---: | ---: | --- |",
    ...rows.map(
      ({ story, added, total, flagged }) =>
        `| \`${story}\` | ${signed(added)} | ${total} | ${flagged ? ANOMALY_LABEL : ""} |`
    )
  ].join("\n");
}
