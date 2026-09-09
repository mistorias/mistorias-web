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
 * horaria del build.
 */
const getMondayOfWeek = (date: Date): Date => {
  const day = date.getUTCDay();
  // En UTC, Sunday es 0, Monday es 1. Si day es 0 (domingo), restar 6 días.
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

  // Obtener el jueves de la semana (determina el año ISO)
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() + (4 - (dayOfWeek === 0 ? 7 : dayOfWeek)));

  const isoYear = thursday.getUTCFullYear();

  // El 4 de enero siempre está en la semana 1 del año ISO
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay();

  // Obtener el lunes de la semana que contiene el 4 de enero
  const monday1 = new Date(jan4);
  monday1.setUTCDate(4 - (jan4DayOfWeek === 0 ? 6 : jan4DayOfWeek - 1));

  // Calcular diferencia de días entre el jueves y el lunes de la semana 1
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
 * Genera un key para un hueco entre semanas.
 */
const gapKey = (startWeek: number, endWeek: number): string =>
  `gap-w${startWeek}-w${endWeek}`;

/**
 * Convierte una semana ISO a su fecha de lunes UTC, para aritmetica
 * comparativa de semanas.
 */
const getMondayOfISOWeek = (year: number, week: number): Date => {
  // El 4 de enero siempre está en la semana 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay();

  // Lunes de la semana 1 del año ISO
  const monday1 = new Date(jan4);
  monday1.setUTCDate(4 - (jan4DayOfWeek === 0 ? 6 : jan4DayOfWeek - 1));

  // Semana deseada = lunes de W1 + (week - 1) * 7 días
  const targetMonday = new Date(monday1);
  targetMonday.setUTCDate(monday1.getUTCDate() + (week - 1) * 7);

  return targetMonday;
};

/**
 * Calcula la cantidad de semanas completas entre dos fechas en UTC.
 * Ambas deben ser lunes UTC para resultados correctos.
 */
const weeksBetweenMondays = (earlierMonday: Date, laterMonday: Date): number => {
  const daysDiff = Math.floor(
    (laterMonday.getTime() - earlierMonday.getTime()) / (24 * 60 * 60 * 1000)
  );
  return daysDiff / 7;
};

