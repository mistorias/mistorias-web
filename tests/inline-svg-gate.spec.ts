import { describe, expect, it } from "vitest";
import { assertInlineSvgIsThemeReady } from "../src/lib/assets/inline-svg-gate";

// El resto del contrato (viewBox, color fijo en atributo, <style>, <script>,
// manejadores, foreignObject, referencias externas) se ejercita a través del
// símbolo de marca en `symbol-gate.spec.ts`, que llama a esta misma función.
// Acá van los dos casos que ese archivo no cubre.
describe("assertInlineSvgIsThemeReady", () => {
  it("acepta un SVG que deja el color a clases que pinta el componente", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path class="ink-base" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertInlineSvgIsThemeReady(svg, "dibujo.svg")).not.toThrow();
  });

  // SVGO escribe así el color al desarmar un <style> incrustado. Rompe el tema
  // igual que `fill="#012c75"`, solo que por otra puerta.
  it("rechaza un color fijo declarado dentro de un atributo style", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path style="fill:#012c75" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertInlineSvgIsThemeReady(svg, "dibujo.svg")).toThrow(
      /currentColor/
    );
  });

  it("no confunde un style sin color con un color fijo", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path style="mix-blend-mode:multiply" class="ink-base" d="M0,0 L10,0 L10,10 L0,10 Z" /></svg>';

    expect(() => assertInlineSvgIsThemeReady(svg, "dibujo.svg")).not.toThrow();
  });
});
