import { describe, expect, it } from "vitest";
import RedesSociales from "../src/components/RedesSociales.astro";
import { SOCIAL_PROFILES } from "../src/lib/social/profiles";
import { renderAstroComponent } from "./support/render-astro-component";

// La Container API renderiza en Node: se verifica el marcado. Cómo se ve el
// aro en cada tema y ancho se comprueba en navegador (issue #148).
const renderSocialLinks = () =>
  renderAstroComponent(RedesSociales, {
    props: { etiquetadoPor: "pie-invitacion" },
  });

describe("RedesSociales", () => {
  it("enlaza a cada perfil declarado en SOCIAL_PROFILES", async () => {
    const html = await renderSocialLinks();

    for (const profile of SOCIAL_PROFILES) {
      expect(html).toContain(`href="${profile.url}"`);
    }
  });

  it("nombra cada enlace para lector de pantalla con la marca y la red", async () => {
    const html = await renderSocialLinks();

    expect(html).toMatch(/class="sr-only"[^>]*>Mistorias en Instagram</);
    expect(html).toMatch(/class="sr-only"[^>]*>Mistorias en Facebook</);
    expect(html).toMatch(/class="sr-only"[^>]*>Mistorias en X</);
  });

  it("rotula la lista con el texto que invita a seguir", async () => {
    const html = await renderSocialLinks();

    expect(html).toMatch(/<ul[^>]*aria-labelledby="pie-invitacion"/);
  });

  it("oculta los dibujos al lector de pantalla y al foco", async () => {
    const html = await renderSocialLinks();
    const glyphs = html.match(/<svg[^>]*class="redes__glifo [^"]*"[^>]*>/g) ?? [];

    expect(glyphs).toHaveLength(SOCIAL_PROFILES.length);
    for (const svg of glyphs) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
    }
  });

  it("declara los perfiles como propios y los abre en una pestaña nueva con seguridad", async () => {
    const html = await renderSocialLinks();
    const links = html.match(/<a[^>]*>/g) ?? [];

    expect(links).toHaveLength(SOCIAL_PROFILES.length);
    for (const link of links) {
      expect(link).toMatch(/rel="[^"]*\bme\b[^"]*"/);
      expect(link).toMatch(/rel="[^"]*\bnoopener\b[^"]*"/);
      expect(link).toContain('target="_blank"');
    }
  });

  it("avisa de la pestaña nueva en cada enlace, como el resto de los externos", async () => {
    const html = await renderSocialLinks();

    expect(html.match(/\(se abre en una pestaña nueva\)/g)).toHaveLength(
      SOCIAL_PROFILES.length
    );
    expect(html.match(/class="enlace-externo__aviso"/g)).toHaveLength(
      SOCIAL_PROFILES.length
    );
  });

  it("ancla el aviso del último ícono a su borde final para que no se salga de la pantalla", async () => {
    const html = await renderSocialLinks();
    const links = html.match(/<a[^>]*>/g) ?? [];

    expect(links.at(-1)).toContain("enlace-externo--aviso-fin");
    for (const link of links.slice(0, -1)) {
      expect(link).toContain("enlace-externo--aviso-centro");
    }
  });

  it("dibuja con currentColor, sin colores fijos", async () => {
    const html = await renderSocialLinks();

    expect(html).not.toMatch(/fill="#/);
    expect(html).toContain('fill="currentColor"');
  });
});

describe("RedesSociales, tamaño de los glifos", () => {
  it("marca cada glifo con su red para darle ancho y alto explícitos (WebKit no deduce el ancho de un svg con width: auto)", async () => {
    const html = await renderSocialLinks();

    for (const profile of SOCIAL_PROFILES) {
      expect(html).toContain(`redes__glifo--${profile.network}`);
    }
  });
});
