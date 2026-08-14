import { describe, expect, it } from "vitest";
import vitestConfig from "../vitest.config";

// El control de cobertura vive en la configuración de Vitest, así que estos
// tests cuidan que siga ahí: si alguien apaga la cobertura o baja el umbral,
// el pipeline dejaría de bloquear en silencio y la pérdida de cobertura recién
// se notaría cuando ya ocurrió (issue #23).

const coverage = vitestConfig.test?.coverage;

const thresholds =
  coverage && "thresholds" in coverage ? coverage.thresholds : undefined;

const metricas = ["lines", "statements", "functions", "branches"] as const;

const reporters = [coverage?.reporter ?? []].flat(2);

describe("control de cobertura", () => {
  it("mide la cobertura en cada corrida de tests", () => {
    expect(coverage?.enabled).toBe(true);
  });

  it("exige más de 85% en cada métrica", () => {
    for (const metrica of metricas) {
      expect(thresholds?.[metrica]).toBeGreaterThan(85);
    }
  });

  it("muestra en la salida la cobertura obtenida", () => {
    expect(reporters).toContain("text");
  });
});
