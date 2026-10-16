import { describe, expect, it } from "vitest";
import {
  countThemes,
  groupByInitial,
  groupByTheme,
  initialAnchor,
  MAX_MOST_COVERED_THEMES,
  mostCoveredThemes,
  normalizeTheme,
  themeInitial
} from "../src/lib/themes";

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

describe("themeInitial", () => {
  it("devuelve la primera letra en mayúscula", () => {
    expect(themeInitial("junin")).toBe("J");
  });

  it("agrupa la vocal tildada con su vocal sin tilde", () => {
    expect(themeInitial("ética")).toBe("E");
  });

  it("conserva la eñe como letra propia", () => {
    expect(themeInitial("ñuñoa")).toBe("Ñ");
  });

  it("junta bajo # lo que no empieza con letra", () => {
    expect(themeInitial("2026")).toBe("#");
  });
});

describe("groupByInitial", () => {
  const themeGroup = (theme: string, storyCount = 1) => ({
    theme,
    stories: Array.from({ length: storyCount }, (_, index) =>
      story(`${theme}-${index}`, [theme])
    )
  });

  const lettersOf = (groups: ReturnType<typeof groupByInitial>) =>
    groups.map((group) => ({
      initial: group.initial,
      themes: group.themes.map((entry) => entry.theme)
    }));

  it("no devuelve letras cuando no hay temas", () => {
    expect(groupByInitial([])).toEqual([]);
  });

  it("reúne los temas por inicial y los ordena alfabéticamente dentro de cada letra", () => {
    const groups = groupByInitial([
      themeGroup("docentes", 3),
      themeGroup("arequipa", 2),
      themeGroup("america-latina")
    ]);

    expect(lettersOf(groups)).toEqual([
      { initial: "A", themes: ["america-latina", "arequipa"] },
      { initial: "D", themes: ["docentes"] }
    ]);
  });

  it("ubica la eñe después de la ene y # al final", () => {
    const groups = groupByInitial([
      themeGroup("2026"),
      themeGroup("ñuñoa"),
      themeGroup("nazca"),
      themeGroup("olmos")
    ]);

    expect(groups.map((group) => group.initial)).toEqual(["N", "Ñ", "O", "#"]);
  });

  it("conserva las historias de cada tema", () => {
    const groups = groupByInitial([themeGroup("junin", 2)]);

    expect(groups[0]?.themes[0]?.stories.map((s) => s.title)).toEqual([
      "junin-0",
      "junin-1"
    ]);
  });
});

describe("countThemes", () => {
  it("usa el singular para un solo tema", () => {
    expect(countThemes(1)).toBe("1 tema");
  });

  it("usa el plural para varios temas", () => {
    expect(countThemes(3)).toBe("3 temas");
  });
});

describe("initialAnchor", () => {
  it("arma el ancla de una letra en minúscula", () => {
    expect(initialAnchor("A")).toBe("letra-a");
  });

  it("conserva la eñe", () => {
    expect(initialAnchor("Ñ")).toBe("letra-ñ");
  });

  it("da un nombre legible al grupo #, que no sirve dentro de un ancla", () => {
    expect(initialAnchor("#")).toBe("letra-otros");
  });
});

describe("mostCoveredThemes", () => {
  const groups = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      theme: `tema-${index}`,
      stories: [story(`Historia ${index}`, [`tema-${index}`])]
    }));

  it("muestra a lo más tres temas", () => {
    expect(MAX_MOST_COVERED_THEMES).toBe(3);
  });

  it("toma los primeros temas en el orden recibido, que ya viene por cantidad", () => {
    expect(mostCoveredThemes(groups(5)).map((group) => group.theme)).toEqual([
      "tema-0",
      "tema-1",
      "tema-2"
    ]);
  });

  it("no devuelve nada cuando no hay más temas que el tope, porque repetiría el quipu", () => {
    expect(mostCoveredThemes(groups(3))).toEqual([]);
  });
});
