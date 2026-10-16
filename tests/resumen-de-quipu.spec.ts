import { describe, expect, it } from "vitest";
import { renderAstroComponent } from "./support/render-astro-component";
import ResumenDeQuipu from "../src/components/ResumenDeQuipu.astro";

describe("ResumenDeQuipu", () => {
  it("rotula la cuerda con su título como h2 y su conteo dentro del summary", async () => {
    const html = await renderAstroComponent(ResumenDeQuipu, {
      props: { titulo: "2026", cuenta: "3 historias" }
    });

    expect(html).toMatch(/^<summary[^>]*class="quipu-resumen"/);
    expect(html).toMatch(/<h2[^>]*>2026<\/h2>/);
    expect(html).toMatch(/class="quipu-resumen__cuenta"[^>]*>3 historias</);
  });

  it("oculta la greca a lectores de pantalla porque solo adorna", async () => {
    const html = await renderAstroComponent(ResumenDeQuipu, {
      props: { titulo: "A", cuenta: "1 tema" }
    });

    expect(html).toMatch(/class="quipu-resumen__greca"[^>]*aria-hidden="true"/);
  });
});
