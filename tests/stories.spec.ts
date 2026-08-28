import { describe, expect, it } from "vitest";
import {
  limitPreviousStories,
  MAX_PREVIOUS_STORIES,
  sortByDateDescending
} from "../src/lib/stories";

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
