import { describe, expect, it } from "vitest";
import { fechaLegible, fechaParaAtributo } from "../src/lib/fechas";

describe("fechaLegible", () => {
  it("escribe la fecha en castellano, con el mes en palabras", () => {
    expect(fechaLegible(new Date("2026-08-07"))).toBe("7 de agosto de 2026");
  });

  /*
   * `z.coerce.date()` convierte "2026-08-07" en medianoche UTC. Formateada en la
   * zona horaria del build —Netlify y GitHub Pages no comparten la misma— una
   * zona detrás de UTC mostraría el día anterior. Se fija UTC para que la fecha
   * publicada sea la que escribió la redacción.
   */
  it("mantiene el día publicado sin importar la zona horaria del build", () => {
    const process = globalThis.process;
    const zonaOriginal = process.env.TZ;

    process.env.TZ = "America/Lima";
    expect(fechaLegible(new Date("2026-08-07"))).toBe("7 de agosto de 2026");

    process.env.TZ = zonaOriginal;
  });
});

describe("fechaParaAtributo", () => {
  it("entrega el formato que espera el atributo datetime", () => {
    expect(fechaParaAtributo(new Date("2026-08-07"))).toBe("2026-08-07");
  });
});
