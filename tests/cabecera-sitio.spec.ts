import { describe, expect, it } from "vitest";
import CabeceraSitio from "../src/components/CabeceraSitio.astro";
import { renderAstroComponent } from "./support/render-astro-component";

// esRutaActual() marca aria-current="page" solo cuando Astro.url.pathname
// coincide con el enlace: cubre las dos ramas, no solo la de "sin coincidir"
// que el resto de los tests dispara por defecto (issue #33).
describe("CabeceraSitio", () => {
  it('marca aria-current="page" en el enlace de inicio cuando la ruta actual es la portada', async () => {
    const html = await renderAstroComponent(CabeceraSitio, { url: "/" });

    expect(html).toMatch(/cabecera__marca"[^>]*aria-current="page"/);
  });

  it('marca aria-current="page" en "Acerca de" cuando la ruta actual es /acerca/', async () => {
    const html = await renderAstroComponent(CabeceraSitio, { url: "/acerca/" });

    expect(html).toMatch(/cabecera__enlace"[^>]*aria-current="page"/);
  });

  it("no marca aria-current en ningún enlace cuando la ruta actual no coincide con ninguno", async () => {
    const html = await renderAstroComponent(CabeceraSitio, { url: "/historias/una-historia/" });

    expect(html).not.toContain("aria-current");
  });
});
