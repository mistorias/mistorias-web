/**
 * Agrupación de historias por tema.
 *
 * Se mantiene independiente de las colecciones de Astro —recibe cómo leer los
 * temas de cada historia— para que la lógica se pruebe sin levantar el
 * framework, tal como pide la separación de responsabilidades de
 * docs/STANDARDS.md.
 */

export type ThemeGroup<T> = {
  readonly theme: string;
  readonly stories: readonly T[];
};

export const normalizeTheme = (theme: string): string =>
  theme.trim().toLowerCase();

const uniqueThemesOf = <T>(
  story: T,
  getThemes: (story: T) => readonly string[]
): ReadonlySet<string> =>
  new Set(
    getThemes(story)
      .map(normalizeTheme)
      .filter((theme) => theme.length > 0)
  );

// Más historias primero, porque el índice de temas existe para mostrar de qué
// habla el sitio; a igual cantidad, alfabético para que el orden no dependa del
// azar del recorrido.
const byRelevance = <T>(one: ThemeGroup<T>, other: ThemeGroup<T>): number =>
  other.stories.length - one.stories.length ||
  one.theme.localeCompare(other.theme, "es");

export const groupByTheme = <T>(
  stories: readonly T[],
  getThemes: (story: T) => readonly string[]
): readonly ThemeGroup<T>[] => {
  const grouped = new Map<string, T[]>();

  for (const story of stories) {
    for (const theme of uniqueThemesOf(story, getThemes)) {
      const group = grouped.get(theme) ?? [];

      group.push(story);
      grouped.set(theme, group);
    }
  }

  return [...grouped]
    .map(([theme, groupStories]) => ({
      theme,
      stories: groupStories
    }))
    .sort(byRelevance);
};
