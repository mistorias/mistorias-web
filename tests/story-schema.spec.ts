import { describe, expect, it } from "vitest";
import { storySchema } from "../src/lib/content/schema";

const validFrontmatter = {
  title: "Historia validada",
  summary: "Resumen breve de prueba",
  date: "2026-04-26",
  author: "Equipo Mistorias",
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
});
