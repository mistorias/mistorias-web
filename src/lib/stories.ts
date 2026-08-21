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
