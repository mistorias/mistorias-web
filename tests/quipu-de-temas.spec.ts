import { describe, expect, it } from "vitest";
import type { CollectionEntry } from "astro:content";
import { renderAstroComponent } from "./support/render-astro-component";
import { buildStoryFixture } from "./support/story-fixture";
import QuipuDeTemas from "../src/components/QuipuDeTemas.astro";
import type { InitialGroup } from "../src/lib/themes";

type Letter = InitialGroup<CollectionEntry<"stories">>;

const stories = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    buildStoryFixture({ id: `historia-${index}` })
  );

const letter = (
  initial: string,
  themes: readonly (readonly [string, number])[]
): Letter => ({
  initial,
  themes: themes.map(([theme, count]) => ({ theme, stories: stories(count) }))
});

const render = (letras: readonly Letter[]) =>
  renderAstroComponent(QuipuDeTemas, { props: { letras } });

const countOf = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;

describe("QuipuDeTemas", () => {
  it("abre cada letra en un <details> desplegado al cargar", async () => {
    const html = await render([
      letter("A", [["arequipa", 1]]),
      letter("D", [["docentes", 1]])
    ]);

    expect(countOf(html, /<details[^>]*\sopen/g)).toBe(2);
  });

  it("pone el ancla de cada letra en su elemento de la lista", async () => {
    const html = await render([letter("Ñ", [["ñuñoa", 1]])]);

    expect(html).toMatch(/<li[^>]*id="letra-ñ"/);
  });

  it("rotula cada letra con la cantidad de temas que agrupa", async () => {
    const html = await render([
      letter("A", [
        ["america-latina", 1],
        ["arequipa", 2]
      ]),
      letter("J", [["junin", 1]])
    ]);

    expect(html).toMatch(/<h2[^>]*>A<\/h2>/);
    expect(html).toContain(">2 temas<");
    expect(html).toContain(">1 tema<");
  });

  it("enlaza cada tema a su página, en el orden recibido", async () => {
    const html = await render([
      letter("A", [
        ["america-latina", 1],
        ["arequipa", 1]
      ])
    ]);

    const first = html.search(/href="[^"]*\/temas\/america-latina\/"/);
    const second = html.search(/href="[^"]*\/temas\/arequipa\/"/);

    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
  });

  it("dibuja un nudo por historia del tema y anota cuántas son", async () => {
    const html = await render([letter("A", [["arequipa", 3]])]);

    expect(countOf(html, /class="nudo-de-quipu__hueco"/g)).toBe(3);
    expect(html).toContain(">3 historias<");
  });

  it("reparte los nudos a espacio parejo, porque la fila no tiene rótulo", async () => {
    const html = await render([letter("A", [["arequipa", 1]])]);

    expect(html).toContain("top: 50%");
  });

  it("redondea la cuerda arriba en el primer tema y abajo en el último", async () => {
    const html = await render([
      letter("A", [
        ["america-latina", 1],
        ["ancash", 1],
        ["arequipa", 1]
      ])
    ]);

    const roundings = [...html.matchAll(/nudo-de-quipu--(\w+)/g)].map(
      (match) => match[1]
    );

    expect(roundings).toEqual(["arriba", "ninguno", "abajo"]);
  });

  it("redondea ambos extremos cuando la letra tiene un solo tema", async () => {
    const html = await render([letter("J", [["junin", 1]])]);

    expect(html).toContain("nudo-de-quipu--ambos");
  });
});
