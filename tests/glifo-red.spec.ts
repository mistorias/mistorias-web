import { describe, expect, it } from "vitest";
import GlifoRed from "../src/components/GlifoRed.astro";
import { SOCIAL_PROFILES } from "../src/lib/social/profiles";
import { renderAstroComponent } from "./support/render-astro-component";

const renderGlyph = (network: string) =>
  renderAstroComponent(GlifoRed, { props: { red: network } });

describe("GlifoRed", () => {
  it("oculta el dibujo al lector de pantalla y al foco: el nombre lo pone quien lo envuelve", async () => {
    const html = await renderGlyph("x");

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
  });

  it("dibuja con currentColor, sin colores fijos", async () => {
    const html = await renderGlyph("facebook");

    expect(html).toContain('fill="currentColor"');
    expect(html).not.toMatch(/fill="#/);
  });

  it("marca cada glifo con su red para darle ancho y alto explícitos (WebKit no deduce el ancho de un svg con width: auto)", async () => {
    const networks = [
      ...SOCIAL_PROFILES.map((profile) => profile.network),
      "pinterest",
      "linkedin",
    ];

    for (const network of networks) {
      const html = await renderGlyph(network);

      expect(html).toContain(`glifo-red--${network}`);
    }
  });

  it("recorta la \"f\" de Facebook a la letra, sin el disco de Simple Icons", async () => {
    const html = await renderGlyph("facebook");

    expect(html).toContain('viewBox="6.627 4.486 10.941 19.47"');
  });

  it("dibuja la \"P\" de Pinterest y el \"in\" de LinkedIn sin su fondo macizo", async () => {
    expect(await renderGlyph("pinterest")).toContain(
      'viewBox="4.361 4.465 15.312 18.976"'
    );
    expect(await renderGlyph("linkedin")).toContain(
      'viewBox="3.274 3.305 17.173 17.147"'
    );
  });
});
