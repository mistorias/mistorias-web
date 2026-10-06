import { describe, expect, it } from "vitest";
import CompartirHistoria from "../src/components/CompartirHistoria.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// La Container API renderiza en Node: se verifica el marcado. Cómo se ve
// fijo arriba a la derecha, al pasar el puntero y en cada tema se comprueba
// en navegador (issue #151).
const props = {
  urlHistoria: "https://mistorias.pe/historias/el-aula-de-madera/",
  titulo: "El aula de madera donde Ximena aprende",
  resumen:
    "Una escuela rural de Cusco enseña con lo que tiene: tablas, lluvia y una maestra que no se rinde.",
  urlImagen: "https://mistorias.pe/imagenes/og-default.jpg",
};

const renderShare = () => renderAstroComponent(CompartirHistoria, { props });

describe("CompartirHistoria", () => {
  it("es un details nativo: se abre con toque o teclado sin JavaScript", async () => {
    const html = await renderShare();

    expect(html).toMatch(/<details[^>]*class="compartir[^"]*"/);
    expect(html).toMatch(/<summary[^>]*class="compartir__boton[^"]*"/);
  });

  it("nombra el botón para lector de pantalla", async () => {
    const html = await renderShare();

    expect(html).toMatch(/class="sr-only"[^>]*>Compartir esta historia</);
  });

  it("rotula la lista de redes", async () => {
    const html = await renderShare();

    expect(html).toMatch(
      /<ul[^>]*aria-label="Compartir en redes sociales"/
    );
  });

  it("ofrece X, Facebook, Pinterest y LinkedIn, cada uno con su nombre accesible", async () => {
    const html = await renderShare();

    for (const label of ["X", "Facebook", "Pinterest", "LinkedIn"]) {
      expect(html).toMatch(
        new RegExp(`class="sr-only"[^>]*>Compartir en ${label}<`)
      );
    }
    expect(html).not.toContain("Instagram");
  });

  it("enlaza a la historia en cada red, sin perder el título", async () => {
    const html = await renderShare();
    const hrefs = [...html.matchAll(/<a[^>]*href="([^"]+)"/g)].map((match) =>
      match[1].replaceAll("&amp;", "&")
    );

    expect(hrefs).toHaveLength(4);
    for (const href of hrefs) {
      expect(decodeURIComponent(href)).toContain(props.urlHistoria);
    }
    expect(decodeURIComponent(hrefs[0].replaceAll("+", " "))).toContain(
      props.titulo
    );
  });

  it("abre cada red en una pestaña nueva con seguridad y lo avisa", async () => {
    const html = await renderShare();
    const links = html.match(/<a[^>]*>/g) ?? [];

    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link).toContain('target="_blank"');
      expect(link).toMatch(/rel="[^"]*\bnoopener\b[^"]*"/);
      expect(link).toContain("enlace-externo--icono");
    }
    expect(html.match(/\(se abre en una pestaña nueva\)/g)).toHaveLength(4);
  });

  it("oculta los dibujos al lector de pantalla y al foco, y los pinta con currentColor", async () => {
    const html = await renderShare();
    const drawings = html.match(/<svg[^>]*>/g) ?? [];

    // El ícono de compartir, cuatro glifos y la flecha de cada enlace.
    expect(drawings).toHaveLength(1 + 4 + 4);
    for (const svg of drawings) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
    }
    expect(html).not.toMatch(/(fill|stroke)="#/);
  });
});
