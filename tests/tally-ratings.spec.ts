import { describe, expect, it } from "vitest";
import {
  ANOMALY_LABEL,
  ANOMALY_THRESHOLD,
  ratingsDelta,
  renderRatingsDelta,
  tallyRatings
} from "../src/lib/ratings/tally-ratings";

const published = ["historia-a", "historia-b"];

const rating = (historia: unknown, calificacion: unknown) => ({
  data: { historia, calificacion }
});

describe("tallyRatings", () => {
  it("cuenta las calificaciones de cada historia publicada", () => {
    const result = tallyRatings(
      [
        rating("historia-b", "5"),
        rating("historia-a", "1"),
        rating("historia-a", "1"),
        rating("historia-a", "4")
      ],
      published
    );

    expect(result).toEqual({
      stories: {
        "historia-a": { "1": 2, "2": 0, "3": 0, "4": 1, "5": 0 },
        "historia-b": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 }
      }
    });
  });

  it("devuelve las historias ordenadas por slug", () => {
    const result = tallyRatings(
      [rating("historia-b", "3"), rating("historia-a", "3")],
      published
    );

    expect(Object.keys(result.stories)).toEqual(["historia-a", "historia-b"]);
  });

  it("ignora las historias que no están publicadas", () => {
    const result = tallyRatings([rating("historia-borrada", "5")], published);

    expect(result).toEqual({ stories: {} });
  });

  it.each(["0", "6", "3.5", "", "cinco", " 3", 3, null, undefined])(
    "ignora %j como calificación",
    (value) => {
      expect(tallyRatings([rating("historia-a", value)], published)).toEqual({
        stories: {}
      });
    }
  );

  it.each([undefined, null, 7, ["historia-a"]])(
    "ignora %j como historia",
    (value) => {
      expect(tallyRatings([rating(value, "5")], published)).toEqual({
        stories: {}
      });
    }
  );

  it("no cuenta una historia que solo tiene envíos inválidos", () => {
    const result = tallyRatings(
      [rating("historia-a", "9"), rating("historia-b", "2")],
      published
    );

    expect(Object.keys(result.stories)).toEqual(["historia-b"]);
  });

  it("devuelve lo mismo si se le dan los mismos envíos dos veces", () => {
    const submissions = [rating("historia-a", "2"), rating("historia-b", "5")];

    expect(tallyRatings(submissions, published)).toEqual(
      tallyRatings(submissions, published)
    );
  });
});

const distributionOf = (total: number) => ({
  "1": 0,
  "2": 0,
  "3": 0,
  "4": 0,
  "5": total
});

describe("ratingsDelta", () => {
  it("fija el umbral de anomalía en 50 calificaciones nuevas por día", () => {
    expect(ANOMALY_THRESHOLD).toBe(50);
  });

  it("lista las calificaciones nuevas por historia, ordenadas", () => {
    const rows = ratingsDelta(
      { stories: { "historia-b": distributionOf(2) } },
      {
        stories: {
          "historia-a": distributionOf(3),
          "historia-b": distributionOf(7)
        }
      }
    );

    expect(rows).toEqual([
      { story: "historia-a", added: 3, total: 3, flagged: false },
      { story: "historia-b", added: 5, total: 7, flagged: false }
    ]);
  });

  it("omite las historias que no cambiaron", () => {
    const same = { stories: { "historia-a": distributionOf(4) } };

    expect(ratingsDelta(same, same)).toEqual([]);
  });

  it("marca la historia con más de 50 calificaciones nuevas", () => {
    const rows = ratingsDelta(
      { stories: { "historia-a": distributionOf(1) } },
      { stories: { "historia-a": distributionOf(52) } }
    );

    expect(rows).toEqual([
      { story: "historia-a", added: 51, total: 52, flagged: true }
    ]);
  });

  it("no marca la historia que suma exactamente 50", () => {
    const rows = ratingsDelta(
      { stories: {} },
      { stories: { "historia-a": distributionOf(50) } }
    );

    expect(rows[0].flagged).toBe(false);
  });

  it("muestra como negativa una historia que perdió calificaciones", () => {
    const rows = ratingsDelta(
      { stories: { "historia-a": distributionOf(8) } },
      { stories: { "historia-a": distributionOf(6) } }
    );

    expect(rows).toEqual([
      { story: "historia-a", added: -2, total: 6, flagged: false }
    ]);
  });

  it("incluye la historia que ya no tiene calificaciones", () => {
    const rows = ratingsDelta(
      { stories: { "historia-a": distributionOf(8) } },
      { stories: {} }
    );

    expect(rows).toEqual([
      { story: "historia-a", added: -8, total: 0, flagged: false }
    ]);
  });
});

describe("renderRatingsDelta", () => {
  it("dice que no hay novedades cuando no hay filas", () => {
    expect(renderRatingsDelta([])).toBe("Sin calificaciones nuevas.");
  });

  it("arma una tabla de Markdown y marca la fila anómala", () => {
    const table = renderRatingsDelta([
      { story: "historia-a", added: 3, total: 9, flagged: false },
      { story: "historia-b", added: 51, total: 60, flagged: true }
    ]);

    expect(table).toBe(
      [
        "| Historia | Nuevas | Total | Aviso |",
        "| --- | ---: | ---: | --- |",
        "| `historia-a` | +3 | 9 |  |",
        `| \`historia-b\` | +51 | 60 | ${ANOMALY_LABEL} |`
      ].join("\n")
    );
    expect(ANOMALY_LABEL).toBe("⚠️ revisar antes de fusionar");
  });

  it("escribe las bajas con su signo", () => {
    const table = renderRatingsDelta([
      { story: "historia-a", added: -2, total: 6, flagged: false }
    ]);

    expect(table).toContain("| `historia-a` | -2 | 6 |  |");
  });
});
