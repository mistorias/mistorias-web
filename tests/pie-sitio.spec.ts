import { describe, expect, it } from "vitest";
import PieSitio from "../src/components/PieSitio.astro";
import { SOCIAL_PROFILES } from "../src/lib/social/profiles";
import { renderAstroComponent } from "./support/render-astro-component";

// La Container API renderiza en Node: se verifica el marcado. Cómo se
// acomoda la franja en cada ancho (fila o apilada) se comprueba en navegador,
// porque lo decide una container query (issue #148).
describe("PieSitio", () => {
  it("une la misión y la invitación a seguir en una sola nota", async () => {
    const html = await renderAstroComponent(PieSitio);

    expect(html).toContain(
      "No queremos solo informarte: cada semana, una historia para que veas, entiendas y quieras transformar la educación."
    );
    expect(html).toMatch(
      /id="pie-invitacion"[^>]*>Síguenos y no te pierdas la próxima\.</
    );
  });

  it("pone las redes en la franja de la marca, rotuladas por la invitación", async () => {
    const html = await renderAstroComponent(PieSitio);
    const franja = html.slice(
      html.indexOf('class="pie__franja'),
      html.indexOf("<nav")
    );

    expect(franja).toContain('aria-labelledby="pie-invitacion"');
    for (const perfil of SOCIAL_PROFILES) {
      expect(franja).toContain(`href="${perfil.url}"`);
    }
  });

  it("conserva los cuatro enlaces del pie", async () => {
    const html = await renderAstroComponent(PieSitio);

    for (const texto of [
      "Contenido editorial",
      "Código del sitio",
      "Esencia de marca",
      "Reportar un problema",
    ]) {
      expect(html).toMatch(new RegExp(`class="pie__enlace"[^>]*>\\s*${texto}`));
    }
  });
});
