import { describe, it, expect } from "vitest";
import { renderAstroComponent } from "./support/render-astro-component";
import NudoDeQuipu from "../src/components/NudoDeQuipu.astro";

describe("NudoDeQuipu", () => {
  it("cantidad: 0 → renderiza la cuerda pero sin huecos en la máscara", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, alto: 32, redondeo: "ninguno", id: "test-1" },
    });
    expect(html).toContain("<svg");
    const blackFills = (html.match(/fill="black"/g) ?? []).length;
    expect(blackFills).toBe(0);
  });

  it("cantidad: 1 → exactamente un rect con fill='black'", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 1, alto: 32, redondeo: "ninguno", id: "test-2" },
    });
    const blackFills = (html.match(/fill="black"/g) ?? []).length;
    expect(blackFills).toBe(1);
  });

  it("cantidad: 3 → exactamente tres rects con fill='black'", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 3, alto: 32, redondeo: "ninguno", id: "test-3" },
    });
    const blackFills = (html.match(/fill="black"/g) ?? []).length;
    expect(blackFills).toBe(3);
  });

  it("cantidad: 8 → exactamente ocho rects con fill='black' (sin cap en 5)", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 8, alto: 32, redondeo: "ninguno", id: "test-4" },
    });
    const blackFills = (html.match(/fill="black"/g) ?? []).length;
    expect(blackFills).toBe(8);
  });

  it("alto: 32 → viewBox='0 0 20 32'", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 1, alto: 32, redondeo: "ninguno", id: "test-5a" },
    });
    expect(html).toContain('viewBox="0 0 20 32"');
  });

  it("alto: 128 → viewBox='0 0 20 128'", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 1, alto: 128, redondeo: "ninguno", id: "test-5b" },
    });
    expect(html).toContain('viewBox="0 0 20 128"');
  });

  it("redondeo: 'ambos' → exactamente 4 ocurrencias de 'A ' en el contorno", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, alto: 32, redondeo: "ambos", id: "test-6" },
    });
    const arcMatches = html.match(/d="[^"]*A [^"]*"/);
    expect(arcMatches).toBeTruthy();
    const arcCount = (arcMatches?.[0].match(/A /g) ?? []).length;
    expect(arcCount).toBe(4);
  });

  it("redondeo: 'arriba' → exactamente 2 ocurrencias de 'A ' en el contorno", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, alto: 32, redondeo: "arriba", id: "test-7" },
    });
    const arcMatches = html.match(/d="[^"]*A [^"]*"/);
    expect(arcMatches).toBeTruthy();
    const arcCount = (arcMatches?.[0].match(/A /g) ?? []).length;
    expect(arcCount).toBe(2);
  });

  it("redondeo: 'abajo' → exactamente 2 ocurrencias de 'A ' en el contorno", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, alto: 32, redondeo: "abajo", id: "test-8" },
    });
    const arcMatches = html.match(/d="[^"]*A [^"]*"/);
    expect(arcMatches).toBeTruthy();
    const arcCount = (arcMatches?.[0].match(/A /g) ?? []).length;
    expect(arcCount).toBe(2);
  });

  it("redondeo: 'ninguno' → 0 ocurrencias de 'A ' en el contorno", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, alto: 32, redondeo: "ninguno", id: "test-9" },
    });
    const arcMatches = html.match(/d="[^"]*A [^"]*"/);
    const arcCount = arcMatches ? (arcMatches[0].match(/A /g) ?? []).length : 0;
    expect(arcCount).toBe(0);
  });

  it("id determina el id de la máscara: id='2026-W36' → <mask id='nudo-2026-W36'> y mask='url(#nudo-2026-W36)'", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, alto: 32, redondeo: "ninguno", id: "2026-W36" },
    });
    expect(html).toContain('id="nudo-2026-W36"');
    expect(html).toContain('mask="url(#nudo-2026-W36)"');
  });

  it("aria-hidden='true' siempre presente en el <svg> raíz", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0, alto: 32, redondeo: "ninguno", id: "test-11" },
    });
    expect(html).toContain('aria-hidden="true"');
  });

  it("cada rect de nudo (fill='black') lleva rx='1'", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 3, alto: 32, redondeo: "ninguno", id: "test-12" },
    });
    const rectMatches = html.match(/<rect[^>]*fill="black"[^>]*>/g) ?? [];
    expect(rectMatches.length).toBe(3);
    rectMatches.forEach((rect) => {
      expect(rect).toContain('rx="1"');
    });
  });
});
