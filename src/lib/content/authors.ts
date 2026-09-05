/**
 * Resolución del autor de una historia.
 *
 * `story.data.author` es una referencia (`{ collection, id }`), no un nombre,
 * así que alguien tiene que traducir el id al nombre visible. Lo hacen las
 * páginas, una sola vez por página, y no `TarjetaHistoria.astro`: la tarjeta se
 * queda como componente puro, testeable sin levantar la capa de contenido.
 *
 * Genérico sobre `T` y con accesores, igual que `groupByTheme`, para que la
 * lógica se pruebe sin depender de `astro:content`.
 */

export const buildAuthorNameMap = <T>(
  authors: readonly T[],
  getId: (author: T) => string,
  getName: (author: T) => string
): ReadonlyMap<string, string> =>
  new Map(authors.map((author) => [getId(author), getName(author)]));

/**
 * Falla en vez de devolver el slug.
 *
 * El esquema ya garantiza que la ficha existe, así que llegar acá sin nombre
 * significa que el mapa se armó mal. Mostrar `paolo-carrasco` donde va «Paolo
 * Carrasco» sería un build exitoso publicando algo roto — la misma clase de
 * error silencioso que el issue #29.
 */
export const authorNameFor = (
  names: ReadonlyMap<string, string>,
  id: string
): string => {
  const name = names.get(id);

  if (name === undefined) {
    throw new Error(
      `No hay ficha de autoría para "${id}". Revisa que exista authors/${id}.md en el submódulo de contenido.`
    );
  }

  return name;
};

/** Las historias que firma una persona, en el orden en que llegaron. */
export const storiesByAuthor = <T>(
  stories: readonly T[],
  getAuthorId: (story: T) => string,
  authorId: string
): readonly T[] =>
  stories.filter((story) => getAuthorId(story) === authorId);
