import { describe, expect, it } from "vitest";
import {
  firstSectionPlugin,
  firstSectionRange,
  toPlainNode,
} from "../src/lib/content/first-section";

const element = (tagName: string, text: string) => ({
  type: "element",
  tagName,
  properties: {},
  children: [{ type: "text", value: text }],
});
const newline = { type: "text", value: "\n" };

// Lo que cuenta es la estructura, no los títulos: los ejemplos usan nombres
// cualquiera a propósito.
describe("firstSectionRange", () => {
  it("va del primer h2 hasta antes del siguiente", () => {
    const children = [
      element("p", "antes"),
      element("h2", "Uno"),
      newline,
      element("p", "texto"),
      element("h2", "Dos"),
      element("p", "después"),
    ];

    expect(firstSectionRange(children)).toEqual({ start: 1, end: 4 });
  });

  it("no hay sección si hay un solo h2", () => {
    expect(
      firstSectionRange([element("h2", "Uno"), element("p", "texto")])
    ).toBeUndefined();
  });

  it("no hay sección si no hay h2", () => {
    expect(firstSectionRange([element("p", "texto")])).toBeUndefined();
  });

  it("ignora los h3: solo un h2 cierra la sección", () => {
    const children = [
      element("h2", "Uno"),
      element("h3", "Sub"),
      element("h2", "Dos"),
    ];

    expect(firstSectionRange(children)).toEqual({ start: 0, end: 2 });
  });
});

describe("toPlainNode", () => {
  it("copia el subárbol entero, sin lo que no es del nodo", () => {
    // Imita un nodo perezoso de Sätteri: trae campos internos además de los
    // de hast.
    const lazy = {
      _id: 7,
      type: "element",
      tagName: "p",
      properties: { className: ["nota"] },
      children: [{ _id: 8, type: "text", value: "hola" }],
    };

    expect(toPlainNode(lazy)).toEqual({
      type: "element",
      tagName: "p",
      properties: { className: ["nota"] },
      children: [{ type: "text", value: "hola" }],
    });
  });
});

// Un `ctx` falso que anota lo que el plugin le pide a Sätteri.
function recordingContext() {
  const calls: unknown[] = [];
  return {
    calls,
    replaceNode: (node: unknown, newNode: unknown) =>
      calls.push(["replace", node, newNode]),
    removeNode: (node: unknown) => calls.push(["remove", node]),
  };
}

describe("firstSectionPlugin", () => {
  it("cambia el primer h2 por la sección y quita los demás nodos que envolvió", () => {
    const h2 = element("h2", "Uno");
    const text = element("p", "texto");
    const ctx = recordingContext();

    firstSectionPlugin.after(
      { children: [h2, newline, text, element("h2", "Dos")] },
      ctx
    );

    expect(ctx.calls).toEqual([
      [
        "replace",
        h2,
        {
          type: "element",
          tagName: "section",
          properties: { className: ["first-section"] },
          children: [h2, newline, text],
        },
      ],
      ["remove", newline],
      ["remove", text],
    ]);
  });

  it("no pide cambios si no hay sección", () => {
    const ctx = recordingContext();

    firstSectionPlugin.after({ children: [element("p", "texto")] }, ctx);

    expect(ctx.calls).toEqual([]);
  });
});
