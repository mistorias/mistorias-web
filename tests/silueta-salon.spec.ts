import { describe, expect, it } from "vitest";
import SiluetaSalon from "../src/components/SiluetaSalon.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// El componente no tiene props ni ramas: solo arma la URL de la máscara.
// La proporción declarada en su <style> vive en una hoja aparte que el
// Container API no expone en renderToString (limitación documentada en
// ADR 0011), así que no es observable desde acá.
describe("SiluetaSalon", () => {
  it("apunta la máscara al SVG, no al PNG que reemplazó", async () => {
    const html = await renderAstroComponent(SiluetaSalon);

    expect(html).toContain("silueta-salon.svg");
    expect(html).not.toContain("silueta-salon.png");
  });

  it("oculta ambos bloques de lectores de pantalla", async () => {
    const html = await renderAstroComponent(SiluetaSalon);

    const maskDiv = html.match(/<div class="silueta-salon"[^>]*>/)?.[0] ?? "";
    const rellenoDiv =
      html.match(/<div class="silueta-salon__relleno"[^>]*>/)?.[0] ?? "";

    expect(maskDiv).toContain('aria-hidden="true"');
    expect(rellenoDiv).toContain('aria-hidden="true"');
  });
});
