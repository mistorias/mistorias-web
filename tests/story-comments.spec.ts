import { describe, expect, it } from "vitest";
import { commentsForStory } from "../src/lib/comments/story-comments";

function entry(id: string, story: string, submittedAt: string) {
  return {
    id: `${story}/comentario-${id}`,
    data: {
      story,
      id,
      author: "Rosa",
      text: "Gracias.",
      submittedAt
    }
  };
}

const idOf = (item: { data: { id: string } }) => item.data.id;

describe("commentsForStory", () => {
  it("devuelve solo los comentarios de la historia pedida", () => {
    const entries = [
      entry("aaaaaaaaaaaaaaaa", "historia-a", "2026-11-01T10:00:00-05:00"),
      entry("bbbbbbbbbbbbbbbb", "historia-b", "2026-11-01T11:00:00-05:00"),
      entry("cccccccccccccccc", "historia-a", "2026-11-01T12:00:00-05:00")
    ];

    expect(commentsForStory(entries, "historia-a").map(idOf)).toEqual([
      "aaaaaaaaaaaaaaaa",
      "cccccccccccccccc"
    ]);
  });

  it("ordena del más antiguo al más reciente", () => {
    const entries = [
      entry("3333333333333333", "historia-a", "2026-11-03T10:00:00-05:00"),
      entry("1111111111111111", "historia-a", "2026-11-01T10:00:00-05:00"),
      entry("2222222222222222", "historia-a", "2026-11-02T10:00:00-05:00")
    ];

    expect(commentsForStory(entries, "historia-a").map(idOf)).toEqual([
      "1111111111111111",
      "2222222222222222",
      "3333333333333333"
    ]);
  });

  it("compara instantes y no el texto de la fecha", () => {
    // 23:00 en Lima es 04:00 UTC del día siguiente: llegó después que las 01:00 UTC.
    const entries = [
      entry("bbbbbbbbbbbbbbbb", "historia-a", "2026-11-01T23:00:00-05:00"),
      entry("aaaaaaaaaaaaaaaa", "historia-a", "2026-11-02T01:00:00Z")
    ];

    expect(commentsForStory(entries, "historia-a").map(idOf)).toEqual([
      "aaaaaaaaaaaaaaaa",
      "bbbbbbbbbbbbbbbb"
    ]);
  });

  it("desempata por id para que el orden sea estable entre builds", () => {
    const entries = [
      entry("bbbbbbbbbbbbbbbb", "historia-a", "2026-11-01T10:00:00-05:00"),
      entry("aaaaaaaaaaaaaaaa", "historia-a", "2026-11-01T10:00:00-05:00")
    ];

    expect(commentsForStory(entries, "historia-a").map(idOf)).toEqual([
      "aaaaaaaaaaaaaaaa",
      "bbbbbbbbbbbbbbbb"
    ]);
  });

  it("devuelve una lista vacía si la historia no tiene comentarios", () => {
    expect(commentsForStory([], "historia-a")).toEqual([]);
  });

  it("no modifica la lista que recibe", () => {
    const entries = [
      entry("2222222222222222", "historia-a", "2026-11-02T10:00:00-05:00"),
      entry("1111111111111111", "historia-a", "2026-11-01T10:00:00-05:00")
    ];

    commentsForStory(entries, "historia-a");

    expect(entries.map(idOf)).toEqual(["2222222222222222", "1111111111111111"]);
  });
});
