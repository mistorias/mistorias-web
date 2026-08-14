import { describe, expect, it } from "vitest";
import { sortByDateDescending } from "../src/lib/stories";

type TestStory = { readonly title: string; readonly date: Date };

const dateOf = (story: TestStory) => story.date;

describe("sortByDateDescending", () => {
  it("pone primero la historia más reciente", () => {
    const sorted = sortByDateDescending(
      [
        { title: "Antigua", date: new Date("2026-01-15") },
        { title: "Reciente", date: new Date("2026-08-07") }
      ],
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

    sortByDateDescending(originals, dateOf);

    expect(originals.map((story) => story.title)).toEqual([
      "Antigua",
      "Reciente"
    ]);
  });

  it("devuelve una lista vacía cuando no hay historias", () => {
    expect(sortByDateDescending([], dateOf)).toEqual([]);
  });
});
