import { describe, expect, it } from "vitest";
import codigo from "../src/pages/codigo.astro";
import contenido from "../src/pages/contenido.astro";
import marca from "../src/pages/marca.astro";
import reportar from "../src/pages/reportar.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// Ningún enlace que salga de Mistorias puede escribirse a mano (ADR 0022):
// cada uno pasa por EnlaceExterno y por eso trae pestaña nueva y aviso.
const pages = { codigo, contenido, marca, reportar };

describe.each(Object.entries(pages))("página %s", (_name, page) => {
  it("abre en pestaña nueva y avisa cada enlace que sale del sitio", async () => {
    const html = await renderAstroComponent(page);
    const externalAnchors = html.match(/<a [^>]*href="https?:\/\/[^"]*"[^>]*>/g) ?? [];

    expect(externalAnchors.length).toBeGreaterThan(0);
    for (const anchor of externalAnchors) {
      expect(anchor).toContain('target="_blank"');
      expect(anchor).toContain("noopener noreferrer");
    }
  });
});
