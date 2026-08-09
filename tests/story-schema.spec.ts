import { describe, expect, it } from "vitest";
import { storySchema } from "../src/lib/content/schema";

const validFrontmatter = {
  title: "Historia validada",
  summary: "Resumen breve de prueba",
  date: "2026-04-26",
  author: "Equipo Mistorias",
  tags: ["educacion", "comunidad"]
};

describe("storySchema", () => {
  it("acepta el frontmatter completo de una historia", () => {
    const parsed = storySchema.parse(validFrontmatter);

    expect(parsed.title).toBe("Historia validada");
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.tags).toEqual(["educacion", "comunidad"]);
  });

  it("rechaza el frontmatter sin título", () => {
    const { title, ...withoutTitle } = validFrontmatter;

    expect(() => storySchema.parse(withoutTitle)).toThrow();
  });

  it("asume una lista de tags vacía cuando no se declara", () => {
    const { tags, ...withoutTags } = validFrontmatter;

    expect(storySchema.parse(withoutTags).tags).toEqual([]);
  });
});
