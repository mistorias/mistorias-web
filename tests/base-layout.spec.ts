import { afterEach, describe, expect, it, vi } from "vitest";
import BaseLayout from "../src/layouts/BaseLayout.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// Solo la CSP y el salto de accesibilidad — el resto de BaseLayout es
// marcado compartido sin lógica propia (issue #33).
describe("BaseLayout", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("incluye el meta CSP con las siete directivas esperadas", async () => {
    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "Título de prueba" },
      slots: { default: "contenido" },
    });

    const cspMatch = html.match(
      /http-equiv="Content-Security-Policy" content="([^"]+)"/
    );
    const csp = cspMatch ? cspMatch[1] : "";

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("script-src 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'none'");
  });

  it("empareja el salto de contenido con el id del <main>", async () => {
    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "T" },
      slots: { default: "" },
    });

    expect(html).toContain('href="#contenido"');
    expect(html).toContain('id="contenido"');
  });

  it('antepone "WIP: " al título en el destino development', async () => {
    vi.stubEnv("DEPLOY_TARGET", "development");

    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "Portada" },
      slots: { default: "" },
    });

    expect(html).toContain("<title>WIP: Portada</title>");
  });

  it("no antepone WIP en el destino netlify", async () => {
    vi.stubEnv("DEPLOY_TARGET", "netlify");

    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "Portada" },
      slots: { default: "" },
    });

    expect(html).toContain("<title>Portada</title>");
    expect(html).not.toContain("<title>WIP:");
  });

  it("incluye meta description cuando se pasa", async () => {
    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "Titulo", description: "Descripción de la página" },
      slots: { default: "" },
    });

    expect(html).toContain("Descripción de la página");
  });

  it("no incluye meta description cuando no se pasa", async () => {
    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "Titulo" },
      slots: { default: "" },
    });

    expect(html).not.toContain('name="description"');
  });
});
