import { describe, expect, it } from "vitest";
import {
  buildRatingsPullRequestBody,
  updateRatings
} from "../src/lib/ratings/update-ratings";

const published = ["historia-a", "historia-b"];
const emptyFile = '{\n  "stories": {}\n}\n';

const submissions = [
  { data: { historia: "historia-b", calificacion: "4" } },
  { data: { historia: "historia-a", calificacion: "5" } },
  { data: { historia: "historia-a", calificacion: "5" } },
  { data: { historia: "despublicada", calificacion: "5" } },
  { data: { historia: "historia-a", calificacion: "9" } }
];

describe("updateRatings", () => {
  it("escribe el conteo y dice que hubo cambios", () => {
    const result = updateRatings({
      previousContents: emptyFile,
      submissions,
      publishedStoryIds: published
    });

    expect(result.changed).toBe(true);
    expect(result.contents).toContain('"historia-a": {');
    expect(result.rows).toEqual([
      { story: "historia-a", added: 2, total: 2, flagged: false },
      { story: "historia-b", added: 1, total: 1, flagged: false }
    ]);
  });

  it("dos corridas seguidas dejan el archivo idéntico y sin cambios", () => {
    const first = updateRatings({
      previousContents: emptyFile,
      submissions,
      publishedStoryIds: published
    });
    const second = updateRatings({
      previousContents: first.contents,
      submissions,
      publishedStoryIds: published
    });

    expect(second.contents).toBe(first.contents);
    expect(second.changed).toBe(false);
    expect(second.rows).toEqual([]);
  });

  it("no depende del orden en que llegan los envíos", () => {
    const forward = updateRatings({
      previousContents: emptyFile,
      submissions,
      publishedStoryIds: published
    });
    const backward = updateRatings({
      previousContents: emptyFile,
      submissions: [...submissions].reverse(),
      publishedStoryIds: published
    });

    expect(backward.contents).toBe(forward.contents);
  });

  it("sin envíos deja el archivo vacío igual a como estaba", () => {
    const result = updateRatings({
      previousContents: emptyFile,
      submissions: [],
      publishedStoryIds: published
    });

    expect(result.changed).toBe(false);
    expect(result.contents).toBe(emptyFile);
  });

  it("falla si el archivo anterior no cumple el esquema", () => {
    expect(() =>
      updateRatings({
        previousContents: "{}",
        submissions,
        publishedStoryIds: published
      })
    ).toThrow(/no cumple el esquema/);
  });
});

describe("buildRatingsPullRequestBody", () => {
  it("incluye la tabla y las secciones de la plantilla", () => {
    const body = buildRatingsPullRequestBody([
      { story: "historia-a", added: 2, total: 2, flagged: false }
    ]);

    expect(body).toContain("## Qué");
    expect(body).toContain("## Por qué");
    expect(body).toContain("## Cómo verificar");
    expect(body).toContain("| `historia-a` | +2 | 2 |  |");
    expect(body).toContain("_Abierto por el workflow `Actualizar calificaciones`._");
    expect(body).not.toContain("⚠️");
  });

  it("avisa arriba cuando alguna historia salta más de lo normal", () => {
    const body = buildRatingsPullRequestBody([
      { story: "historia-a", added: 80, total: 80, flagged: true }
    ]);

    expect(body).toContain("⚠️ revisar antes de fusionar");
    expect(body.indexOf("⚠️")).toBeLessThan(body.indexOf("## Qué"));
  });
});
