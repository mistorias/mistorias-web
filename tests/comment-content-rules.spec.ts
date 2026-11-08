import { describe, expect, it } from "vitest";
import {
  checkCommentContent,
  normalizeAuthor,
  normalizeText
} from "../src/lib/comments/content-rules";

describe("normalizeText", () => {
  it("quita los espacios de los extremos", () => {
    expect(normalizeText("  hola  ")).toBe("hola");
  });

  it("conserva un salto de línea y limita los seguidos a dos", () => {
    expect(normalizeText("uno\ndos\n\n\n\n\ntres")).toBe("uno\ndos\n\ntres");
  });

  it("convierte los saltos de Windows y de Mac en saltos de línea", () => {
    expect(normalizeText("uno\r\ndos\rtres")).toBe("uno\ndos\ntres");
  });

  it("convierte el tabulador en espacio", () => {
    expect(normalizeText("uno\tdos")).toBe("uno dos");
  });

  it("elimina los caracteres de control", () => {
    expect(normalizeText("ho\u0000la\u0007")).toBe("hola");
  });

  it("elimina los invisibles y los que invierten la dirección del texto", () => {
    expect(normalizeText("a​b‮c⁦d﻿e")).toBe("abcde");
  });

  it("convierte los separadores de línea y de párrafo de Unicode en saltos de línea", () => {
    expect(normalizeText("uno\u2028dos\u2029tres")).toBe("uno\ndos\ntres");
  });

  it("normaliza a NFC", () => {
    expect(normalizeText("café")).toBe("café");
  });
});

describe("normalizeAuthor", () => {
  it("colapsa los espacios y los saltos de línea en un solo espacio", () => {
    expect(normalizeAuthor("  Rosa \n\n  Quispe\t ")).toBe("Rosa Quispe");
  });

  it("elimina los invisibles y normaliza a NFC", () => {
    expect(normalizeAuthor("José​")).toBe("José");
  });
});

describe("checkCommentContent", () => {
  it("acepta un comentario normal y lo devuelve normalizado", () => {
    expect(
      checkCommentContent({ author: " Rosa  Quispe ", text: " Gracias.\n\n\n\nMucho. " })
    ).toEqual({ author: "Rosa Quispe", text: "Gracias.\n\nMucho." });
  });

  it("acepta un nombre de 60 caracteres y un texto de 1500", () => {
    expect(
      checkCommentContent({ author: "a".repeat(60), text: "b".repeat(1500) })
    ).toEqual({ author: "a".repeat(60), text: "b".repeat(1500) });
  });

  it.each([
    ["nombre vacío", { author: "", text: "hola" }],
    ["nombre solo con invisibles", { author: "​ \n", text: "hola" }],
    ["nombre de 61 caracteres", { author: "a".repeat(61), text: "hola" }],
    ["texto vacío", { author: "Rosa", text: "  " }],
    ["texto de 1501 caracteres", { author: "Rosa", text: "b".repeat(1501) }]
  ])("rechaza por largo: %s", (_label, input) => {
    expect(checkCommentContent(input)).toEqual({ skipped: "invalid-length" });
  });

  it.each([
    "visita https://spam.pe ahora",
    "visita http://spam.pe",
    "HTTPS://SPAM.PE",
    "entra a www.spam",
    "escribe a spam.com",
    "SPAM.COM",
    "spam.pe/oferta",
    "mira algo.net",
    "algo.org",
    "algo.io",
    "algo.info",
    "algo.xyz",
    "algo.ly",
    "algo.me",
    "algo.co",
    "algo.app",
    "algo.site",
    "algo.online",
    "algo.link"
  ])("rechaza el enlace en «%s»", (text) => {
    expect(checkCommentContent({ author: "Rosa", text })).toEqual({
      skipped: "contains-link"
    });
  });

  it("detecta un enlace en el nombre", () => {
    expect(checkCommentContent({ author: "spam.com", text: "hola" })).toEqual({
      skipped: "contains-link"
    });
  });

  it.each(["escribeme a rosa@ejemplo.pe", "a@b.c"])(
    "rechaza el correo en «%s»",
    (text) => {
      expect(checkCommentContent({ author: "Rosa", text })).toEqual({
        skipped: "contains-email"
      });
    }
  );

  it("no confunde una frase con puntos con un enlace", () => {
    const text = "Gracias. Lo leí en la escuela.Muy bien... y 3.5 de nota.";
    expect(checkCommentContent({ author: "Rosa", text })).toEqual({
      author: "Rosa",
      text
    });
  });

  it.each([
    "Mistorias",
    "MISTORIAS",
    "Equipo Mistorias",
    "Mîstörías oficial",
    "m i s t o r i a s",
    "Moderador",
    "moderadora",
    "Admin",
    "ADMINISTRADOR",
    "administradora",
    "Equipo",
    "M.o.d.e.r.a.d.o.r",
    "ａｄｍｉｎ"
  ])("rechaza el nombre reservado «%s»", (author) => {
    expect(checkCommentContent({ author, text: "hola" })).toEqual({
      skipped: "reserved-name"
    });
  });

  it.each(["Rosa Equipo Quispe", "Admina Quispe", "Equipos"])(
    "acepta el nombre «%s», que solo se parece a uno reservado",
    (author) => {
      expect(checkCommentContent({ author, text: "hola" })).toEqual({
        author,
        text: "hola"
      });
    }
  );
});
