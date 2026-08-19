import { describe, expect, it } from "vitest";
import {
  isDevelopmentTarget,
  resolveDeploymentConfig
} from "../src/lib/deployment";

// El destino decide el origen y la base con que se construye el sitio. Cuando
// un destino desconocido caía en silencio al de por defecto, mistorias.pe se
// publicó con la base de GitHub Pages: sin estilos y con todos sus enlaces
// apuntando a /mistorias-web (issue #29).
describe("resolveDeploymentConfig", () => {
  it("sirve GitHub Pages bajo su base cuando el destino es development", () => {
    expect(resolveDeploymentConfig("development")).toEqual({
      site: "https://mistorias.github.io",
      base: "/mistorias-web"
    });
  });

  it("sirve mistorias.pe desde la raíz cuando el destino es netlify", () => {
    expect(resolveDeploymentConfig("netlify")).toEqual({
      site: "https://mistorias.pe",
      base: "/"
    });
  });

  it("asume el destino de desarrollo cuando no se declara ninguno", () => {
    expect(resolveDeploymentConfig(undefined)).toEqual(
      resolveDeploymentConfig("development")
    );
  });

  it("detiene el build ante un destino desconocido", () => {
    expect(() => resolveDeploymentConfig("netlfiy")).toThrowError(/netlfiy/);
  });

  it("nombra los destinos válidos al detener el build", () => {
    expect(() => resolveDeploymentConfig("produccion")).toThrowError(
      /development, netlify/
    );
  });

  it("trata un destino vacío como desconocido en vez de adivinarlo", () => {
    expect(() => resolveDeploymentConfig("")).toThrowError();
  });
});

// El marcador de "en desarrollo" (issue #28) solo debe encenderse para
// GitHub Pages, nunca para el destino que sirve mistorias.pe.
describe("isDevelopmentTarget", () => {
  it("es desarrollo cuando el destino es development", () => {
    expect(isDevelopmentTarget("development")).toBe(true);
  });

  it("es desarrollo cuando no se declara ningún destino", () => {
    expect(isDevelopmentTarget(undefined)).toBe(true);
  });

  it("no es desarrollo cuando el destino es netlify", () => {
    expect(isDevelopmentTarget("netlify")).toBe(false);
  });

  it("detiene el build ante un destino desconocido, igual que resolveDeploymentConfig", () => {
    expect(() => isDevelopmentTarget("produccion")).toThrowError(/produccion/);
  });
});
