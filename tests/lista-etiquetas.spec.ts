import { describe, expect, it } from "vitest";
import ListaEtiquetas from "../src/components/ListaEtiquetas.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// El componente arma enlaces por etiqueta usando el helper tagRoute(),
// y fija el aria-label de la lista a partir de la prop (issue #33).
describe("ListaEtiquetas", () => {
  it("renderiza un <li><a> por cada etiqueta con su href de tagRoute", async () => {
    const html = await renderAstroComponent(ListaEtiquetas, {
      props: {
        etiquetas: ["educacion", "salud"],
        etiquetaTextual: "Etiquetas de prueba",
      },
    });

    expect(html).toContain("educacion");
    expect(html).toContain("salud");
    expect(html).toContain('/etiquetas/educacion');
    expect(html).toContain('/etiquetas/salud');
  });

  it("fija el aria-label de la lista con etiquetaTextual", async () => {
    const html = await renderAstroComponent(ListaEtiquetas, {
      props: {
        etiquetas: ["educacion"],
        etiquetaTextual: "Etiquetas de Historia",
      },
    });

    expect(html).toMatch(/aria-label="Etiquetas de Historia"/);
  });
});
