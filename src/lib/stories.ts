/**
 * Orden de publicación de las historias.
 *
 * La portada, el índice de temas y cada página de tema muestran lo más
 * reciente primero. Se copia antes de ordenar porque `Array.prototype.sort`
 * muta, y la colección que entrega Astro se reutiliza entre páginas.
 */

export const sortByDateDescending = <T>(
  stories: readonly T[],
  getDate: (story: T) => Date
): readonly T[] =>
  [...stories].sort(
    (one, other) => getDate(other).getTime() - getDate(one).getTime()
  );

/**
 * Cuántas historias anteriores muestra la portada (issue #72), aparte de la
 * destacada. Limita la carga de la portada; la navegación en el tiempo hacia
 * historias más antiguas queda fuera de este alcance.
 */
export const MAX_PREVIOUS_STORIES = 4;

/**
 * Recorta a las historias anteriores que se muestran en portada. Asume que
 * `stories` ya llega ordenada por fecha descendente (ver
 * `sortByDateDescending`), así que las primeras `MAX_PREVIOUS_STORIES` son
 * las más recientes.
 */
export const limitPreviousStories = <T>(stories: readonly T[]): readonly T[] =>
  stories.slice(0, MAX_PREVIOUS_STORIES);
