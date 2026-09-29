import { describe, expect, it } from "vitest";
import TiempoDeLectura from "../src/components/TiempoDeLectura.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// La Container API renderiza en Node: se verifica el marcado. Cómo se ve en
// cada tema y ancho se comprueba en navegador.
describe("TiempoDeLectura", () => {
  it("rotula el dato completo, con la etiqueta en negrita", async () => {
    const html = await renderAstroComponent(TiempoDeLectura, {
      props: { minutos: 5 },
    });

    // Un espacio de verdad entre la etiqueta y el valor: el compilador de
    // Astro colapsa los saltos de línea de la plantilla, y sin él se leería
    // "Tiempo de lectura:5 minutos".
    expect(html).toMatch(
      /<strong[^>]*>Tiempo de lectura:<\/strong> 5 minutos/
    );
  });

  it("dice un minuto en singular", async () => {
    const html = await renderAstroComponent(TiempoDeLectura, {
      props: { minutos: 1 },
    });

    expect(html).toContain("1 minuto");
    expect(html).not.toContain("1 minutos");
  });

  it("es un solo párrafo, sin enlaces", async () => {
    const html = await renderAstroComponent(TiempoDeLectura, {
      props: { minutos: 3 },
    });

    expect(html.match(/<p[\s>]/g)).toHaveLength(1);
    expect(html).not.toContain("<a ");
  });
});
