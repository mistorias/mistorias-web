import { describe, expect, it } from "vitest";
import { groupByTag, normalizeTag } from "../src/lib/tags";

type TestStory = {
  readonly title: string;
  readonly tags: readonly string[];
};

const tagsOf = (story: TestStory) => story.tags;

const story = (title: string, tags: readonly string[]): TestStory => ({
  title,
  tags
});

describe("normalizeTag", () => {
  it("baja a minúsculas y recorta los espacios", () => {
    expect(normalizeTag("  Inteligencia-Artificial ")).toBe(
      "inteligencia-artificial"
    );
  });
});

describe("groupByTag", () => {
  it("no devuelve grupos cuando no hay historias", () => {
    expect(groupByTag([], tagsOf)).toEqual([]);
  });

  it("reúne bajo una misma etiqueta las historias que la comparten", () => {
    const groups = groupByTag(
      [story("Primera", ["junin"]), story("Segunda", ["junin"])],
      tagsOf
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.tag).toBe("junin");
    expect(groups[0]?.stories.map((s) => s.title)).toEqual([
      "Primera",
      "Segunda"
    ]);
  });

  it("ordena los grupos por cantidad de historias, de mayor a menor", () => {
    const groups = groupByTag(
      [story("Primera", ["docentes", "junin"]), story("Segunda", ["docentes"])],
      tagsOf
    );

    expect(groups.map((group) => group.tag)).toEqual(["docentes", "junin"]);
  });

  it("desempata alfabéticamente cuando dos etiquetas tienen la misma cantidad", () => {
    const groups = groupByTag(
      [story("Única", ["junin", "docentes", "america-latina"])],
      tagsOf
    );

    expect(groups.map((group) => group.tag)).toEqual([
      "america-latina",
      "docentes",
      "junin"
    ]);
  });

  it("conserva el orden en que llegaron las historias dentro de cada grupo", () => {
    const groups = groupByTag(
      [story("Reciente", ["docentes"]), story("Antigua", ["docentes"])],
      tagsOf
    );

    expect(groups[0]?.stories.map((s) => s.title)).toEqual([
      "Reciente",
      "Antigua"
    ]);
  });

  it("trata como una sola etiqueta las variantes de mayúsculas y espacios", () => {
    const groups = groupByTag(
      [story("Primera", ["Junin"]), story("Segunda", [" junin "])],
      tagsOf
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.tag).toBe("junin");
  });

  it("descarta las etiquetas vacías", () => {
    const groups = groupByTag([story("Primera", ["", "   ", "junin"])], tagsOf);

    expect(groups.map((group) => group.tag)).toEqual(["junin"]);
  });

  it("no repite una historia que declara dos veces la misma etiqueta", () => {
    const groups = groupByTag([story("Primera", ["junin", "Junin"])], tagsOf);

    expect(groups[0]?.stories).toHaveLength(1);
  });
});
