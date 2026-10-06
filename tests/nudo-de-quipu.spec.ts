import { describe, it, expect } from "vitest";
import { renderAstroComponent } from "./support/render-astro-component";
import NudoDeQuipu from "../src/components/NudoDeQuipu.astro";

describe("NudoDeQuipu", () => {
  it("cantidad: 0 → CERO ocurrencias de class=\"nudo-de-quipu__hueco\"", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, redondeo: "ninguno" },
    });
    const huecoCount = (html.match(/class="nudo-de-quipu__hueco"/g) ?? []).length;
    expect(huecoCount).toBe(0);
  });

  it("cantidad: 1 → UNA ocurrencia de class=\"nudo-de-quipu__hueco\"", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 1, redondeo: "ninguno" },
    });
    const huecoCount = (html.match(/class="nudo-de-quipu__hueco"/g) ?? []).length;
    expect(huecoCount).toBe(1);
  });

  it("cantidad: 3 → TRES ocurrencias de class=\"nudo-de-quipu__hueco\"", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 3, redondeo: "ninguno" },
    });
    const huecoCount = (html.match(/class="nudo-de-quipu__hueco"/g) ?? []).length;
    expect(huecoCount).toBe(3);
  });

  it("cantidad: 8 → OCHO ocurrencias de class=\"nudo-de-quipu__hueco\" (sin tope)", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 8, redondeo: "ninguno" },
    });
    const huecoCount = (html.match(/class="nudo-de-quipu__hueco"/g) ?? []).length;
    expect(huecoCount).toBe(8);
  });

  it("cantidad: 1 → el único hueco tiene top: 36.25%", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 1, redondeo: "ninguno" },
    });
    expect(html).toContain("top: 36.25%");
  });

  it("cantidad: 3 → los huecos tienen top: 22.083333333333332%, top: 50.41666666666667%, top: 78.75% en ese orden", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 3, redondeo: "ninguno" },
    });
    // Verificar que los tres porcentajes aparecen en el html
    expect(html).toContain("top: 22.083333333333332%");
    expect(html).toContain("top: 50.41666666666667%");
    expect(html).toContain("top: 78.75%");
    // Verificar que aparecen en ese orden
    const idx0 = html.indexOf("top: 22.083333333333332%");
    const idx1 = html.indexOf("top: 50.41666666666667%");
    const idx2 = html.indexOf("top: 78.75%");
    expect(idx0 < idx1 && idx1 < idx2).toBe(true);
  });

  it('redondeo: "arriba" → class="nudo-de-quipu nudo-de-quipu--arriba"', async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, redondeo: "arriba" },
    });
    expect(html).toContain('class="nudo-de-quipu nudo-de-quipu--arriba"');
  });

  it('redondeo: "abajo" → class="nudo-de-quipu nudo-de-quipu--abajo"', async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, redondeo: "abajo" },
    });
    expect(html).toContain('class="nudo-de-quipu nudo-de-quipu--abajo"');
  });

  it('redondeo: "ambos" → class="nudo-de-quipu nudo-de-quipu--ambos"', async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, redondeo: "ambos" },
    });
    expect(html).toContain('class="nudo-de-quipu nudo-de-quipu--ambos"');
  });

  it('redondeo: "ninguno" → class="nudo-de-quipu nudo-de-quipu--ninguno"', async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, redondeo: "ninguno" },
    });
    expect(html).toContain('class="nudo-de-quipu nudo-de-quipu--ninguno"');
  });

  it("aria-hidden=\"true\" siempre presente en el <span> raíz", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 5, redondeo: "ambos" },
    });
    expect(html).toContain('aria-hidden="true"');
  });

  it("el componente NO renderiza ningún <svg>", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 3, redondeo: "arriba" },
    });
    expect(html).not.toContain("<svg");
  });
});
