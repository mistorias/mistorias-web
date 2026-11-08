import { describe, expect, it } from "vitest";
import Gracias from "../src/pages/gracias.astro";
import { renderAstroComponent } from "./support/render-astro-component";

describe("gracias.astro", () => {
  it("ya no promete una respuesta por correo", async () => {
    const html = await renderAstroComponent(Gracias);

    expect(html).not.toContain("correo");
  });

  it("avisa que un comentario público se revisa antes de aparecer", async () => {
    const html = await renderAstroComponent(Gracias);

    expect(html).toContain("Tu mensaje llegó.");
    expect(html).toContain(
      "Si pediste publicar tu comentario, lo revisamos antes de que aparezca."
    );
  });
});
