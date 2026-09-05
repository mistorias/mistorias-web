import { describe, expect, it } from "vitest";
import { AUTHORSHIP_VALUES, storySchema } from "../src/lib/content/schema";

const validFrontmatter = {
  title: "Historia validada",
  summary: "Resumen breve de prueba",
  date: "2026-04-26",
  author: "paolo-carrasco",
  authorship: "escrito-con-ia",
  themes: ["educacion", "comunidad"]
};

describe("storySchema", () => {
  it("acepta el frontmatter completo de una historia", () => {
    const parsed = storySchema.parse(validFrontmatter);

    expect(parsed.title).toBe("Historia validada");
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.themes).toEqual(["educacion", "comunidad"]);
  });

  it("rechaza el frontmatter sin título", () => {
    const { title, ...withoutTitle } = validFrontmatter;

    expect(() => storySchema.parse(withoutTitle)).toThrow();
  });

  it("asume una lista de temas vacía cuando no se declara", () => {
    const { themes, ...withoutThemes } = validFrontmatter;

    expect(storySchema.parse(withoutThemes).themes).toEqual([]);
  });

  // Respaldo temporal: las historias ya publicadas en mistorias-contenido
  // todavía declaran `tags`. Esta prueba se borra junto con el respaldo.
  it("lee `tags` como temas mientras el contenido migra a `themes`", () => {
    const { themes, ...withoutThemes } = validFrontmatter;
    const parsed = storySchema.parse({
      ...withoutThemes,
      tags: ["junin", "docentes"]
    });

    expect(parsed.themes).toEqual(["junin", "docentes"]);
  });

  it("prefiere `themes` cuando la historia declara las dos claves", () => {
    const parsed = storySchema.parse({
      ...validFrontmatter,
      tags: ["clave-vieja"]
    });

    expect(parsed.themes).toEqual(["educacion", "comunidad"]);
  });

  it("no exige imageAlt/imageCredit/imageLicense cuando no hay imagen", () => {
    const parsed = storySchema.parse(validFrontmatter);

    expect(parsed.imageAlt).toBeUndefined();
    expect(parsed.imageCredit).toBeUndefined();
    expect(parsed.imageLicense).toBeUndefined();
  });

  it("acepta imageAlt/imageCredit/imageLicense cuando la historia los declara", () => {
    const parsed = storySchema.parse({
      ...validFrontmatter,
      imageAlt: "Descripción de la imagen",
      imageCredit: "Mistorias",
      imageLicense: "CC BY-NC 4.0"
    });

    expect(parsed.imageAlt).toBe("Descripción de la imagen");
    expect(parsed.imageCredit).toBe("Mistorias");
    expect(parsed.imageLicense).toBe("CC BY-NC 4.0");
  });

  it("convierte el autor en una referencia a la colección de fichas", () => {
    const parsed = storySchema.parse(validFrontmatter);

    expect(parsed.author).toEqual({
      collection: "authors",
      id: "paolo-carrasco"
    });
  });

  it("exige que la historia declare quién hizo qué con la IA", () => {
    const { authorship, ...withoutAuthorship } = validFrontmatter;

    expect(() => storySchema.parse(withoutAuthorship)).toThrow();
  });

  it("acepta las tres etiquetas de autoría y ninguna más", () => {
    for (const value of AUTHORSHIP_VALUES) {
      expect(
        storySchema.parse({ ...validFrontmatter, authorship: value }).authorship
      ).toBe(value);
    }

    expect(() =>
      storySchema.parse({ ...validFrontmatter, authorship: "hecho-por-robots" })
    ).toThrow();
  });

  it("rechaza imageAlt vacío", () => {
    expect(() =>
      storySchema.parse({ ...validFrontmatter, imageAlt: "" })
    ).toThrow();
  });
});
