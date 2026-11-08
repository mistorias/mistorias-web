import { describe, expect, it } from "vitest";
import { commentId } from "../src/lib/comments/comment-id";

describe("commentId", () => {
  it("es un valor fijo de 16 hexadecimales para una entrada dada", () => {
    expect(commentId("historia-a", "Rosa", "Gracias.")).toBe("4869fe91dadc8779");
  });

  it("repetir la entrada repite el id", () => {
    expect(commentId("historia-a", "Rosa", "Gracias.")).toBe(
      commentId("historia-a", "Rosa", "Gracias.")
    );
  });

  it.each([
    ["otra historia", ["historia-b", "Rosa", "Gracias."]],
    ["otro autor", ["historia-a", "Rosita", "Gracias."]],
    ["otro texto", ["historia-a", "Rosa", "Gracias!"]]
  ])("cambia con %s", (_label, [story, author, text]) => {
    expect(commentId(story, author, text)).not.toBe(
      commentId("historia-a", "Rosa", "Gracias.")
    );
  });

  it("no confunde dónde termina un campo y empieza el siguiente", () => {
    expect(commentId("historia-a", "Ro", "sa Gracias.")).not.toBe(
      commentId("historia-a", "Rosa", " Gracias.")
    );
  });
});
