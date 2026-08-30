import { describe, expect, it } from "vitest";
import PlantaDeLibros from "../src/components/PlantaDeLibros.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// El componente no tiene props ni ramas: inyecta el SVG y lo deja listo para
// que el CSS lo pinte. Lo que sí se puede afirmar desde acá es el marcado que
// ese CSS necesita; los tamaños y el `wrap-reverse` viven en un <style> con
// ámbito que la Container API no expone (limitación documentada en CLAUDE.md),
// así que se verifican en navegador.
describe("PlantaDeLibros", () => {
  it("inyecta el dibujo con sus dos clases de tinta", async () => {
    const html = await renderAstroComponent(PlantaDeLibros);

    expect(html).toContain('class="ink-base"');
    expect(html).toContain('class="ink-acento"');
  });

  it("lo oculta de lectores de pantalla por decorativo", async () => {
    const html = await renderAstroComponent(PlantaDeLibros);

    const envoltorio = html.match(/<span class="planta-de-libros"[^>]*>/)?.[0];

    expect(envoltorio).toContain('aria-hidden="true"');
  });

  it("declara el viewBox recortado al dibujo", async () => {
    const html = await renderAstroComponent(PlantaDeLibros);

    // Sin recortar (`0 0 1147 2048`) el lienzo trae 13 % de margen vacío por
    // lado, y la caja del componente dejaría de medir lo que mide el dibujo.
    expect(html).toContain('viewBox="150 99 845 1808"');
  });

  it("no trae ningún color fijo: el tema lo deciden los tokens", async () => {
    const html = await renderAstroComponent(PlantaDeLibros);

    expect(html).not.toMatch(/#[0-9a-f]{3,6}/i);
    expect(html).not.toMatch(/\bfill\s*=\s*"(?!currentColor)/i);
  });
});
