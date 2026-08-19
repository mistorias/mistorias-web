import { describe, expect, it } from "vitest";
import { resolveWordmark } from "../src/lib/brand/wordmark";

// La palabra del logotipo debe seguir siendo "Mistorias" en producción y
// convertirse en una palabra aleatoria de 9 letras (no deducible) en
// desarrollo, siempre la misma dentro de un mismo build (issue #28).
describe("resolveWordmark", () => {
  it("es la palabra real en el destino netlify", () => {
    expect(resolveWordmark("netlify")).toBe("Mistorias");
  });

  it("es una palabra de 9 letras con la primera en mayúscula en desarrollo", () => {
    expect(resolveWordmark("development")).toMatch(/^[A-Z][a-z]{8}$/);
  });

  it("no coincide con la palabra real en desarrollo", () => {
    expect(resolveWordmark("development")).not.toBe("Mistorias");
  });

  it("devuelve la misma palabra en llamadas sucesivas dentro del mismo build", () => {
    expect(resolveWordmark("development")).toBe(resolveWordmark("development"));
  });

  it("detiene el build ante un destino desconocido, igual que resolveDeploymentConfig", () => {
    expect(() => resolveWordmark("produccion")).toThrowError(/produccion/);
  });
});
