import { describe, expect, it } from "vitest";
import { dateForAttribute, readableDate, readableWeekRange } from "../src/lib/dates";

describe("readableDate", () => {
  it("escribe la fecha en castellano, con el mes en palabras", () => {
    expect(readableDate(new Date("2026-08-07"))).toBe("7 de agosto de 2026");
  });

  /*
   * `z.coerce.date()` convierte "2026-08-07" en medianoche UTC. Formateada en la
   * zona horaria del build —Netlify y GitHub Pages no comparten la misma— una
   * zona detrás de UTC mostraría el día anterior. Se fija UTC para que la fecha
   * publicada sea la que escribió la redacción.
   */
  it("mantiene el día publicado sin importar la zona horaria del build", () => {
    const process = globalThis.process;
    const originalTimeZone = process.env.TZ;

    process.env.TZ = "America/Lima";
    expect(readableDate(new Date("2026-08-07"))).toBe("7 de agosto de 2026");

    process.env.TZ = originalTimeZone;
  });
});

describe("dateForAttribute", () => {
  it("entrega el formato que espera el atributo datetime", () => {
    expect(dateForAttribute(new Date("2026-08-07"))).toBe("2026-08-07");
  });
});

describe("readableWeekRange", () => {
  it("rotula una semana dentro del mismo mes", () => {
    expect(
      readableWeekRange(new Date("2026-09-08"), new Date("2026-09-14"))
    ).toBe("del 8 al 14 de setiembre de 2026");
  });

  it("rotula una semana que cruza mes distinto, mismo año", () => {
    expect(
      readableWeekRange(new Date("2026-08-31"), new Date("2026-09-06"))
    ).toBe("del 31 de agosto al 6 de setiembre de 2026");
  });

  it("rotula una semana que cruza año distinto", () => {
    expect(
      readableWeekRange(new Date("2026-12-28"), new Date("2027-01-03"))
    ).toBe("del 28 de diciembre de 2026 al 3 de enero de 2027");
  });

  it("mantiene la zona horaria correcta sin importar la zona del build", () => {
    const process = globalThis.process;
    const originalTimeZone = process.env.TZ;

    process.env.TZ = "America/Lima";
    expect(
      readableWeekRange(new Date("2026-01-05T00:00:00Z"), new Date("2026-01-11T23:59:59Z"))
    ).toContain("5");

    process.env.TZ = originalTimeZone;
  });
});
