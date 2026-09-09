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

  // Agrupar por año
  const yearMap = new Map<number, typeof weekInfoList>();
  const yearKeysOrder: { year: number; date: Date }[] = [];

  for (const info of weekInfoList) {
    if (!yearMap.has(info.year)) {
      yearMap.set(info.year, []);
      yearKeysOrder.push({ year: info.year, date: info.date });
    }
    yearMap.get(info.year)!.push(info);
  }

  // Procesar cada año
  const result: TimelineYear<T>[] = [];
  for (const { year } of yearKeysOrder.sort((a, b) => b.year - a.year)) {
    const yearWeeks = yearMap.get(year)!;

    // Ordenar semanas del año: ascendente (de antigua a reciente)
    yearWeeks.sort((a, b) => a.week - b.week);

    // Construir entradas con huecos
    const entries: TimelineEntry<T>[] = [];
    for (let i = 0; i < yearWeeks.length; i++) {
      const info = yearWeeks[i];

      // Si no es la primera semana, detectar hueco
      if (i > 0) {
        const prevInfo = yearWeeks[i - 1];
        const weekGap = info.week - prevInfo.week - 1;

        if (weekGap > 0) {
          if (weekGap <= GAP_THRESHOLD) {
            // Emitir TimelineWeek vacíos para cada semana faltante
            for (let w = prevInfo.week + 1; w < info.week; w++) {
              // Calcular una fecha en la semana vacía
              const gapDate = new Date(prevInfo.date);
              gapDate.setUTCDate(prevInfo.date.getUTCDate() + (w - prevInfo.week) * 7);

              const monday = getMondayOfWeek(gapDate);
              const sunday = new Date(monday);
              sunday.setUTCDate(monday.getUTCDate() + 6);

              entries.push({
                kind: "week",
                key: formatWeekKey(gapDate),
                start: monday,
                end: sunday,
                stories: [] as readonly T[]
              });
            }
          } else {
            // Emitir un TimelineGap
            entries.push({
              kind: "gap",
              key: gapKey(prevInfo.week + 1, info.week - 1),
              weeks: weekGap
            });
          }
        }
      }

      // Agregar la semana con historias
      const monday = getMondayOfWeek(info.date);
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);

      entries.push({
        kind: "week",
        key: info.key,
        start: monday,
        end: sunday,
        stories: weeksMap.get(info.key)!
      });
    }

    // Invertir para que sea de más reciente a más antiguo
    entries.reverse();

    // Contar historias
    const storyCount = entries.reduce(
      (sum, entry) => sum + (entry.kind === "week" ? entry.stories.length : 0),
      0
    );

    result.push({
      year,
      entries,
      storyCount
    });
  }

  return result;
};
