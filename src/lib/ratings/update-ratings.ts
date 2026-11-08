// Extensiones `.ts` explícitas: ver la nota en tally-ratings.ts.
import { parseRatingsFile, serializeRatingsFile } from "./ratings-file.ts";
import {
  ANOMALY_LABEL,
  ratingsDelta,
  renderRatingsDelta,
  tallyRatings,
  type RatingsDeltaRow,
  type Submission
} from "./tally-ratings.ts";

export type RatingsUpdate = {
  /** El texto nuevo de `data/ratings.json`. */
  contents: string;
  changed: boolean;
  rows: RatingsDeltaRow[];
};

/**
 * Recuenta todas las calificaciones y decide si el archivo cambia. Netlify
 * devuelve todos los envíos de siempre, así que cada corrida es un recuento
 * completo y no una suma: repetirla con los mismos datos da el mismo archivo.
 */
export function updateRatings(input: {
  previousContents: string;
  submissions: readonly Submission[];
  publishedStoryIds: readonly string[];
}): RatingsUpdate {
  const previous = parseRatingsFile(input.previousContents);
  const next = tallyRatings(input.submissions, input.publishedStoryIds);
  const contents = serializeRatingsFile(next);

  return {
    contents,
    changed: contents !== input.previousContents,
    rows: ratingsDelta(previous, next)
  };
}

/** La descripción del PR diario, con las secciones de la plantilla que aplican. */
export function buildRatingsPullRequestBody(
  rows: readonly RatingsDeltaRow[]
): string {
  const warning = rows.some((row) => row.flagged)
    ? `> ${ANOMALY_LABEL}: alguna historia recibió muchas más calificaciones de las normales en un día. Compara con el panel de Netlify antes de fusionar; si no es creíble, cierra este PR y el promedio publicado no cambia.\n\n`
    : "";

  return `${warning}## Qué

\`data/ratings.json\` se actualiza con el conteo de calificaciones de Netlify Forms.

## Por qué

El promedio que muestra cada historia sale de ese archivo ([ADR 0037](https://github.com/mistorias/mistorias-web/blob/main/docs/adr/0037-promedio-de-calificaciones-con-conteo-diario.md)). No hay identidad de por medio, así que una persona revisa el cambio antes de que se publique.

## Cómo verificar

- [x] \`pnpm ratings\` terminó sin error (Netlify respondió y la forma de los envíos fue la esperada)
- [ ] La tabla de abajo es creíble para el día

${renderRatingsDelta(rows)}

Fusionar este PR a \`main\` publica en GitHub Pages. Mistorias.pe se publica aparte, con un tag.

---
_Abierto por el workflow \`Actualizar calificaciones\`._
`;
}
