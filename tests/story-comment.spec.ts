import { describe, expect, it } from "vitest";
import {
  assertStoryCommentIsValid,
  COMMENT_FILENAME_PATTERN,
  commentFilename,
  storyCommentSchema
} from "../src/lib/content/story-comment";

const FILE_PATH = "stories/valid-story/comentario-0123456789abcdef.json";

const validComment = {
  story: "valid-story",
  id: "0123456789abcdef",
  author: "Rosa Quispe",
  text: "Me hizo pensar en mi abuela.\nGracias por contarla.",
  submittedAt: "2026-11-02T15:30:00-05:00"
};

function assertValid(overrides: Record<string, unknown> = {}): void {
  assertStoryCommentIsValid(
    JSON.stringify({ ...validComment, ...overrides }),
    "valid-story",
    "comentario-0123456789abcdef.json",
    FILE_PATH
  );
}

describe("commentFilename", () => {
  it("arma el nombre del archivo a partir del id", () => {
    expect(commentFilename("0123456789abcdef")).toBe(
      "comentario-0123456789abcdef.json"
    );
  });
});

describe("COMMENT_FILENAME_PATTERN", () => {
  it("acepta comentario-<16 hex>.json y captura el id", () => {
    const match = COMMENT_FILENAME_PATTERN.exec("comentario-0123456789abcdef.json");
    expect(match?.[1]).toBe("0123456789abcdef");
  });

  it.each([
    "Comentario-0123456789abcdef.json",
    "comentario-0123456789abcdef.yml",
    "comentario-0123456789ABCDEF.json",
    "comentario-0123456789abcde.json",
    "comentario-0123456789abcdef0.json",
    "xcomentario-0123456789abcdef.json",
    "comentario-0123456789abcdef.json.md"
  ])("rechaza %s", (name) => {
    expect(COMMENT_FILENAME_PATTERN.test(name)).toBe(false);
  });
});

describe("storyCommentSchema", () => {
  it("acepta un comentario completo", () => {
    expect(storyCommentSchema.safeParse(validComment).success).toBe(true);
  });

  it("acepta los límites exactos de autor y texto", () => {
    const result = storyCommentSchema.safeParse({
      ...validComment,
      author: "a".repeat(60),
      text: "b".repeat(1500)
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["autor vacío", { author: "" }],
    ["autor de 61 caracteres", { author: "a".repeat(61) }],
    ["texto vacío", { text: "" }],
    ["texto de 1501 caracteres", { text: "b".repeat(1501) }],
    ["fecha sin zona horaria", { submittedAt: "2026-11-02T15:30:00" }],
    ["fecha que no es fecha", { submittedAt: "ayer" }],
    ["id con mayúsculas", { id: "0123456789ABCDEF" }],
    ["id corto", { id: "0123" }],
    ["historia vacía", { story: "" }],
    ["historia con ruta", { story: "../otra" }]
  ])("rechaza %s", (_label, overrides) => {
    expect(
      storyCommentSchema.safeParse({ ...validComment, ...overrides }).success
    ).toBe(false);
  });
});

describe("assertStoryCommentIsValid", () => {
  it("acepta un comentario válido en su carpeta", () => {
    expect(() => assertValid()).not.toThrow();
  });

  it("rechaza un archivo que no es JSON", () => {
    expect(() =>
      assertStoryCommentIsValid(
        "{ no es json",
        "valid-story",
        "comentario-0123456789abcdef.json",
        FILE_PATH
      )
    ).toThrow(`${FILE_PATH}: comentario-0123456789abcdef.json no es JSON válido.`);
  });

  it("rechaza un campo que el esquema no declara", () => {
    expect(() => assertValid({ html: "<script></script>" })).toThrow(
      /comentario-0123456789abcdef\.json no cumple el esquema/
    );
  });

  it("rechaza un campo con el tipo equivocado", () => {
    expect(() => assertValid({ text: 5 })).toThrow(/no cumple el esquema/);
  });

  it("rechaza un comentario cuya historia no es la de su carpeta", () => {
    expect(() => assertValid({ story: "otra-historia" })).toThrow(
      `${FILE_PATH}: el comentario dice "otra-historia" pero está en la carpeta de "valid-story".`
    );
  });

  it("rechaza un comentario cuyo id no es el de su nombre de archivo", () => {
    expect(() => assertValid({ id: "fedcba9876543210" })).toThrow(
      `${FILE_PATH}: el id "fedcba9876543210" no coincide con el del nombre del archivo ("0123456789abcdef").`
    );
  });
});
