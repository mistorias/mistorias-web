import { afterEach, describe, expect, it, vi } from "vitest";
import BaseLayout from "../src/layouts/BaseLayout.astro";
import fixtureImage from "./fixtures/principal.jpg";
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
    // 'self' y no 'none': los formularios de feedback (issue #42 de gestión
    // de producto) usan Netlify Forms, que necesita poder recibir el POST
    // que el propio HTML dispara sin JavaScript.
    expect(csp).toContain("form-action 'self'");
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

  it("agrega meta robots noindex en el destino development", async () => {
    vi.stubEnv("DEPLOY_TARGET", "development");

    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "Portada" },
      slots: { default: "" },
    });

    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
  });

  it("no agrega meta robots noindex en el destino netlify", async () => {
    vi.stubEnv("DEPLOY_TARGET", "netlify");

    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "Portada" },
      slots: { default: "" },
    });

    expect(html).not.toContain('name="robots"');
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

  it("sin Astro.site no emite og:image (no hay origen para armar la URL absoluta)", async () => {
    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "Titulo" },
      slots: { default: "" },
    });

    expect(html).not.toContain('property="og:image"');
  });

  it("con Astro.site y sin ogImage: cae a la ilustración por defecto en 1200x630", async () => {
    const html = await renderAstroComponent(BaseLayout, {
      props: { title: "Titulo" },
      slots: { default: "" },
      site: "https://mistorias.pe",
    });

    expect(html).toContain(
      'property="og:image" content="https://mistorias.pe/imagenes/og-default.jpg"'
    );
    expect(html).toContain('property="og:image:width" content="1200"');
    expect(html).toContain('property="og:image:height" content="630"');
    expect(html).toContain('property="og:image:alt"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("con ogImage: usa la cabecera de la historia, no la imagen por defecto", async () => {
    const html = await renderAstroComponent(BaseLayout, {
      props: {
        title: "Titulo",
        ogImage: { src: fixtureImage, alt: "Descripción de la foto" },
      },
      slots: { default: "" },
      site: "https://mistorias.pe",
    });

    // El path exacto de astro:assets difiere entre build (/_astro/*.jpg) y
    // dev/tests (endpoint /_image on-demand); acá solo importa que es una
    // URL absoluta sobre mistorias.pe y que no es la imagen por defecto.
    expect(html).toMatch(
      /property="og:image" content="https:\/\/mistorias\.pe\/[^"]+"/
    );
    expect(html).not.toContain("og-default.jpg");
    expect(html).toContain('property="og:image:alt" content="Descripción de la foto"');
  });
});
