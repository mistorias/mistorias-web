import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseRatingsFile } from "../src/lib/ratings/ratings-file";

const distribution = { "1": 0, "2": 1, "3": 2, "4": 5, "5": 9 };

describe("parseRatingsFile", () => {
  it("acepta el conteo por historia del 1 al 5", () => {
    const file = parseRatingsFile(
      JSON.stringify({ stories: { "una-historia": distribution } })
    );

    expect(file.stories["una-historia"]).toEqual(distribution);
  });

  it("acepta el archivo sin historias", () => {
    expect(parseRatingsFile('{ "stories": {} }').stories).toEqual({});
  });

  it("rechaza lo que no es JSON", () => {
    expect(() => parseRatingsFile("{ roto")).toThrow(/no es JSON válido/);
  });

  it("rechaza un campo de más en la raíz, como un timestamp", () => {
    expect(() =>
      parseRatingsFile(
        JSON.stringify({ generatedAt: "2026-11-08", stories: {} })
      )
    ).toThrow(/no cumple el esquema/);
  });

  it("rechaza una calificación fuera del 1 al 5", () => {
    expect(() =>
      parseRatingsFile(
        JSON.stringify({ stories: { "a": { ...distribution, "6": 1 } } })
      )
    ).toThrow(/no cumple el esquema/);
  });

  it("rechaza una distribución a la que le falta un valor", () => {
    expect(() =>
      parseRatingsFile(
        JSON.stringify({ stories: { "a": { "1": 0, "2": 0, "3": 0, "4": 0 } } })
      )
    ).toThrow(/no cumple el esquema/);
  });

  it.each([-1, 1.5, "3"])("rechaza %j como cantidad", (count) => {
    expect(() =>
      parseRatingsFile(
        JSON.stringify({ stories: { "a": { ...distribution, "3": count } } })
      )
    ).toThrow(/no cumple el esquema/);
  });

  it("rechaza un slug que no es un id de historia", () => {
    expect(() =>
      parseRatingsFile(
        JSON.stringify({ stories: { "../Mala Ruta": distribution } })
      )
    ).toThrow(/no cumple el esquema/);
  });

  it("el data/ratings.json del repositorio cumple el esquema", () => {
    const contents = readFileSync("data/ratings.json", "utf8");

    expect(() => parseRatingsFile(contents)).not.toThrow();
  });
});
