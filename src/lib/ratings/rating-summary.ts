import type { RatingDistribution } from "./ratings-file";

// Con menos calificaciones el promedio dice más del azar que de la historia:
// una sola persona lo movería casi un punto.
export const MIN_RATINGS_TO_SHOW = 5;

export type RatingSummary = {
  count: number;
  average: number;
};

const SCORES = ["1", "2", "3", "4", "5"] as const;

/**
 * Resume la distribución de una historia en cantidad y promedio, o `null` si
 * todavía no hay suficientes calificaciones para mostrarlo.
 */
export function ratingSummary(
  distribution: RatingDistribution | undefined
): RatingSummary | null {
  if (distribution === undefined) {
    return null;
  }

  const count = SCORES.reduce((total, score) => total + distribution[score], 0);

  if (count < MIN_RATINGS_TO_SHOW) {
    return null;
  }

  const sum = SCORES.reduce(
    (total, score) => total + Number(score) * distribution[score],
    0
  );

  return { count, average: sum / count };
}
