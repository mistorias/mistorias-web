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

/**
 * Agrupación de temas por su inicial, para el índice alfabético de /temas/
 * (issue #182).
 */

export type InitialGroup<T> = {
  readonly initial: string;
  readonly themes: readonly ThemeGroup<T>[];
};

// Lo que no empieza con letra (un año, por ejemplo) va junto bajo este rótulo
// y al final del índice.
const NON_LETTER_INITIAL = "#";

/*
 * Una tilde no cambia la letra con la que se busca un tema ("ética" está en la
 * E), así que se quita. La eñe sí es otra letra del alfabeto castellano: se
 * revisa antes de descomponer, porque NFD la partiría en "n" + virgulilla.
 */
export const themeInitial = (theme: string): string => {
  const first = theme.charAt(0).toLocaleUpperCase("es");

  if (first === "Ñ") return first;

  const base = first.normalize("NFD").charAt(0);

  return /\p{L}/u.test(base) ? base : NON_LETTER_INITIAL;
};

const alphabetically = (one: string, other: string): number =>
  one.localeCompare(other, "es");

const byInitial = (one: string, other: string): number =>
  Number(one === NON_LETTER_INITIAL) - Number(other === NON_LETTER_INITIAL) ||
  alphabetically(one, other);

export const groupByInitial = <T>(
  groups: readonly ThemeGroup<T>[]
): readonly InitialGroup<T>[] => {
  const byLetter = new Map<string, ThemeGroup<T>[]>();

  for (const group of groups) {
    const initial = themeInitial(group.theme);
    const letter = byLetter.get(initial) ?? [];

    letter.push(group);
    byLetter.set(initial, letter);
  }

  return [...byLetter]
    .sort(([one], [other]) => byInitial(one, other))
    .map(([initial, themes]) => ({
      initial,
      themes: themes.sort((one, other) => alphabetically(one.theme, other.theme))
    }));
};

/**
 * Ancla de una letra dentro de /temas/ (`#letra-a`). El quipu de temas la
 * pone como `id`; vive acá para que cualquier enlace a una letra la arme igual.
 */
export const initialAnchor = (initial: string): string =>
  `letra-${initial === NON_LETTER_INITIAL ? "otros" : initial.toLocaleLowerCase("es")}`;

/** Conteo de temas tal como lo lee el lector: "1 tema", "3 temas". */
export const countThemes = (count: number): string =>
  count === 1 ? "1 tema" : `${count} temas`;

/**
 * Cuántos temas muestra "Los más tocados" en /temas/ (issue #182): la lectura
 * por cantidad que el índice alfabético dejó de dar.
 */
export const MAX_MOST_COVERED_THEMES = 3;

/**
 * Los temas con más historias. Asume que `groups` llega ordenado por cantidad
 * (ver `groupByTheme`). Si no hay más temas que el tope, no devuelve nada: la
 * lista solo repetiría lo que el quipu ya muestra completo.
 */
export const mostCoveredThemes = <T>(
  groups: readonly ThemeGroup<T>[]
): readonly ThemeGroup<T>[] =>
  groups.length > MAX_MOST_COVERED_THEMES
    ? groups.slice(0, MAX_MOST_COVERED_THEMES)
    : [];
