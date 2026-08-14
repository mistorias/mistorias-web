/**
 * Agrupación de historias por etiqueta.
 *
 * Se mantiene independiente de las colecciones de Astro —recibe cómo leer las
 * etiquetas de cada historia— para que la lógica se pruebe sin levantar el
 * framework, tal como pide la separación de responsabilidades de
 * docs/STANDARDS.md.
 */

export type GrupoDeEtiqueta<T> = {
  readonly etiqueta: string;
  readonly historias: readonly T[];
};

export const normalizarEtiqueta = (etiqueta: string): string =>
  etiqueta.trim().toLowerCase();

const etiquetasUnicasDe = <T>(
  historia: T,
  obtenerEtiquetas: (historia: T) => readonly string[]
): ReadonlySet<string> =>
  new Set(
    obtenerEtiquetas(historia)
      .map(normalizarEtiqueta)
      .filter((etiqueta) => etiqueta.length > 0)
  );

// Más historias primero, porque el índice de etiquetas existe para mostrar de
// qué habla el sitio; a igual cantidad, alfabético para que el orden no dependa
// del azar del recorrido.
const porRelevancia = <T>(
  uno: GrupoDeEtiqueta<T>,
  otro: GrupoDeEtiqueta<T>
): number =>
  otro.historias.length - uno.historias.length ||
  uno.etiqueta.localeCompare(otro.etiqueta, "es");

export const agruparPorEtiqueta = <T>(
  historias: readonly T[],
  obtenerEtiquetas: (historia: T) => readonly string[]
): readonly GrupoDeEtiqueta<T>[] => {
  const agrupadas = new Map<string, T[]>();

  for (const historia of historias) {
    for (const etiqueta of etiquetasUnicasDe(historia, obtenerEtiquetas)) {
      const grupo = agrupadas.get(etiqueta) ?? [];

      grupo.push(historia);
      agrupadas.set(etiqueta, grupo);
    }
  }

  return [...agrupadas]
    .map(([etiqueta, historiasDelGrupo]) => ({
      etiqueta,
      historias: historiasDelGrupo
    }))
    .sort(porRelevancia);
};
