import { describe, expect, it } from "vitest";
import ListaTemas from "../src/components/ListaTemas.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// El componente arma enlaces por tema usando el helper themeRoute(),
// y fija el aria-label de la lista a partir de la prop (issue #33).
describe("ListaTemas", () => {
  it("renderiza un <li><a> por cada tema con su href de themeRoute", async () => {
    const html = await renderAstroComponent(ListaTemas, {
      props: {
        temas: ["educacion", "salud"],
        temaTextual: "Temas de prueba",
      },
    });

    expect(html).toContain("educacion");
    expect(html).toContain("salud");
    expect(html).toContain('/temas/educacion');
    expect(html).toContain('/temas/salud');
  });

  it("fija el aria-label de la lista con temaTextual", async () => {
    const html = await renderAstroComponent(ListaTemas, {
      props: {
        temas: ["educacion"],
        temaTextual: "Temas de Historia",
      },
    });

    expect(html).toMatch(/aria-label="Temas de Historia"/);
  });
});
