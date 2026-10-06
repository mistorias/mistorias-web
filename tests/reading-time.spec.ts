import { describe, expect, it } from "vitest";
import { compactReadingTime, fullReadingTime } from "../src/lib/reading-time";

describe("compactReadingTime", () => {
  it("escribe los minutos con el apóstrofo de la portada", () => {
    expect(compactReadingTime(5)).toBe("5'");
  });

  it("no cambia con un solo minuto", () => {
    expect(compactReadingTime(1)).toBe("1'");
  });
});

describe("fullReadingTime", () => {
  it("escribe los minutos en plural", () => {
    expect(fullReadingTime(5)).toBe("5 minutos");
  });

  it("escribe un minuto en singular", () => {
    expect(fullReadingTime(1)).toBe("1 minuto");
  });
});
