import { describe, expect, it } from "vitest";
import ComentariosDeLectores from "../src/components/ComentariosDeLectores.astro";
import { buildCommentFixture } from "./support/comment-fixture";
import { renderAstroComponent } from "./support/render-astro-component";

function render(comentarios: ReturnType<typeof buildCommentFixture>[]) {
  return renderAstroComponent(ComentariosDeLectores, { props: { comentarios } });
}

describe("ComentariosDeLectores", () => {
  it("no renderiza nada si la historia no tiene comentarios", async () => {
    const html = await render([]);

    expect(html.trim()).toBe("");
  });

  it("abre con el título de la sección", async () => {
    const html = await render([buildCommentFixture()]);

    expect(html).toContain("<h2");
    expect(html).toContain("Lo que dicen quienes la leyeron");
  });

  it("muestra cada comentario con su texto, su autor y su fecha en una lista ordenada", async () => {
    const html = await render([
      buildCommentFixture({ id: "aaaaaaaaaaaaaaaa", author: "Rosa Quispe", text: "Primero." }),
      buildCommentFixture({
        id: "bbbbbbbbbbbbbbbb",
        author: "Luis Paredes",
        text: "Segundo.",
        submittedAt: "2026-11-03T09:00:00-05:00"
      })
    ]);

    expect(html).toContain("<ol");
    expect(html.match(/<figure/g)).toHaveLength(2);
    expect(html).toContain("<blockquote");
    expect(html).toContain("Primero.");
    expect(html).toContain("Rosa Quispe");
    expect(html).toContain('datetime="2026-11-02"');
    expect(html).toContain("2 de noviembre de 2026");
    expect(html.indexOf("Primero.")).toBeLessThan(html.indexOf("Segundo."));
    expect(html).toContain("Luis Paredes");
  });

  it("escapa el HTML del texto y del autor", async () => {
    const html = await render([
      buildCommentFixture({
        author: "<b>Mala</b>",
        text: "<script>alert(1)</script><img src=x onerror=alert(2)>"
      })
    ]);

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<b>Mala");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;b&gt;Mala&lt;/b&gt;");
  });

  it("no convierte los enlaces ni el Markdown del texto", async () => {
    const html = await render([
      buildCommentFixture({ text: "Mira https://ejemplo.pe y **esto** [x](https://y.pe)" })
    ]);

    expect(html).not.toContain("<a ");
    expect(html).not.toContain("<strong");
    expect(html).toContain("https://ejemplo.pe y **esto** [x](https://y.pe)");
  });

  it("conserva los saltos de línea del texto", async () => {
    const html = await render([buildCommentFixture({ text: "Línea uno.\nLínea dos." })]);

    expect(html).toContain("Línea uno.\nLínea dos.");
  });
});
