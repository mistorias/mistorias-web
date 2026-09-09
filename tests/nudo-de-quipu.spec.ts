import { describe, it, expect } from "vitest";
import { renderAstroComponent } from "./support/render-astro-component";
import NudoDeQuipu from "../src/components/NudoDeQuipu.astro";

describe("NudoDeQuipu", () => {
  it("cantidad: 1 → renderiza exactamente una <ellipse>", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 1 },
    });
    const ellipseCount = (html.match(/<ellipse/g) ?? []).length;
    expect(ellipseCount).toBe(1);
  });

  it("cantidad: 3 → renderiza exactamente tres <ellipse>", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 3 },
    });
    const ellipseCount = (html.match(/<ellipse/g) ?? []).length;
    expect(ellipseCount).toBe(3);
  });

  it("cantidad: 5 → renderiza exactamente cinco <ellipse>", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 5 },
    });
    const ellipseCount = (html.match(/<ellipse/g) ?? []).length;
    expect(ellipseCount).toBe(5);
  });

  it("cantidad: 8 (sobre el tope visual) → renderiza exactamente cinco <ellipse>", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 8 },
    });
    const ellipseCount = (html.match(/<ellipse/g) ?? []).length;
    expect(ellipseCount).toBe(5);
  });

  it("cantidad: 0 → no renderiza <svg>", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 0 },
    });
    expect(html).not.toContain("<svg");
  });

  it("viewBox escala con la cantidad: cantidad: 1 → viewBox='0 0 24 16'", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 1 },
    });
    expect(html).toContain('viewBox="0 0 24 16"');
  });

  it("viewBox escala con la cantidad: cantidad: 3 → viewBox='0 0 24 48'", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 3 },
    });
    expect(html).toContain('viewBox="0 0 24 48"');
  });

  it("el <svg> lleva aria-hidden='true' cuando cantidad > 0", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 2 },
    });
    expect(html).toContain('aria-hidden="true"');
  });

  it("el <svg> lleva fill='currentColor' en el elemento raíz", async () => {
    const html = await renderAstroComponent(NudoDeQuipu, {
      props: { cantidad: 1 },
    });
    expect(html).toContain('fill="currentColor"');
  });
});
