import { describe, expect, it } from "vitest";
import EnlaceExterno from "../src/components/EnlaceExterno.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// La Container API renderiza en Node: se verifica el marcado. Que el aviso
// aparezca al instante y solo con puntero se comprueba en navegador
// (issue #148, ADR 0022).
const renderizar = (
  props: Record<string, unknown> = {},
  contenido = "Una fuente"
) =>
  renderAstroComponent(EnlaceExterno, {
    props: { href: "https://example.org/fuente", ...props },
    slots: { default: contenido },
  });

describe("EnlaceExterno", () => {
  it("abre el destino en una pestaña nueva, sin dar acceso a la ventana de origen", async () => {
    const html = await renderizar();

    expect(html).toContain('href="https://example.org/fuente"');
    expect(html).toContain('target="_blank"');
    expect(html).toMatch(/rel="[^"]*\bnoopener\b[^"]*"/);
    expect(html).toMatch(/rel="[^"]*\bnoreferrer\b[^"]*"/);
  });

  it("suma los valores de rel que pida quien lo usa, sin perder los de seguridad", async () => {
    const html = await renderizar({ rel: "me" });

    expect(html).toMatch(/rel="[^"]*\bme\b[^"]*"/);
    expect(html).toMatch(/rel="[^"]*\bnoopener\b[^"]*"/);
  });

  it("muestra el contenido que recibe", async () => {
    const html = await renderizar({}, "Informe PISA");

    expect(html).toContain("Informe PISA");
  });

  it("avisa a lector de pantalla que se abre una pestaña nueva", async () => {
    const html = await renderizar();

    expect(html).toMatch(
      /class="sr-only"[^>]*>\s*\(se abre en una pestaña nueva\)\s*</
    );
  });

  it("dibuja la flecha de enlace externo, oculta al lector de pantalla y al foco", async () => {
    const html = await renderizar();

    expect(html).toMatch(
      /<svg[^>]*class="enlace-externo__flecha"[^>]*aria-hidden="true"[^>]*focusable="false"/
    );
  });

  it("ofrece el aviso visual del puntero sin repetirlo al lector de pantalla", async () => {
    const html = await renderizar();

    expect(html).toMatch(
      /class="enlace-externo__aviso"[^>]*aria-hidden="true"[^>]*>\s*Se abre en una pestaña nueva\s*</
    );
  });

  it("usa la variante de texto y el aviso centrado por defecto", async () => {
    const html = await renderizar();

    expect(html).toContain("enlace-externo--texto");
    expect(html).toContain("enlace-externo--aviso-centro");
  });

  it("admite la variante de ícono y el aviso alineado al final", async () => {
    const html = await renderizar({ variante: "icono", avisoAlineado: "fin" });

    expect(html).toContain("enlace-externo--icono");
    expect(html).toContain("enlace-externo--aviso-fin");
  });

  it("conserva la clase que le pase quien lo usa", async () => {
    const html = await renderizar({ class: "redes__enlace" });

    expect(html).toMatch(/class="[^"]*\benlace-externo\b[^"]*\bredes__enlace\b/);
  });
});
