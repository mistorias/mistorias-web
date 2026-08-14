import { describe, expect, it } from "vitest";
import { configuracionDeDespliegue } from "../src/lib/despliegue";

// El destino decide el origen y la base con que se construye el sitio. Cuando
// un destino desconocido caía en silencio al de por defecto, mistorias.pe se
// publicó con la base de GitHub Pages: sin estilos y con todos sus enlaces
// apuntando a /mistorias-web (issue #29).
describe("configuracionDeDespliegue", () => {
  it("sirve GitHub Pages bajo su base cuando el destino es development", () => {
    expect(configuracionDeDespliegue("development")).toEqual({
      site: "https://mistorias.github.io",
      base: "/mistorias-web"
    });
  });

  it("sirve mistorias.pe desde la raíz cuando el destino es netlify", () => {
    expect(configuracionDeDespliegue("netlify")).toEqual({
      site: "https://mistorias.pe",
      base: "/"
    });
  });

  it("asume el destino de desarrollo cuando no se declara ninguno", () => {
    expect(configuracionDeDespliegue(undefined)).toEqual(
      configuracionDeDespliegue("development")
    );
  });

  it("detiene el build ante un destino desconocido", () => {
    expect(() => configuracionDeDespliegue("netlfiy")).toThrowError(
      /netlfiy/
    );
  });

  it("nombra los destinos válidos al detener el build", () => {
    expect(() => configuracionDeDespliegue("produccion")).toThrowError(
      /development, netlify/
    );
  });

  it("trata un destino vacío como desconocido en vez de adivinarlo", () => {
    expect(() => configuracionDeDespliegue("")).toThrowError();
  });
});
