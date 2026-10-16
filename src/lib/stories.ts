/**
 * Orden de publicación de las historias.
 *
 * La portada, el índice de temas y cada página de tema muestran lo más
 * reciente primero. Se copia antes de ordenar porque `Array.prototype.sort`
 * muta, y la colección que entrega Astro se reutiliza entre páginas.
 *
 * Un empate de fecha se desempata por id, al revés que `orderStoriesByDate`
 * (`src/lib/content/story-order.ts`): este orden es exactamente el inverso de
 * aquel, así que la historia destacada de la portada es siempre la misma a la
 * que lleva `/ultima` (issue #170).
 */
export const sortByDateDescending = <T>(
  stories: readonly T[],
  getId: (story: T) => string,
  getDate: (story: T) => Date
): readonly T[] =>
  [...stories].sort((one, other) => {
    const dateDiff = getDate(other).getTime() - getDate(one).getTime();
    return dateDiff !== 0 ? dateDiff : getId(other).localeCompare(getId(one));
  });

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

/**
 * Conteo de historias tal como lo lee el lector: "1 historia", "3 historias".
 * Lo comparten el índice de historias y el de temas.
 */
export const countStories = (count: number): string =>
  count === 1 ? "1 historia" : `${count} historias`;
