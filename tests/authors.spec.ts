import { describe, expect, it } from "vitest";
import {
  authorNameFor,
  buildAuthorNameMap,
  storiesByAuthor
} from "../src/lib/content/authors";

const fichas = [
  { id: "paolo-carrasco", nombre: "Paolo Carrasco" },
  { id: "ana-quispe", nombre: "Ana Quispe" }
];

const nombres = buildAuthorNameMap(
  fichas,
  (ficha) => ficha.id,
  (ficha) => ficha.nombre
);

describe("buildAuthorNameMap", () => {
  it("traduce el id de la ficha al nombre visible", () => {
    expect(authorNameFor(nombres, "paolo-carrasco")).toBe("Paolo Carrasco");
    expect(authorNameFor(nombres, "ana-quispe")).toBe("Ana Quispe");
  });

  it("no inventa nada cuando no hay fichas", () => {
    expect(
      buildAuthorNameMap(
        [],
        (ficha: { id: string }) => ficha.id,
        () => ""
      ).size
    ).toBe(0);
  });
});

describe("authorNameFor", () => {
  // Mostrar el slug donde va el nombre sería un build exitoso publicando algo
  // roto — la misma clase de error silencioso del issue #29.
  it("falla en vez de mostrar el slug cuando falta la ficha", () => {
    expect(() => authorNameFor(nombres, "quien-sea")).toThrow(/quien-sea/);
  });
});

describe("storiesByAuthor", () => {
  const historias = [
    { id: "una", autor: "paolo-carrasco" },
    { id: "otra", autor: "ana-quispe" },
    { id: "tercera", autor: "paolo-carrasco" }
  ];

  it("se queda solo con las historias que firma esa persona", () => {
    expect(
      storiesByAuthor(historias, (h) => h.autor, "paolo-carrasco").map(
        (h) => h.id
      )
    ).toEqual(["una", "tercera"]);
  });

  it("conserva el orden en que llegaron", () => {
    expect(
      storiesByAuthor(historias, (h) => h.autor, "ana-quispe").map((h) => h.id)
    ).toEqual(["otra"]);
  });

  it("devuelve una lista vacía para alguien sin historias", () => {
    expect(storiesByAuthor(historias, (h) => h.autor, "nadie")).toEqual([]);
  });
});
