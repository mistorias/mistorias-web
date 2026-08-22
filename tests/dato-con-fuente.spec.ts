import { describe, expect, it } from "vitest";
import DatoConFuente from "../src/components/DatoConFuente.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// El componente envuelve una afirmación con dato duro en un <details> nativo
// para que su fuente se abra sin JavaScript (issue #37 de gestión de producto).
// La Container API renderiza en Node, así que acá se verifica la estructura del
// marcado; el hover y el toque se comprueban en navegador.

const props = {
  fuente: "OCDE, PISA 2022",
  href: "https://www.oecd.org/peru",
  detalle: "1 % de estudiantes peruanos en nivel 5 o superior en lectura.",
  grupo: "fuentes-portada",
};

const slots = { default: "<strong>Solo el 1 %</strong> llega al nivel más alto." };

describe("DatoConFuente", () => {
  it("pone la afirmación dentro del <summary>, que es lo que abre la fuente", async () => {
    const html = await renderAstroComponent(DatoConFuente, { props, slots });

    expect(html).toMatch(/<summary[^>]*>[\s\S]*Solo el 1 %[\s\S]*<\/summary>/);
  });

  it("enlaza la fuente con su nombre y su dirección", async () => {
    const html = await renderAstroComponent(DatoConFuente, { props, slots });

    expect(html).toContain('href="https://www.oecd.org/peru"');
    expect(html).toContain("OCDE, PISA 2022");
  });

  it("muestra el detalle que permite comprobar la cifra", async () => {
    const html = await renderAstroComponent(DatoConFuente, { props, slots });

    expect(html).toContain(
      "1 % de estudiantes peruanos en nivel 5 o superior en lectura."
    );
  });

  it("agrupa los datos con el atributo name, para que solo uno quede abierto", async () => {
    const html = await renderAstroComponent(DatoConFuente, { props, slots });

    expect(html).toMatch(/<details[^>]*name="fuentes-portada"/);
  });

  it("omite el atributo name cuando el dato no pertenece a ningún grupo", async () => {
    const { grupo: _grupo, ...sinGrupo } = props;
    const html = await renderAstroComponent(DatoConFuente, {
      props: sinGrupo,
      slots,
    });

    expect(html).not.toContain("name=");
  });

  it("esconde la pista visual de los lectores de pantalla, que ya oyen el plegable", async () => {
    const html = await renderAstroComponent(DatoConFuente, { props, slots });

    expect(html).toMatch(/<span[^>]*aria-hidden="true"[^>]*>\s*fuente\s*<\/span>/);
  });
});