export const buildTimeline = <T>(
  stories: readonly T[],
  getDate: (story: T) => Date,
  getId: (story: T) => string
): readonly TimelineYear<T>[] => {
  if (stories.length === 0) {
    return [];
  }

  // Agrupar historias por semana
  const weeksMap = new Map<string, T[]>();
  const weekInfoList: { key: string; date: Date; week: number; year: number }[] = [];

  for (const story of stories) {
    const date = getDate(story);
    const key = formatWeekKey(date);
    const isoInfo = getISOWeekInfo(date);

    if (!weeksMap.has(key)) {
      weeksMap.set(key, []);
      weekInfoList.push({
        key,
        date,
        week: isoInfo.week,
        year: isoInfo.year
      });
    }

    weeksMap.get(key)!.push(story);
  }

  // Ordenar historias dentro de cada semana: descendente por fecha, ascendente por id
  const byDateDescThenIdAsc = (one: T, other: T): number => {
    const dateDiff = getDate(other).getTime() - getDate(one).getTime();
    return dateDiff !== 0 ? dateDiff : getId(one).localeCompare(getId(other));
  };

  for (const week of weeksMap.values()) {
    week.sort(byDateDescThenIdAsc);
  }

  // Ordenar semanas cronológicamente (de antigua a reciente)
  weekInfoList.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.week - b.week;
  });

  // Construir entradas completas en orden cronológico, detectando huecos globales
  type EntryWithYearWeek = TimelineEntry<T> & { year: number; week: number };
  const allEntriesChronological: EntryWithYearWeek[] = [];

  for (let i = 0; i < weekInfoList.length; i++) {
    const info = weekInfoList[i];

    // Detectar hueco entre esta semana y la anterior
    if (i > 0) {
      const prevInfo = weekInfoList[i - 1];

      // Calcular diferencia de semanas entre prevInfo y info
      const prevMonday = getMondayOfISOWeek(prevInfo.year, prevInfo.week);
      const currMonday = getMondayOfISOWeek(info.year, info.week);
      const weekGap = weeksBetweenMondays(prevMonday, currMonday) - 1;

      if (weekGap > 0) {
        // Hemos encontrado un hueco. Ahora lo procesamos secuencialmente,
        // semana por semana, dividiendo en el borde de año según lo requiera.
        let gapYear = prevInfo.year;
        let gapWeek = prevInfo.week + 1;

        // Semanas totales en el hueco
        let weeksProcessed = 0;

        while (weeksProcessed < weekGap) {
          // Averigua cuántas semanas del hueco están en gapYear
          const lastWeekOfYear = 52; // ISO permite W01-W53, pero simplificamos
          const weeksRemainingInYear = lastWeekOfYear - gapWeek + 1;
          const weeksInThisYear = Math.min(
            weeksRemainingInYear,
            weekGap - weeksProcessed
          );

          // Semanas del siguiente año ISO (si la próxima semana del hueco es W01)
          let nextGapYear = gapYear;
          let nextGapWeek = gapWeek + weeksInThisYear;
          if (nextGapWeek > lastWeekOfYear) {
            nextGapYear = gapYear + 1;
            nextGapWeek = 1;
          }

          // Re-evaluar este segmento del hueco contra GAP_THRESHOLD
          if (weeksInThisYear <= GAP_THRESHOLD) {
            // Emitir semanas vacías
            for (let w = gapWeek; w < gapWeek + weeksInThisYear; w++) {
              const gapDate = getMondayOfISOWeek(gapYear, w);
              const sunday = new Date(gapDate);
              sunday.setUTCDate(gapDate.getUTCDate() + 6);

              (allEntriesChronological as TimelineEntry<T>[]).push({
                kind: "week",
                key: `${gapYear}-W${String(w).padStart(2, "0")}`,
                start: gapDate,
                end: sunday,
                stories: [] as readonly T[]
              });
              // Propagar año y semana para seguimiento (atributos no-export)
              (allEntriesChronological[allEntriesChronological.length - 1] as any).year = gapYear;
              (allEntriesChronological[allEntriesChronological.length - 1] as any).week = w;
            }
          } else {
            // Emitir un gap colapsado
            (allEntriesChronological as TimelineEntry<T>[]).push({
              kind: "gap",
              key: `gap-w${gapWeek}-w${gapWeek + weeksInThisYear - 1}`,
              weeks: weeksInThisYear
            });
            // Propagar año para seguimiento
            (allEntriesChronological[allEntriesChronological.length - 1] as any).year = gapYear;
          }

          weeksProcessed += weeksInThisYear;
          gapYear = nextGapYear;
          gapWeek = nextGapWeek;
        }
      }
    }

    // Agregar la semana con historias
    const monday = getMondayOfWeek(info.date);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    (allEntriesChronological as TimelineEntry<T>[]).push({
      kind: "week",
      key: info.key,
      start: monday,
      end: sunday,
      stories: weeksMap.get(info.key)!
    });
    (allEntriesChronological[allEntriesChronological.length - 1] as any).year = info.year;
    (allEntriesChronological[allEntriesChronological.length - 1] as any).week = info.week;
  }

  // Agrupar por año ISO y construir resultado
  const yearMap = new Map<number, EntryWithYearWeek[]>();
  const yearOrder: number[] = [];

  for (const entry of allEntriesChronological) {
    const year = (entry as any).year;
    if (!yearMap.has(year)) {
      yearMap.set(year, []);
      yearOrder.push(year);
    }
    yearMap.get(year)!.push(entry);
  }

  // Invertir cada año a orden descendente (más reciente primero) y construir resultado
  const result: TimelineYear<T>[] = [];
  for (const year of yearOrder.sort((a, b) => b - a)) {
    const yearEntries = yearMap.get(year)!;

    // Invertir para que sea de más reciente a más antiguo
    yearEntries.reverse();

    // Contar historias
    const storyCount = yearEntries.reduce(
      (sum, entry) => sum + (entry.kind === "week" ? entry.stories.length : 0),
      0
    );

    result.push({
      year,
      entries: yearEntries,
      storyCount
    });
  }

  return result;
};
