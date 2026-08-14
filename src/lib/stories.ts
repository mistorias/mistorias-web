/**
 * Orden de publicación de las historias.
 *
 * La portada, el índice de etiquetas y cada página de etiqueta muestran lo más
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
