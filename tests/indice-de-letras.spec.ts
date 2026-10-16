import { describe, expect, it } from "vitest";
import { renderAstroComponent } from "./support/render-astro-component";
import IndiceDeLetras from "../src/components/IndiceDeLetras.astro";

const render = (letras: readonly string[]) =>
  renderAstroComponent(IndiceDeLetras, { props: { letras } });

describe("IndiceDeLetras", () => {
  it("es una navegación con nombre propio para el lector de pantalla", async () => {
    const html = await render(["A"]);

    expect(html).toMatch(/<nav[^>]*aria-label="Saltar a una letra"/);
  });

  it("no se oculta a lectores de pantalla, porque sus enlaces reciben foco", async () => {
    const html = await render(["A"]);

    expect(html).not.toContain("aria-hidden");
  });

  it("enlaza cada letra a su ancla, en el orden recibido", async () => {
    const html = await render(["A", "Ñ", "#"]);

    const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(
      (match) => match[1]
    );

    expect(anchors).toEqual(["letra-a", "letra-ñ", "letra-otros"]);
  });

  it("rotula cada enlace con su letra", async () => {
    const html = await render(["B"]);

    expect(html).toMatch(/<a[^>]*>B<\/a>/);
  });

  it("pone el contenido antes del índice, para que el lector oiga primero los temas", async () => {
    const html = await renderAstroComponent(IndiceDeLetras, {
      props: { letras: ["A"] },
      slots: { default: "<p>contenido de temas</p>" }
    });

    expect(html.indexOf("contenido de temas")).toBeGreaterThan(-1);
    expect(html.indexOf("contenido de temas")).toBeLessThan(html.indexOf("<nav"));
  });
});
