import { createHash } from "node:crypto";

/**
 * Orden cronológico de historias y cálculo de vecinos anterior/siguiente
 * (issue #34).
 *
 * A diferencia de `sortByDateDescending` (`src/lib/stories.ts`), que ordena
 * de más reciente a más antigua para portada y temas, acá el orden es
 * ascendente: "anterior" es la historia que se publicó antes (fecha menor) y
 * "siguiente" la que se publicó después (fecha mayor) — la lectura avanza
 * hacia adelante en el tiempo.
 */

export type StoryNeighbors = {
  readonly previous: string | null;
  readonly next: string | null;
};

/**
 * Ordena ascendente por fecha y devuelve solo los ids, en ese orden. Empate
 * de fecha se desempata por id para que el orden —y por lo tanto los
 * vecinos— sea determinístico.
 */
export const orderStoriesByDate = <T>(
  stories: readonly T[],
  getId: (story: T) => string,
  getDate: (story: T) => Date
): readonly string[] =>
  [...stories]
    .sort((one, other) => {
      const dateDiff = getDate(one).getTime() - getDate(other).getTime();
      return dateDiff !== 0
        ? dateDiff
        : getId(one).localeCompare(getId(other));
    })
    .map(getId);

/**
 * Vecinos de `id` dentro de `orderedIds` (ya ordenado ascendente por fecha,
 * ver `orderStoriesByDate`). `null` en los extremos: la más antigua no tiene
 * anterior, la más reciente no tiene siguiente. `null` también si `id` no
 * aparece en `orderedIds`.
 */
export const neighborsFor = (
  orderedIds: readonly string[],
  id: string
): StoryNeighbors => {
  const index = orderedIds.indexOf(id);
  if (index === -1) {
    return { previous: null, next: null };
  }

  return {
    previous: index > 0 ? orderedIds[index - 1] : null,
    next: index < orderedIds.length - 1 ? orderedIds[index + 1] : null
  };
};

/**
 * Hash de la secuencia ordenada de ids. Depende solo del orden, no de las
 * fechas exactas: si una fecha cambia sin alterar el orden relativo, el hash
 * no cambia (el vecindario sigue siendo el mismo); si el orden cambia, o se
 * agrega, quita o renombra una historia, el hash sí cambia. Es la firma que
 * usa `story-order-cache.ts` para saber si el cache sigue vigente.
 */
export const hashOrderedIds = (orderedIds: readonly string[]): string =>
  createHash("sha256").update(orderedIds.join("\n")).digest("hex");
