import { afterEach, describe, expect, it, vi } from "vitest";
import Acerca from "../src/pages/acerca.astro";
import packageJson from "../package.json" with { type: "json" };
import { authorshipDescriptions } from "../src/lib/content/authorship";
import { renderAstroComponent } from "./support/render-astro-component";

const versionEn = (html: string): string | undefined =>
  html.match(/class="acerca__version[^"]*"[^>]*>([^<]+)</)?.[1];

// De toda la página, lo único con lógica propia es la versión: el resto es
// prosa editorial. Se prueba de dónde sale ese número y dónde queda, porque
// una versión equivocada contradice justamente lo que la página promete
// (issue #106).
describe("Acerca de", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("muestra el tag cuando el build viene de un release", async () => {
    vi.stubEnv("SITE_VERSION", "v1.4.0");

    const html = await renderAstroComponent(Acerca);

    expect(versionEn(html)).toBe("Versión v1.4.0");
  });

  it("cae a la versión de package.json cuando no hay tag", async () => {
    vi.stubEnv("SITE_VERSION", "");

    const html = await renderAstroComponent(Acerca);

    expect(versionEn(html)).toBe(`Versión v${packageJson.version}`);
  });

  // La versión cierra "Todo es público y tiene historial" a propósito: ahí es
  // donde la página promete que se puede revisar qué cambió y cuándo, y sin
  // saber desde qué build se revisa, la promesa queda a medias.
  it("cierra la sección del historial, no otra", async () => {
    const html = await renderAstroComponent(Acerca);

    const historial = html.indexOf("Todo es público y tiene historial");
    const version = html.indexOf('class="acerca__version');

    expect(historial).toBeGreaterThan(-1);
    expect(version).toBeGreaterThan(historial);
  });

  // Las tres etiquetas de autoría se explican acá con el mismo texto que
  // muestra el pie de cada historia (ADR 0016): si esta página dejara de
  // leerlas de authorship.ts, la etiqueta del pie dejaría de significar lo
  // que esta página promete.
  it("explica las tres autorías con el texto compartido", async () => {
    const html = await renderAstroComponent(Acerca);

    const autorias = authorshipDescriptions();

    expect(autorias).toHaveLength(3);

    for (const autoria of autorias) {
      expect(html).toContain(autoria.label);
      expect(html).toContain(autoria.detail);
    }
  });
});
