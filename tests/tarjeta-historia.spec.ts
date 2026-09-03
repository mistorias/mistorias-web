import { describe, expect, it, vi } from "vitest";
import type { ImageMetadata } from "astro";
import fixtureImage from "./fixtures/principal.jpg";
import TarjetaHistoria from "../src/components/TarjetaHistoria.astro";
import { renderAstroComponent } from "./support/render-astro-component";
import { buildStoryFixture } from "./support/story-fixture";

// El submódulo de contenido no tiene por qué traer ya la imagen de ninguna
// historia real en el momento en que corren estos tests (su llegada es un PR
// aparte en mistorias-contenido): se mockea story-images.ts con un fixture
// propio del repo, real para que astro:assets lo pueda procesar, pero
// independiente de qué historia tenga o no principal.jpg en cada momento.
const STORY_ID_WITH_IMAGE = "historia-con-imagen";
vi.mock("../src/lib/content/story-images", () => ({
  getStoryImage: (storyId: string): ImageMetadata | undefined =>
    storyId === STORY_ID_WITH_IMAGE
      ? (fixtureImage as unknown as ImageMetadata)
      : undefined,
}));

// Cubre el armado de enlace y metadatos, no el diseño visual (issue #33).
describe("TarjetaHistoria", () => {
  it("arma el enlace de la tarjeta con storyRoute a partir del id de la historia", async () => {
    const historia = buildStoryFixture({ id: "una-historia" });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html).toMatch(
      /<a class="tarjeta__enlace" href="[^"]*\/historias\/una-historia\/?"/,
    );
  });

  it("la tarjeta expone un único enlace, con texto accesible que incluye el título (issue #41)", async () => {
    const historia = buildStoryFixture({ title: "Historia con enlace único" });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html.match(/class="tarjeta__enlace"/g)).toHaveLength(1);
    expect(html).toContain("Leer la historia");
    expect(html).toMatch(
      /<span class="sr-only"[^>]*> completa: Historia con enlace único<\/span>/,
    );
  });

  it("el título ya no es un enlace: es texto plano dentro del encabezado", async () => {
    const historia = buildStoryFixture({ title: "Título sin enlace propio" });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html).toMatch(
      /<h2 class="tarjeta__titulo"[^>]*>Título sin enlace propio<\/h2>/,
    );
  });

  it("usa h2 cuando no se pasa nivelTitulo", async () => {
    const historia = buildStoryFixture({ title: "Título de prueba" });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html).toContain("<h2");
    expect(html).not.toContain("<h3");
  });

  it("usa h3 cuando nivelTitulo es 3", async () => {
    const historia = buildStoryFixture({ title: "Título de prueba" });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia, nivelTitulo: 3 },
    });

    expect(html).toContain("<h3");
    expect(html).not.toContain("<h2");
  });

  it("no agrega la clase tarjeta--destacada por defecto", async () => {
    const historia = buildStoryFixture();
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html).not.toContain("tarjeta--destacada");
  });

  it("agrega tarjeta--destacada cuando destacada es true", async () => {
    const historia = buildStoryFixture();
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia, destacada: true },
    });

    expect(html).toContain("tarjeta--destacada");
  });

  it("no renderiza ListaTemas cuando la historia no tiene temas", async () => {
    const historia = buildStoryFixture({ themes: [] });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html).not.toMatch(/class="temas"/);
  });

  it("renderiza ListaTemas con los temas y un aria-label que incluye el título", async () => {
    const historia = buildStoryFixture({
      title: "Historia con temas",
      themes: ["educacion", "comunidad"],
    });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html).toContain("Temas de Historia con temas");
    expect(html).toContain("educacion");
    expect(html).toContain("comunidad");
  });

  it("muestra resumen, fecha legible y autoría de la historia", async () => {
    const historia = buildStoryFixture({
      summary: "Resumen único de prueba",
      author: "Autor Especial",
      date: new Date("2026-04-26"),
    });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html).toContain("Resumen único de prueba");
    expect(html).toContain("Autor Especial");
    expect(html).toContain("abril");
  });

  it("sin imagen: muestra el símbolo de Mistorias estático y ningún <img>", async () => {
    const historia = buildStoryFixture({ id: "historia-sin-imagen" });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html).toContain("tarjeta__marcador");
    expect(html).not.toContain("tarjeta__marcador--cargando");
    expect(html).not.toContain("<img");
  });

  it("con imagen: recorta 1:1 (width===height), carga en diferido y marca el símbolo como marcador de carga", async () => {
    const historia = buildStoryFixture({
      id: STORY_ID_WITH_IMAGE,
      imageAlt: "Descripción de prueba",
    });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia },
    });

    expect(html).toContain("tarjeta__marcador--cargando");
    expect(html).toMatch(/<img[^>]+loading="lazy"/);
    expect(html).toMatch(/<img[^>]+width="480"[^>]+height="480"/);
    expect(html).toContain('alt="Descripción de prueba"');
  });

  it("la tarjeta destacada también usa loading=\"lazy\" (ninguna tarjeta va en eager)", async () => {
    const historia = buildStoryFixture({
      id: STORY_ID_WITH_IMAGE,
      imageAlt: "Descripción de prueba",
    });
    const html = await renderAstroComponent(TarjetaHistoria, {
      props: { historia, destacada: true },
    });

    expect(html).toMatch(/<img[^>]+loading="lazy"/);
  });
});
