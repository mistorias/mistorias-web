/**
 * Agrupación de historias por etiqueta.
 *
 * Se mantiene independiente de las colecciones de Astro —recibe cómo leer las
 * etiquetas de cada historia— para que la lógica se pruebe sin levantar el
 * framework, tal como pide la separación de responsabilidades de
 * docs/STANDARDS.md.
 */

export type TagGroup<T> = {
  readonly tag: string;
  readonly stories: readonly T[];
};

export const normalizeTag = (tag: string): string => tag.trim().toLowerCase();

const uniqueTagsOf = <T>(
  story: T,
  getTags: (story: T) => readonly string[]
): ReadonlySet<string> =>
  new Set(
    getTags(story)
      .map(normalizeTag)
      .filter((tag) => tag.length > 0)
  );

// Más historias primero, porque el índice de etiquetas existe para mostrar de
// qué habla el sitio; a igual cantidad, alfabético para que el orden no dependa
// del azar del recorrido.
const byRelevance = <T>(one: TagGroup<T>, other: TagGroup<T>): number =>
  other.stories.length - one.stories.length ||
  one.tag.localeCompare(other.tag, "es");

export const groupByTag = <T>(
  stories: readonly T[],
  getTags: (story: T) => readonly string[]
): readonly TagGroup<T>[] => {
  const grouped = new Map<string, T[]>();

  for (const story of stories) {
    for (const tag of uniqueTagsOf(story, getTags)) {
      const group = grouped.get(tag) ?? [];

      group.push(story);
      grouped.set(tag, group);
    }
  }

  return [...grouped]
    .map(([tag, groupStories]) => ({
      tag,
      stories: groupStories
    }))
    .sort(byRelevance);
};
