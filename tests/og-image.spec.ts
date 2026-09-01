import { describe, expect, it } from "vitest";
import fixtureImage from "./fixtures/principal.jpg";
import {
  defaultOgImage,
  ogImageFromStoryImage,
} from "../src/lib/social/og-image";

// Cubre el armado del objeto OgImage; el render de las etiquetas <meta> que
// lo consumen vive en base-layout.spec.ts (issue #39).
describe("og-image", () => {
  describe("ogImageFromStoryImage", () => {
    it("recorta a 1200x630 y conserva el alt recibido", async () => {
      const resultado = await ogImageFromStoryImage(
        fixtureImage,
        "Descripción de prueba"
      );

      expect(resultado.width).toBe(1200);
      expect(resultado.height).toBe(630);
      expect(resultado.alt).toBe("Descripción de prueba");
      // El path exacto lo decide el servicio de imágenes de Astro (en build,
      // /_astro/*.jpg; en dev/tests, el endpoint /_image on-demand) — acá
      // solo importa que astro:assets procesó el recorte y no devolvió la
      // ruta cruda del fixture.
      expect(resultado.src).not.toBe("");
      expect(resultado.src).not.toContain("og-default.jpg");
    });
  });

  describe("defaultOgImage", () => {
    it("apunta a la imagen pre-generada bajo la base del despliegue", () => {
      const resultado = defaultOgImage("/mistorias-web/");

      expect(resultado.src).toBe("/mistorias-web/imagenes/og-default.jpg");
      expect(resultado.width).toBe(1200);
      expect(resultado.height).toBe(630);
      expect(resultado.alt.length).toBeGreaterThan(0);
    });

    it("funciona con la base raíz de Netlify", () => {
      const resultado = defaultOgImage("/");

      expect(resultado.src).toBe("/imagenes/og-default.jpg");
    });
  });
});
