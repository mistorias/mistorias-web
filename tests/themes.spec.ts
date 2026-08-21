import { describe, expect, it } from "vitest";
import { groupByTheme, normalizeTheme } from "../src/lib/themes";

type TestStory = {
  readonly title: string;
  readonly themes: readonly string[];
};

const themesOf = (story: TestStory) => story.themes;

const story = (title: string, themes: readonly string[]): TestStory => ({
  title,
  themes
});

describe("normalizeTheme", () => {
  it("baja a minúsculas y recorta los espacios", () => {
    expect(normalizeTheme("  Inteligencia-Artificial ")).toBe(
      "inteligencia-artificial"
    );
  });
});

describe("groupByTheme", () => {
  it("no devuelve grupos cuando no hay historias", () => {
    expect(groupByTheme([], themesOf)).toEqual([]);
  });

  it("reúne bajo un mismo tema las historias que lo comparten", () => {
    const groups = groupByTheme(
      [story("Primera", ["junin"]), story("Segunda", ["junin"])],
      themesOf
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.theme).toBe("junin");
    expect(groups[0]?.stories.map((s) => s.title)).toEqual([
      "Primera",
      "Segunda"
    ]);
  });

  it("ordena los grupos por cantidad de historias, de mayor a menor", () => {
    const groups = groupByTheme(
      [story("Primera", ["docentes", "junin"]), story("Segunda", ["docentes"])],
      themesOf
    );

    expect(groups.map((group) => group.theme)).toEqual(["docentes", "junin"]);
  });

  it("desempata alfabéticamente cuando dos temas tienen la misma cantidad", () => {
    const groups = groupByTheme(
      [story("Única", ["junin", "docentes", "america-latina"])],
      themesOf
    );

    expect(groups.map((group) => group.theme)).toEqual([
      "america-latina",
      "docentes",
      "junin"
    ]);
  });

  it("conserva el orden en que llegaron las historias dentro de cada grupo", () => {
    const groups = groupByTheme(
      [story("Reciente", ["docentes"]), story("Antigua", ["docentes"])],
      themesOf
    );

    expect(groups[0]?.stories.map((s) => s.title)).toEqual([
      "Reciente",
      "Antigua"
    ]);
  });

  it("trata como un solo tema las variantes de mayúsculas y espacios", () => {
    const groups = groupByTheme(
      [story("Primera", ["Junin"]), story("Segunda", [" junin "])],
      themesOf
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.theme).toBe("junin");
  });

  it("descarta los temas vacíos", () => {
    const groups = groupByTheme([story("Primera", ["", "   ", "junin"])], themesOf);

    expect(groups.map((group) => group.theme)).toEqual(["junin"]);
  });

  it("no repite una historia que declara dos veces el mismo tema", () => {
    const groups = groupByTheme([story("Primera", ["junin", "Junin"])], themesOf);

    expect(groups[0]?.stories).toHaveLength(1);
  });
});
