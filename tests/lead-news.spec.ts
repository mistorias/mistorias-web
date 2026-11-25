import { describe, expect, it } from "vitest";
import { findLeadNewsTitle } from "../src/lib/content/lead-news";

// mistorias-redes-sociales arma «Noticia de la semana: <título>» con la
// primera noticia de la historia (issue #264). El título es el primer texto en
// negrita bajo `## Noticias principales`, escriba quien escriba la sección como
// párrafos o como lista.
describe("findLeadNewsTitle", () => {
  it("toma el primer texto en negrita de una sección escrita en párrafos", () => {
    const body = [
      "## La historia",
      "",
      "Texto de la historia.",
      "",
      "## Noticias principales",
      "",
      "**Un crédito suplementario para educación.** El Minedu anuncia.",
      "",
      "**Otra noticia.** Más texto."
    ].join("\n");

    expect(findLeadNewsTitle(body)).toBe(
      "Un crédito suplementario para educación."
    );
  });

  it("toma el primer texto en negrita de una sección escrita como lista", () => {
    const body = [
      "## Noticias principales",
      "",
      "- **Perú retrocede en PISA 2025**: obtuvo 382 puntos.",
      "- **Otra noticia.** Más texto."
    ].join("\n");

    expect(findLeadNewsTitle(body)).toBe("Perú retrocede en PISA 2025");
  });

  it("ignora la negrita que aparece antes de la sección", () => {
    const body = [
      "## La historia",
      "",
      "Ximena dijo **algo importante**.",
      "",
      "## Noticias principales",
      "",
      "**La noticia.** Texto."
    ].join("\n");

    expect(findLeadNewsTitle(body)).toBe("La noticia.");
  });

  it("no busca más allá de la sección siguiente", () => {
    const body = [
      "## Noticias principales",
      "",
      "Sin negritas esta semana.",
      "",
      "## Contexto",
      "",
      "**Esto no es una noticia.**"
    ].join("\n");

    expect(findLeadNewsTitle(body)).toBeUndefined();
  });

  it("no devuelve nada si la historia no trae la sección", () => {
    expect(findLeadNewsTitle("## La historia\n\n**Negrita.**")).toBeUndefined();
  });
});
