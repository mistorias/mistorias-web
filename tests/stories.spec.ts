import { describe, expect, it } from "vitest";
import {
  countStories,
  limitPreviousStories,
  MAX_PREVIOUS_STORIES,
  sortByDateDescending
} from "../src/lib/stories";

type TestStory = { readonly title: string; readonly date: Date };

const idOf = (story: TestStory) => story.title;
const dateOf = (story: TestStory) => story.date;

describe("sortByDateDescending", () => {
  it("pone primero la historia más reciente", () => {
    const sorted = sortByDateDescending(
      [
        { title: "Antigua", date: new Date("2026-01-15") },
        { title: "Reciente", date: new Date("2026-08-07") }
      ],
      idOf,
      dateOf
    );

    expect(sorted.map((story) => story.title)).toEqual([
      "Reciente",
      "Antigua"
    ]);
  });

  it("no altera el arreglo que recibe", () => {
    const originals = [
      { title: "Antigua", date: new Date("2026-01-15") },
      { title: "Reciente", date: new Date("2026-08-07") }
    ];

    sortByDateDescending(originals, idOf, dateOf);

    expect(originals.map((story) => story.title)).toEqual([
      "Antigua",
      "Reciente"
    ]);
  });

  it("desempata por id cuando dos historias comparten fecha", () => {
    const sorted = sortByDateDescending(
      [
        { title: "a-primera", date: new Date("2026-10-09") },
        { title: "b-segunda", date: new Date("2026-10-09") }
      ],
      idOf,
      dateOf
    );

    expect(sorted.map(idOf)).toEqual(["b-segunda", "a-primera"]);
  });

  // La destacada de la portada y el destino de `/ultima` tienen que ser la
  // misma historia (issue #170): el desempate por id es el inverso del de
  // `orderStoriesByDate`, y `tests/story-order.spec.ts` fija con estos mismos
  // tres datos el orden cronológico. Los dos órdenes esperados están escritos
  // a mano, sin calcular uno con el otro.
  it("ordena de la más reciente a la más antigua, con empates por id descendente", () => {
    const oldest = { title: "antigua", date: new Date("2026-07-24") };
    const tieA = { title: "a-empate", date: new Date("2026-10-09") };
    const tieB = { title: "b-empate", date: new Date("2026-10-09") };

    const sorted = sortByDateDescending(
      [tieB, oldest, tieA],
      idOf,
      dateOf
    );

    expect(sorted.map(idOf)).toEqual(["b-empate", "a-empate", "antigua"]);
  });

  it("devuelve una lista vacía cuando no hay historias", () => {
    expect(sortByDateDescending([], idOf, dateOf)).toEqual([]);
  });
});

describe("limitPreviousStories", () => {
  const titles = (stories: readonly TestStory[]) =>
    stories.map((story) => story.title);

  const storiesUpTo = (count: number): TestStory[] =>
    Array.from({ length: count }, (_, index) => ({
      title: `Historia ${index + 1}`,
      date: new Date(2026, 0, index + 1)
    }));

  it("devuelve una lista vacía cuando no hay historias anteriores", () => {
    expect(limitPreviousStories([])).toEqual([]);
  });

  it("devuelve todas las historias cuando hay menos del límite", () => {
    const stories = storiesUpTo(MAX_PREVIOUS_STORIES - 1);

    expect(titles(limitPreviousStories(stories))).toEqual(titles(stories));
  });

  it("devuelve todas las historias cuando hay exactamente el límite", () => {
    const stories = storiesUpTo(MAX_PREVIOUS_STORIES);

    expect(titles(limitPreviousStories(stories))).toEqual(titles(stories));
  });

  it("recorta a las primeras del límite cuando hay más, preservando el orden", () => {
    const stories = storiesUpTo(MAX_PREVIOUS_STORIES + 2);

    expect(titles(limitPreviousStories(stories))).toEqual(
      titles(stories.slice(0, MAX_PREVIOUS_STORIES))
    );
  });

  it("no altera el arreglo que recibe", () => {
    const stories = storiesUpTo(MAX_PREVIOUS_STORIES + 2);
    const originalTitles = titles(stories);

    limitPreviousStories(stories);

    expect(titles(stories)).toEqual(originalTitles);
  });
});

describe("countStories", () => {
  it("usa el singular para una sola historia", () => {
    expect(countStories(1)).toBe("1 historia");
  });

  it("usa el plural para cero o varias historias", () => {
    expect(countStories(0)).toBe("0 historias");
    expect(countStories(4)).toBe("4 historias");
  });
});
