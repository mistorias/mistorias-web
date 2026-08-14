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
