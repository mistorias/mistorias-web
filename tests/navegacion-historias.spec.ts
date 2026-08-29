import { describe, expect, it } from "vitest";
import NavegacionHistorias from "../src/components/NavegacionHistorias.astro";
import { renderAstroComponent } from "./support/render-astro-component";
import { buildStoryFixture } from "./support/story-fixture";

describe("NavegacionHistorias", () => {
  it("no renderiza nada cuando no hay anterior ni siguiente", async () => {
    const html = await renderAstroComponent(NavegacionHistorias, {
      props: {},
    });

    expect(html.trim()).toBe("");
  });

  it("renderiza solo el enlace anterior cuando no hay siguiente", async () => {
    const historiaAnterior = buildStoryFixture({
      id: "historia-anterior",
      title: "Título de la anterior",
    });
    const html = await renderAstroComponent(NavegacionHistorias, {
      props: { historiaAnterior },
    });

    expect(html).toContain("/historias/historia-anterior/");
    expect(html).toContain("Historia anterior");
    expect(html).toContain("Título de la anterior");
    expect(html).not.toContain("Historia siguiente");
  });

  it("renderiza solo el enlace siguiente cuando no hay anterior", async () => {
    const historiaSiguiente = buildStoryFixture({
      id: "historia-siguiente",
      title: "Título de la siguiente",
    });
    const html = await renderAstroComponent(NavegacionHistorias, {
      props: { historiaSiguiente },
    });

    expect(html).toContain("/historias/historia-siguiente/");
    expect(html).toContain("Historia siguiente");
    expect(html).toContain("Título de la siguiente");
    expect(html).not.toContain("Historia anterior");
  });

  it("renderiza ambos enlaces con sus hrefs de storyRoute cuando existen los dos", async () => {
    const historiaAnterior = buildStoryFixture({
      id: "historia-anterior",
      title: "Anterior",
    });
    const historiaSiguiente = buildStoryFixture({
      id: "historia-siguiente",
      title: "Siguiente",
    });
    const html = await renderAstroComponent(NavegacionHistorias, {
      props: { historiaAnterior, historiaSiguiente },
    });

    expect(html).toContain("/historias/historia-anterior/");
    expect(html).toContain("/historias/historia-siguiente/");
    expect(html).toContain("Historia anterior");
    expect(html).toContain("Historia siguiente");
  });

  it("tiene un aria-label describiendo la navegación", async () => {
    const historiaAnterior = buildStoryFixture({ id: "historia-anterior" });
    const html = await renderAstroComponent(NavegacionHistorias, {
      props: { historiaAnterior },
    });

    expect(html).toMatch(/aria-label="Navegación entre historias"/);
  });
});
