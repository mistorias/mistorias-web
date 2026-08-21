import { afterEach, describe, expect, it, vi } from "vitest";
import LogotipoMistorias from "../src/components/LogotipoMistorias.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// El componente compone símbolo + palabra en dos disposiciones (issue #33):
// "apilado" siempre en columna, "adaptable" responde por CSS a max-height.
// Vitest no ejecuta motor CSS, así que solo se puede afirmar qué clase se
// aplica y qué queda en el DOM — no qué layout se ve en cada viewport.
describe("LogotipoMistorias", () => {
  afterEach(() => vi.unstubAllEnvs());

  it('aplica la clase "logotipo--adaptable" con disposicion="adaptable"', async () => {
    const html = await renderAstroComponent(LogotipoMistorias, {
      props: { disposicion: "adaptable" },
    });

    expect(html).toContain("logotipo--adaptable");
  });

  it('aplica la clase "logotipo--apilado" con disposicion="apilado"', async () => {
    const html = await renderAstroComponent(LogotipoMistorias, {
      props: { disposicion: "apilado" },
    });

    expect(html).toContain("logotipo--apilado");
  });

  it("mantiene la palabra en el DOM incluso cuando la disposición la oculta visualmente por CSS", async () => {
    const html = await renderAstroComponent(LogotipoMistorias, {
      props: { disposicion: "adaptable" },
    });

    expect(html).toContain("logotipo__palabra");
  });

  it("renderiza siempre el símbolo de marca junto a la palabra", async () => {
    const html = await renderAstroComponent(LogotipoMistorias, {
      props: { disposicion: "adaptable" },
    });

    expect(html).toContain("simbolo-marca");
  });

  it('muestra la palabra real "Mistorias" en el destino netlify', async () => {
    vi.stubEnv("DEPLOY_TARGET", "netlify");

    const html = await renderAstroComponent(LogotipoMistorias, {
      props: { disposicion: "adaptable" },
    });

    expect(html).toMatch(/Mistorias/);
  });
});
