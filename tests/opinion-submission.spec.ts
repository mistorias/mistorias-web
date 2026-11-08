import { describe, expect, it } from "vitest";
import { parsePublicComment } from "../src/lib/comments/opinion-submission";

const published = ["historia-a", "historia-b"];
const now = new Date("2026-11-08T20:15:00.000Z");

const validData = {
  "form-name": "opinion-historia",
  "opinion-empresa": "",
  historia: "historia-a",
  calificacion: "5",
  visibilidad: "publico",
  nombre: "Rosa Quispe",
  comentario: "Me hizo pensar en mi abuela."
};

function parse(overrides: Record<string, string | undefined> = {}) {
  return parsePublicComment(
    { ...validData, ...overrides } as Record<string, string>,
    published,
    now
  );
}

describe("parsePublicComment", () => {
  it("devuelve el comentario con id, fecha del envío y textos normalizados", () => {
    const result = parse({ nombre: "  Rosa   Quispe ", comentario: " Hola. " });

    expect(result).toEqual({
      comment: {
        story: "historia-a",
        id: "1e9e4a541c2ba6d1",
        author: "Rosa Quispe",
        text: "Hola.",
        submittedAt: "2026-11-08T20:15:00.000Z"
      }
    });
  });

  it("acepta un envío al que Netlify no le trae form-name", () => {
    const result = parse({ "form-name": undefined });

    expect("comment" in result).toBe(true);
  });

  it("ignora otro formulario", () => {
    expect(parse({ "form-name": "reportar-problema" })).toEqual({
      skipped: "other-form"
    });
  });

  it("ignora un envío con el honeypot lleno", () => {
    expect(parse({ "opinion-empresa": "ACME" })).toEqual({ skipped: "honeypot" });
  });

  it.each(["anonimo", "", undefined, "Publico", "publico "])(
    "ignora visibilidad %j",
    (visibilidad) => {
      expect(parse({ visibilidad })).toEqual({ skipped: "not-public" });
    }
  );

  it.each(["Historia-A", "historia a", "../historia-a", "", undefined, "-a", "a--b"])(
    "ignora la historia con forma inválida %j",
    (historia) => {
      expect(parse({ historia })).toEqual({ skipped: "invalid-story" });
    }
  );

  it("ignora una historia que no está publicada", () => {
    expect(parse({ historia: "historia-z" })).toEqual({
      skipped: "unpublished-story"
    });
  });

  it("ignora un envío público sin nombre o sin comentario", () => {
    expect(parse({ nombre: "" })).toEqual({ skipped: "invalid-length" });
    expect(parse({ comentario: undefined })).toEqual({ skipped: "invalid-length" });
  });

  it("propaga el motivo de las reglas de contenido", () => {
    expect(parse({ comentario: "mira https://spam.pe" })).toEqual({
      skipped: "contains-link"
    });
    expect(parse({ nombre: "Moderador" })).toEqual({ skipped: "reserved-name" });
  });
});
