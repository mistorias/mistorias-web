import { describe, expect, it } from "vitest";
import {
  MIN_RATINGS_TO_SHOW,
  ratingSummary
} from "../src/lib/ratings/rating-summary";

describe("ratingSummary", () => {
  it("pide al menos 5 calificaciones para mostrar el promedio", () => {
    expect(MIN_RATINGS_TO_SHOW).toBe(5);
  });

  it("calcula la cantidad y el promedio", () => {
    expect(
      ratingSummary({ "1": 0, "2": 0, "3": 0, "4": 3, "5": 2 })
    ).toEqual({ count: 5, average: 4.4 });
  });

  it("pondera cada calificación por su valor", () => {
    expect(
      ratingSummary({ "1": 2, "2": 0, "3": 0, "4": 0, "5": 3 })
    ).toEqual({ count: 5, average: 3.4 });
  });

  it("no muestra nada con menos del mínimo", () => {
    expect(
      ratingSummary({ "1": 0, "2": 0, "3": 0, "4": 0, "5": 4 })
    ).toBeNull();
  });

  it("no muestra nada si la historia no tiene conteo", () => {
    expect(ratingSummary(undefined)).toBeNull();
  });
});
