import { describe, expect, it } from "vitest";
import packageJson from "../package.json" with { type: "json" };
import { FALLBACK_VERSION, resolveSiteVersion } from "../src/lib/version";

// La versión que se muestra en "Acerca de" (issue #106) sale del tag del
// release cuando lo hay, y del `version` de `package.json` cuando no. Lo que
// nunca debe pasar es que la página invente un tag que no existe.
describe("resolveSiteVersion", () => {
  it("muestra el tag del release cuando el build viene de uno", () => {
    expect(resolveSiteVersion("v1.2.3")).toBe("v1.2.3");
  });

  it("ignora los espacios alrededor del tag", () => {
    expect(resolveSiteVersion("  v1.2.3\n")).toBe("v1.2.3");
  });

  it("cae a la versión de package.json cuando no hay tag", () => {
    expect(resolveSiteVersion(undefined)).toBe(FALLBACK_VERSION);
  });

  // El workflow de Netlify pasa cadena vacía cuando se dispara a mano desde
  // una rama: no hay tag que mostrar, así que vale lo mismo que no recibir
  // nada.
  it("cae a la versión de package.json cuando el tag llega vacío", () => {
    expect(resolveSiteVersion("")).toBe(FALLBACK_VERSION);
    expect(resolveSiteVersion("   ")).toBe(FALLBACK_VERSION);
  });
});

describe("FALLBACK_VERSION", () => {
  // Se compara contra el propio package.json, no contra un literal: así subir
  // la versión no rompe este test.
  it("es la versión de package.json con el prefijo v", () => {
    expect(FALLBACK_VERSION).toBe(`v${packageJson.version}`);
  });
});
