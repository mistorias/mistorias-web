import { describe, expect, it } from "vitest";
import PromedioDeCalificaciones from "../src/components/PromedioDeCalificaciones.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// La Container API renderiza en Node: se verifica el marcado. Cómo se ve en
// cada tema y ancho se comprueba en navegador.
describe("PromedioDeCalificaciones", () => {
  it("dice el promedio con un decimal y la cantidad, en texto", async () => {
    const html = await renderAstroComponent(PromedioDeCalificaciones, {
      props: { distribucion: { "1": 1, "2": 2, "3": 4, "4": 10, "5": 10 } }
    });

    expect(html).toContain("4.0");
    expect(html).toContain("de 5");
    expect(html).toContain("27 calificaciones");
  });

  it("escribe el promedio con punto decimal", async () => {
    const html = await renderAstroComponent(PromedioDeCalificaciones, {
      props: { distribucion: { "1": 0, "2": 0, "3": 0, "4": 3, "5": 2 } }
    });

    expect(html).toContain("4.4");
    expect(html).not.toContain("4,4");
  });

  it("no muestra nada con menos de 5 calificaciones", async () => {
    const html = await renderAstroComponent(PromedioDeCalificaciones, {
      props: { distribucion: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 4 } }
    });

    expect(html).not.toContain("calificaciones");
    expect(html).not.toContain("<p");
  });

  it("no muestra nada si la historia no tiene conteo", async () => {
    const html = await renderAstroComponent(PromedioDeCalificaciones, {
      props: {}
    });

    expect(html.trim()).toBe("");
  });
});
