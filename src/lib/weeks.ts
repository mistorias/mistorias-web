export type TimelineWeek<T> = {
  readonly kind: "week";
  readonly key: string;
  readonly start: Date;
  readonly end: Date;
  readonly stories: readonly T[];
};

export type TimelineGap = {
  readonly kind: "gap";
  readonly key: string;
  readonly weeks: number;
};

export type TimelineEntry<T> = TimelineWeek<T> | TimelineGap;

export type TimelineYear<T> = {
  readonly year: number;
  readonly entries: readonly TimelineEntry<T>[];
  readonly storyCount: number;
};

export const GAP_THRESHOLD = 2;

/**
 * Calcula el lunes UTC de la semana ISO-8601 que contiene la fecha.
 * Usa getUTCDay para asegurar que el cálculo sea independiente de la zona
 * horaria del build: se necesita cálculo UTC invariante porque z.coerce.date()
 * del frontmatter produce Date en UTC, y el build corre en zonas distintas
 * (Lima, GitHub Actions, Netlify). Una máquina en otra zona horaria sin
 * getUTCDay produciría Monday en fechas incorrectas y romería el cálculo
 * de semana ISO.
 */
const getMondayOfWeek = (date: Date): Date => {
  const day = date.getUTCDay();
  const daysToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
};

/**
 * Calcula el número de semana ISO-8601 y el año ISO para una fecha UTC.
 * La semana ISO comienza el lunes. El año ISO del jueves de la semana determina
 * a qué año pertenece. La semana 1 es aquella que contiene el jueves 4 de enero.
 */
