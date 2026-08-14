import { describe, expect, it } from "vitest";
import { dateForAttribute, readableDate } from "../src/lib/dates";

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
