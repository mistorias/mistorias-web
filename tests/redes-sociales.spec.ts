import { describe, expect, it } from "vitest";
import RedesSociales from "../src/components/RedesSociales.astro";
import { SOCIAL_PROFILES } from "../src/lib/social/profiles";
import { renderAstroComponent } from "./support/render-astro-component";

// La Container API renderiza en Node: se verifica el marcado. Cómo se ve el
// aro en cada tema y ancho se comprueba en navegador (issue #148).
const renderizar = () =>
  renderAstroComponent(RedesSociales, {
    props: { etiquetadoPor: "pie-invitacion" },
  });

describe("RedesSociales", () => {
  it("enlaza a cada perfil declarado en SOCIAL_PROFILES", async () => {
    const html = await renderizar();

    for (const perfil of SOCIAL_PROFILES) {
      expect(html).toContain(`href="${perfil.url}"`);
    }
  });

  it("nombra cada enlace para lector de pantalla con la marca y la red", async () => {
    const html = await renderizar();

    expect(html).toMatch(/class="sr-only"[^>]*>Mistorias en Instagram</);
    expect(html).toMatch(/class="sr-only"[^>]*>Mistorias en Facebook</);
    expect(html).toMatch(/class="sr-only"[^>]*>Mistorias en X</);
  });

  it("rotula la lista con el texto que invita a seguir", async () => {
    const html = await renderizar();

    expect(html).toMatch(/<ul[^>]*aria-labelledby="pie-invitacion"/);
  });

  it("oculta los dibujos al lector de pantalla y al foco", async () => {
    const html = await renderizar();
    const svgs = html.match(/<svg[^>]*>/g) ?? [];

    expect(svgs).toHaveLength(SOCIAL_PROFILES.length);
    for (const svg of svgs) {
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
    }
  });

  it("declara los perfiles como propios y no abre pestañas nuevas", async () => {
    const html = await renderizar();
    const enlaces = html.match(/<a[^>]*>/g) ?? [];

    expect(enlaces).toHaveLength(SOCIAL_PROFILES.length);
    for (const enlace of enlaces) {
      expect(enlace).toContain('rel="me"');
      expect(enlace).not.toContain("target=");
    }
  });

  it("dibuja con currentColor, sin colores fijos", async () => {
    const html = await renderizar();

    expect(html).not.toMatch(/fill="#/);
    expect(html).toContain('fill="currentColor"');
  });
});
