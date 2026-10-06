import { describe, expect, it } from "vitest";
import {
  authorshipDescriptions,
  describeAuthorship
} from "../src/lib/content/authorship";
import { AUTHORSHIP_VALUES } from "../src/lib/content/schema";

describe("describeAuthorship", () => {
  it("describe cada una de las tres etiquetas del esquema", () => {
    for (const value of AUTHORSHIP_VALUES) {
      const descripcion = describeAuthorship(value);

      expect(descripcion.value).toBe(value);
      expect(descripcion.label.length).toBeGreaterThan(0);
      expect(descripcion.detail.length).toBeGreaterThan(0);
    }
  });

  it("distingue las tres con rótulos distintos", () => {
    const rotulos = AUTHORSHIP_VALUES.map(
      (value) => describeAuthorship(value).label
    );

    expect(new Set(rotulos).size).toBe(AUTHORSHIP_VALUES.length);
  });

  it("nombra a la inteligencia artificial sin siglas en el rótulo visible", () => {
    for (const value of AUTHORSHIP_VALUES) {
      expect(describeAuthorship(value).label).not.toMatch(/\bIA\b/);
    }
  });
});

describe("authorshipDescriptions", () => {
  // La página «Acerca de» explica las tres; si el esquema gana una etiqueta y
  // esta lista no, el sitio muestra un rótulo que nunca explicó.
  it("devuelve las tres, en el orden del esquema", () => {
    expect(authorshipDescriptions().map((d) => d.value)).toEqual([
      ...AUTHORSHIP_VALUES
    ]);
  });
});
