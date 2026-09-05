import { afterEach, describe, expect, it, vi } from "vitest";
import FirmaAutoria from "../src/components/FirmaAutoria.astro";
import { describeAuthorship } from "../src/lib/content/authorship";
import { renderAstroComponent } from "./support/render-astro-component";
import { buildAuthorFixture } from "./support/author-fixture";

const autor = buildAuthorFixture({
  id: "paolo-carrasco",
  name: "Paolo Carrasco",
  bio: "Escribe Mistorias desde Barcelona."
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("FirmaAutoria", () => {
  it("enlaza el nombre de quien firma con su ficha", async () => {
    const html = await renderAstroComponent(FirmaAutoria, {
      props: { autor, autoria: "escrito-con-ia" }
    });

    expect(html).toContain('href="/autores/paolo-carrasco/"');
    expect(html).toContain("Paolo Carrasco");
  });

  it("respeta la base del despliegue en vez de escribir la ruta a mano", async () => {
    vi.stubEnv("BASE_URL", "/mistorias-web/");

    const html = await renderAstroComponent(FirmaAutoria, {
      props: { autor, autoria: "escrito-con-ia" }
    });

    expect(html).toContain('href="/mistorias-web/autores/paolo-carrasco/"');
  });

  it("muestra la línea de bio de la ficha", async () => {
    const html = await renderAstroComponent(FirmaAutoria, {
      props: { autor, autoria: "escrito-con-ia" }
    });

    expect(html).toContain("Escribe Mistorias desde Barcelona.");
  });

  it("declara qué hizo la inteligencia artificial en esta historia", async () => {
    const declaracion = describeAuthorship("editado-con-ia");

    const html = await renderAstroComponent(FirmaAutoria, {
      props: { autor, autoria: "editado-con-ia" }
    });

    expect(html).toContain(declaracion.label);
    expect(html).toContain(declaracion.detail);
  });

  // El rótulo cambia de una historia a otra: si se quedara fijo, la etiqueta
  // dejaría de significar algo.
  it("cambia el rótulo según la etiqueta que recibe", async () => {
    const [conIa, porPersona] = await Promise.all([
      renderAstroComponent(FirmaAutoria, {
        props: { autor, autoria: "escrito-con-ia" }
      }),
      renderAstroComponent(FirmaAutoria, {
        props: { autor, autoria: "escrito-por-persona" }
      })
    ]);

    expect(conIa).toContain(describeAuthorship("escrito-con-ia").label);
    expect(conIa).not.toContain(describeAuthorship("escrito-por-persona").label);
    expect(porPersona).toContain(describeAuthorship("escrito-por-persona").label);
  });
});
