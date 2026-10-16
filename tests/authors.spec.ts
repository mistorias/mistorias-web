import { describe, expect, it } from "vitest";
import {
  authorNameFor,
  buildAuthorNameMap,
  storiesByAuthor
} from "../src/lib/content/authors";

const profiles = [
  { id: "mateo-salazar", name: "Mateo Salazar" },
  { id: "ana-quispe", name: "Ana Quispe" }
];

const names = buildAuthorNameMap(
  profiles,
  (profile) => profile.id,
  (profile) => profile.name
);

describe("buildAuthorNameMap", () => {
  it("traduce el id de la ficha al nombre visible", () => {
    expect(authorNameFor(names, "mateo-salazar")).toBe("Mateo Salazar");
    expect(authorNameFor(names, "ana-quispe")).toBe("Ana Quispe");
  });

  it("no inventa nada cuando no hay fichas", () => {
    expect(
      buildAuthorNameMap(
        [],
        (profile: { id: string }) => profile.id,
        () => ""
      ).size
    ).toBe(0);
  });
});

describe("authorNameFor", () => {
  // Mostrar el slug donde va el nombre sería un build exitoso publicando algo
  // roto — la misma clase de error silencioso del issue #29.
  it("falla en vez de mostrar el slug cuando falta la ficha", () => {
    expect(() => authorNameFor(names, "quien-sea")).toThrow(/quien-sea/);
  });
});

describe("storiesByAuthor", () => {
  const stories = [
    { id: "una", author: "mateo-salazar" },
    { id: "otra", author: "ana-quispe" },
    { id: "tercera", author: "mateo-salazar" }
  ];

  it("se queda solo con las historias que firma esa persona", () => {
    expect(
      storiesByAuthor(stories, (story) => story.author, "mateo-salazar").map(
        (story) => story.id
      )
    ).toEqual(["una", "tercera"]);
  });

  it("conserva el orden en que llegaron", () => {
    expect(
      storiesByAuthor(stories, (story) => story.author, "ana-quispe").map((story) => story.id)
    ).toEqual(["otra"]);
  });

  it("devuelve una lista vacía para alguien sin historias", () => {
    expect(storiesByAuthor(stories, (story) => story.author, "nadie")).toEqual([]);
  });
});