const getISOWeekInfo = (
  date: Date
): { readonly week: number; readonly year: number } => {
  const d = new Date(date);
  const dayOfWeek = d.getUTCDay();

  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() + (4 - (dayOfWeek === 0 ? 7 : dayOfWeek)));

  const isoYear = thursday.getUTCFullYear();

  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay();

  const monday1 = new Date(jan4);
  monday1.setUTCDate(4 - (jan4DayOfWeek === 0 ? 6 : jan4DayOfWeek - 1));

  const daysDiff = Math.floor((thursday.getTime() - monday1.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(daysDiff / 7) + 1;

  return { week: weekNumber, year: isoYear };
};

/**
 * Formatea el key de la semana en formato YYYY-Www.
 */
const formatWeekKey = (date: Date): string => {
  const { year, week } = getISOWeekInfo(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
};

/**
 * Cuántas semanas ISO tiene un año.
 * Un año tiene 53 semanas cuando el 1 de enero es jueves, o cuando es bisiesto
 * y el 1 de enero es miércoles. De lo contrario, tiene 52 semanas.
 */
const isoWeeksInYear = (year: number): number => {
  // El 28 de diciembre siempre está en la última semana ISO del año
  const dec28 = new Date(Date.UTC(year, 11, 28));
  const { week } = getISOWeekInfo(dec28);
  return week;
};

/**
 * Tipo interno para representar una semana con historias en construcción,
 * basado en su lunes UTC.
 */
type WeekEntry<T> = {
  readonly monday: Date;
  readonly stories: readonly T[];
};

/**
 * Agrupar historias por su semana ISO, usando lunes UTC como clave.
 * Ordena historias dentro de cada semana por fecha descendente e id ascendente.
 */
const groupStoriesByWeek = <T>(
  stories: readonly T[],
  getDate: (story: T) => Date,
  getId: (story: T) => string
): readonly WeekEntry<T>[] => {
  const byDateDescThenIdAsc = (one: T, other: T): number => {
    const dateDiff = getDate(other).getTime() - getDate(one).getTime();
    return dateDiff !== 0 ? dateDiff : getId(one).localeCompare(getId(other));
  };

  const weeksMap = new Map<number, { stories: T[]; monday: Date }>();

  for (const story of stories) {
    const monday = getMondayOfWeek(getDate(story));
    const mondayMs = monday.getTime();

    if (!weeksMap.has(mondayMs)) {
      weeksMap.set(mondayMs, { stories: [], monday: new Date(monday) });
    }
    weeksMap.get(mondayMs)!.stories.push(story);
  }

  for (const entry of weeksMap.values()) {
    entry.stories.sort(byDateDescThenIdAsc);
  }

  return Array.from(weeksMap.entries())
    .sort(([mondayAms], [mondayBms]) => mondayAms - mondayBms)
    .map(([, { monday, stories }]) => ({
      monday,
      stories
    }));
};

/**
 * Expandir la secuencia de semanas con huecos.
 * Emite todas las semanas (con historias o vacías) de forma continua,
 * sin colapsar en gaps. El cálculo funciona sobre UTC Mondays de forma
 * continua: los lunes forman una recta sin saltos, cruces de año incluidos.
 */
const expandWithGaps = <T>(
  weeks: readonly WeekEntry<T>[]
): readonly TimelineEntry<T>[] => {
  if (weeks.length === 0) return [];

  const entries: TimelineEntry<T>[] = [];

  for (let i = 0; i < weeks.length; i++) {
    const current = weeks[i];

    if (i > 0) {
      const prev = weeks[i - 1];
      const prevMonday = getMondayOfWeek(prev.monday);
      const currMonday = getMondayOfWeek(current.monday);

      const daysDiff = Math.floor(
        (currMonday.getTime() - prevMonday.getTime()) / (24 * 60 * 60 * 1000)
      );
      const weekCount = daysDiff / 7;
      const gapWeeks = Math.round(weekCount - 1);

      // Emitir todas las semanas faltantes como semanas vacías
      // (aún sin colapsar a TimelineGap). La collapsión ocurre durante
      // la partición por año, para que gaps cruzados sean divididos correctamente.
      for (let w = 1; w <= gapWeeks; w++) {
        const gapMonday = new Date(prevMonday);
        gapMonday.setUTCDate(prevMonday.getUTCDate() + w * 7);
        const gapSunday = new Date(gapMonday);
        gapSunday.setUTCDate(gapMonday.getUTCDate() + 6);

        entries.push({
          kind: "week",
          key: formatWeekKey(gapMonday),
          start: gapMonday,
          end: gapSunday,
          stories: []
        });
      }
    }

    const monday = getMondayOfWeek(current.monday);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    entries.push({
      kind: "week",
      key: formatWeekKey(current.monday),
      start: monday,
      end: sunday,
      stories: current.stories
    });
  }

  return entries;
};

/**
 * Particionar entradas por año ISO y construir el resultado final.
 * Ordena años descendente (más reciente primero), e invierte entradas
 * dentro de cada año al mismo orden descendente.
 * Colapsa consecutivos vacíos que excedan GAP_THRESHOLD en TimelineGap,
 * pero solo dentro de cada año (gaps cruzados de año ya fueron divididos
 * naturalmente por la partición).
 */
const partitionByYearAndBuild = <T>(
  entries: readonly TimelineEntry<T>[]
): readonly TimelineYear<T>[] => {
  const yearMap = new Map<number, TimelineEntry<T>[]>();
  const yearOrder: number[] = [];

  for (const entry of entries) {
    let year: number;
    if (entry.kind === "week") {
      year = getISOWeekInfo(entry.start).year;
    } else {
      const match = entry.key.match(/gap-(\d{4})/);
      year = match ? parseInt(match[1], 10) : 0;
    }

    if (!yearMap.has(year)) {
      yearMap.set(year, []);
      yearOrder.push(year);
    }
    yearMap.get(year)!.push(entry);
  }

  const result: TimelineYear<T>[] = [];
  for (const year of yearOrder.sort((a, b) => b - a)) {
    const yearEntries = yearMap.get(year)!;

    // Colapsar vacíos consecutivos en gaps si superan GAP_THRESHOLD
    const collapsedEntries: TimelineEntry<T>[] = [];
    let emptyWeekSequence: TimelineWeek<T>[] = [];

    for (const entry of yearEntries) {
      if (entry.kind === "week" && entry.stories.length === 0) {
        emptyWeekSequence.push(entry);
      } else {
        // Procesar secuencia acumulada de vacíos
        if (emptyWeekSequence.length > GAP_THRESHOLD) {
          const { week: startWeek } = getISOWeekInfo(emptyWeekSequence[0]!.start);
          const { week: endWeek } = getISOWeekInfo(
            emptyWeekSequence[emptyWeekSequence.length - 1]!.start
          );
          collapsedEntries.push({
            kind: "gap",
            key: `gap-${year}-W${String(startWeek).padStart(2, "0")}-W${String(endWeek).padStart(2, "0")}`,
            weeks: emptyWeekSequence.length
          });
        } else {
          collapsedEntries.push(...emptyWeekSequence);
        }
        emptyWeekSequence = [];

        // Agregar la entrada actual (con historias o gap existente)
        collapsedEntries.push(entry);
      }
    }

    // Procesar los vacíos finales si existen
    if (emptyWeekSequence.length > GAP_THRESHOLD) {
      const { week: startWeek } = getISOWeekInfo(emptyWeekSequence[0]!.start);
      const { week: endWeek } = getISOWeekInfo(
        emptyWeekSequence[emptyWeekSequence.length - 1]!.start
      );
      collapsedEntries.push({
        kind: "gap",
        key: `gap-${year}-W${String(startWeek).padStart(2, "0")}-W${String(endWeek).padStart(2, "0")}`,
        weeks: emptyWeekSequence.length
      });
    } else {
      collapsedEntries.push(...emptyWeekSequence);
    }

    collapsedEntries.reverse();

    const storyCount = collapsedEntries.reduce(
      (sum, entry) => sum + (entry.kind === "week" ? entry.stories.length : 0),
      0
    );

    result.push({
      year,
      entries: collapsedEntries,
      storyCount
    });
  }

  return result;
};

/**
 * Construir la línea de tiempo agrupada por año ISO-8601.
 * Calcula gaps detectando huecos en la secuencia cronológica completa,
 * antes de particionar por año — esto permite que gaps que cruzan el borde
 * de año se expandan correctamente, sin desaparecer.
 */
export const buildTimeline = <T>(
  stories: readonly T[],
  getDate: (story: T) => Date,
  getId: (story: T) => string
): readonly TimelineYear<T>[] => {
  if (stories.length === 0) {
    return [];
  }

  const weekEntries = groupStoriesByWeek(stories, getDate, getId);
  const entriesWithGaps = expandWithGaps(weekEntries);
  return partitionByYearAndBuild(entriesWithGaps);
};
