import { AUTHORSHIP_VALUES, type Authorship } from "./schema";

export type AuthorshipDescription = {
  readonly value: Authorship;
  readonly label: string;
  readonly detail: string;
};

/**
 * Cómo se le cuenta al lector qué hizo la inteligencia artificial.
 *
 * El texto vive acá y no en cada componente porque tiene dos consumidores que
 * deben decir exactamente lo mismo: el pie de cada historia, que muestra el
 * rótulo, y la página «Acerca de», que explica los tres valores. Si divergen,
 * la etiqueta del pie deja de significar lo que el sitio promete.
 */
const DESCRIPTIONS: Readonly<Record<Authorship, AuthorshipDescription>> = {
  "escrito-por-persona": {
    value: "escrito-por-persona",
    label: "Escrito por una persona",
    detail:
      "La inteligencia artificial no tocó el texto: lo escribió, de principio a fin, quien lo firma."
  },
  "editado-con-ia": {
    value: "editado-con-ia",
    label: "Editado con inteligencia artificial",
    detail:
      "Quien firma escribió el cuerpo de la historia. La inteligencia artificial corrigió, conectó ideas y sugirió cambios que esa persona aceptó o descartó."
  },
  "escrito-con-ia": {
    value: "escrito-con-ia",
    label: "Escrito con inteligencia artificial",
    detail:
      "La inteligencia artificial reunió las noticias y redactó. Quien firma definió el encargo, ajustó el texto, revisó las fuentes y decide publicarlo."
  }
};

export const describeAuthorship = (
  authorship: Authorship
): AuthorshipDescription => DESCRIPTIONS[authorship];

/** Las tres descripciones en el orden del esquema, para explicarlas juntas. */
export const authorshipDescriptions = (): readonly AuthorshipDescription[] =>
  AUTHORSHIP_VALUES.map(describeAuthorship);
