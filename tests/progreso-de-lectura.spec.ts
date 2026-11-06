import { describe, expect, it } from "vitest";
import ProgresoDeLectura from "../src/components/ProgresoDeLectura.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// La Container API renderiza en Node: se verifica el marcado. Que el cordón
// avance con el scroll se comprueba en navegador.
describe("ProgresoDeLectura", () => {
  it("envuelve el texto de la historia que recibe", async () => {
    const html = await renderAstroComponent(ProgresoDeLectura, {
      slots: { default: "<p>Había una vez</p>" },
    });

    expect(html).toContain("<p>Había una vez</p>");
  });

  it("oculta el cordón a los lectores de pantalla", async () => {
    const html = await renderAstroComponent(ProgresoDeLectura, {
      slots: { default: "<p>Texto</p>" },
    });

    expect(html).toMatch(
      /<span class="progreso-de-lectura__cordon[^"]*" aria-hidden="true"/
    );
  });

  it("no agrega nada que tome el foco", async () => {
    const html = await renderAstroComponent(ProgresoDeLectura, {
      slots: { default: "<p>Texto</p>" },
    });

    expect(html).not.toMatch(/<a |<button|tabindex/);
  });
});
