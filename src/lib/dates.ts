/**
 * Presentación de fechas de publicación.
 *
 * Se fuerza la zona horaria UTC porque `z.coerce.date()` interpreta el
 * `yyyy-mm-dd` del frontmatter como medianoche UTC: formateado en la zona del
 * build —que no es la misma en Netlify y en GitHub Pages— una zona detrás de UTC
 * publicaría el día anterior al que escribió la redacción.
 */

const READABLE_FORMAT = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
});

export const readableDate = (date: Date): string =>
  READABLE_FORMAT.format(date);

export const dateForAttribute = (date: Date): string =>
  date.toISOString().slice(0, 10);

export const readableWeekRange = (start: Date, end: Date): string => {
  const dayFormatter = new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    timeZone: "UTC"
  });

  const monthFormatter = new Intl.DateTimeFormat("es-PE", {
    month: "long",
    timeZone: "UTC"
  });

  const yearFormatter = new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    timeZone: "UTC"
  });

  const startDay = dayFormatter.format(start);
  const endDay = dayFormatter.format(end);

  const startYear = yearFormatter.format(start);
  const endYear = yearFormatter.format(end);

  const startMonth = monthFormatter.format(start).toLowerCase();
  const endMonth = monthFormatter.format(end).toLowerCase();

  // Mismo mes y mismo año
  if (startMonth === endMonth && startYear === endYear) {
    return `del ${startDay} al ${endDay} de ${endMonth} de ${endYear}`;
  }

  // Mes distinto, mismo año
  if (startYear === endYear) {
    return `del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${endYear}`;
  }

  // Año distinto
  return `del ${startDay} de ${startMonth} de ${startYear} al ${endDay} de ${endMonth} de ${endYear}`;
};
