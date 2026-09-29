/**
 * Presentación del tiempo de lectura de una historia.
 *
 * El valor (`readingTimeMinutes`) no se calcula acá: lo calcula y verifica el
 * pipeline de mistorias-contenido, para que sea el mismo dato para todos los
 * clientes de ese repositorio. Este módulo solo lo escribe.
 */

/** Forma comprimida de las tarjetas: `5'`. */
export const compactReadingTime = (minutes: number): string => `${minutes}'`;

/** Forma completa de la página de la historia: `1 minuto`, `5 minutos`. */
export const fullReadingTime = (minutes: number): string =>
  `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
