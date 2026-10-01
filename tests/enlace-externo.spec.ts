import { describe, expect, it } from "vitest";
import EnlaceExterno from "../src/components/EnlaceExterno.astro";
import { renderAstroComponent } from "./support/render-astro-component";
import { visibleText } from "./support/visible-text";

// La Container API renderiza en Node: se verifica el marcado. Que el aviso
// aparezca al instante y solo con puntero se comprueba en navegador
// (issue #148, ADR 0022).
const renderLink = (
  props: Record<string, unknown> = {},
  content = "Una fuente"
) =>
  renderAstroComponent(EnlaceExterno, {
    props: { href: "https://example.org/fuente", ...props },
    slots: { default: content },
  });

describe("EnlaceExterno", () => {
  it("abre el destino en una pestaña nueva, sin dar acceso a la ventana de origen", async () => {
    const html = await renderLink();

    expect(html).toContain('href="https://example.org/fuente"');
    expect(html).toContain('target="_blank"');
    expect(html).toMatch(/rel="[^"]*\bnoopener\b[^"]*"/);
    expect(html).toMatch(/rel="[^"]*\bnoreferrer\b[^"]*"/);
  });

  it("suma los valores de rel que pida quien lo usa, sin perder los de seguridad", async () => {
    const html = await renderLink({ rel: "me" });

    expect(html).toMatch(/rel="[^"]*\bme\b[^"]*"/);
    expect(html).toMatch(/rel="[^"]*\bnoopener\b[^"]*"/);
  });

  it("muestra el contenido que recibe", async () => {
    const html = await renderLink({}, "Informe PISA");

    expect(visibleText(html)).toContain("Informe PISA");
  });

  it("avisa a lector de pantalla que se abre una pestaña nueva", async () => {
    const html = await renderLink();

    expect(html).toMatch(
      /class="sr-only"[^>]*>\s*\(se abre en una pestaña nueva\)\s*</
    );
  });

  it("dibuja la flecha de enlace externo, oculta al lector de pantalla y al foco", async () => {
    const html = await renderLink();

    expect(html).toMatch(
      /<svg[^>]*class="enlace-externo__flecha"[^>]*aria-hidden="true"[^>]*focusable="false"/
    );
  });

  it("ofrece el aviso visual del puntero sin repetirlo al lector de pantalla", async () => {
    const html = await renderLink();

    expect(html).toMatch(
      /class="enlace-externo__aviso"[^>]*aria-hidden="true"[^>]*>\s*Se abre en una pestaña nueva\s*</
    );
  });

  it("usa la variante de texto y el aviso centrado por defecto", async () => {
    const html = await renderLink();

    expect(html).toContain("enlace-externo--texto");
    expect(html).toContain("enlace-externo--aviso-centro");
  });

  it("admite la variante de ícono y el aviso alineado al final", async () => {
    const html = await renderLink({ variante: "icono", avisoAlineado: "fin" });

    expect(html).toContain("enlace-externo--icono");
    expect(html).toContain("enlace-externo--aviso-fin");
  });

  it("conserva la clase que le pase quien lo usa", async () => {
    const html = await renderLink({ class: "redes__enlace" });

    expect(html).toMatch(/class="[^"]*\benlace-externo\b[^"]*\bredes__enlace\b/);
  });
});

describe("EnlaceExterno, flecha en texto", () => {
  it("une la flecha a la última palabra para que no quede sola en otra línea", async () => {
    const html = await renderLink({}, "el reporte privado de GitHub");

    expect(html).toMatch(
      /el reporte privado de <span class="enlace-externo__cola"[^>]*>GitHub<svg/
    );
  });

  it("deja sola la flecha en su envoltura cuando el texto termina en una etiqueta", async () => {
    const html = await renderLink({}, "la <em>política</em>");

    expect(html).toMatch(/<\/em><span class="enlace-externo__cola"[^>]*><svg/);
  });

  it("no toca el contenido del enlace de ícono", async () => {
    const html = await renderLink({ variante: "icono" }, "<svg></svg>");

    expect(html).toMatch(/<svg><\/svg><span class="enlace-externo__cola"[^>]*><svg/);
  });
});
