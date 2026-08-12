/**
 * Orden de publicación de las historias.
 *
 * La portada, el índice de etiquetas y cada página de etiqueta muestran lo más
 * reciente primero. Se copia antes de ordenar porque `Array.prototype.sort`
 * muta, y la colección que entrega Astro se reutiliza entre páginas.
 */

export const ordenarPorFechaDescendente = <T>(
  historias: readonly T[],
  obtenerFecha: (historia: T) => Date
): readonly T[] =>
  [...historias].sort(
    (una, otra) => obtenerFecha(otra).getTime() - obtenerFecha(una).getTime()
  );
