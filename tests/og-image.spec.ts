import { describe, expect, it } from "vitest";
import fixtureImage from "./fixtures/principal.jpg";
import {
  defaultOgImage,
  ogImageFromStoryImage,
  resolveOgImage,
} from "../src/lib/social/og-image";

// Cubre el armado del objeto OgImage; el render de las etiquetas <meta> que
// lo consumen vive en base-layout.spec.ts (issue #39).
describe("og-image", () => {
  describe("ogImageFromStoryImage", () => {
    it("recorta a 1200x630 y conserva el alt recibido", async () => {
      const result = await ogImageFromStoryImage(
        fixtureImage,
        "Descripción de prueba"
      );

      expect(result.width).toBe(1200);
      expect(result.height).toBe(630);
      expect(result.alt).toBe("Descripción de prueba");
      // El path exacto lo decide el servicio de imágenes de Astro (en build,
      // /_astro/*.jpg; en dev/tests, el endpoint /_image on-demand) — acá
      // solo importa que astro:assets procesó el recorte y no devolvió la
      // ruta cruda del fixture.
      expect(result.src).not.toBe("");
      expect(result.src).not.toContain("og-default.jpg");
    });
  });

  describe("defaultOgImage", () => {
    it("apunta a la imagen pre-generada bajo la base del despliegue", () => {
      const result = defaultOgImage("/mistorias-web/");

      expect(result.src).toBe("/mistorias-web/imagenes/og-default.jpg");
      expect(result.width).toBe(1200);
      expect(result.height).toBe(630);
      expect(result.alt.length).toBeGreaterThan(0);
    });

    it("funciona con la base raíz de Netlify", () => {
      const result = defaultOgImage("/");

      expect(result.src).toBe("/imagenes/og-default.jpg");
    });
  });

  describe("resolveOgImage", () => {
    it("recorta la cabecera de la historia cuando la página la trae", async () => {
      const result = await resolveOgImage("/", {
        src: fixtureImage,
        alt: "Descripción de prueba",
      });

      expect(result.alt).toBe("Descripción de prueba");
      expect(result.src).not.toContain("og-default.jpg");
    });

    it("cae en la ilustración por defecto, bajo la base, cuando no hay cabecera", async () => {
      const result = await resolveOgImage("/mistorias-web/");

      expect(result).toEqual(defaultOgImage("/mistorias-web/"));
    });
  });
});
