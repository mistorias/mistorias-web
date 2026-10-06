import { describe, expect, it } from "vitest";
import { AUTHORSHIP_VALUES, storySchema } from "../src/lib/content/schema";

const validFrontmatter = {
  title: "Historia validada",
  summary: "Resumen breve de prueba que tiene que ser un poco largo",
  date: "2026-04-26",
  author: "mateo-salazar",
  authorship: "escrito-con-ia",
  readingTimeMinutes: 4,
  themes: ["educacion", "comunidad"]
};

describe("storySchema", () => {
  it("acepta el frontmatter completo de una historia", () => {
    const parsed = storySchema.parse(validFrontmatter);

    expect(parsed.title).toBe("Historia validada");
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.themes).toEqual(["educacion", "comunidad"]);
  });

  it("conserva el tiempo de lectura en minutos", () => {
    expect(storySchema.parse(validFrontmatter).readingTimeMinutes).toBe(4);
  });

  it("rechaza el frontmatter sin tiempo de lectura", () => {
    const { readingTimeMinutes, ...withoutReadingTime } = validFrontmatter;

    expect(() => storySchema.parse(withoutReadingTime)).toThrow();
  });

  // El campo lo calcula un script de mistorias-contenido y es solo el número:
  // "4 min" o "4" obligaría a cada cliente a interpretar la unidad, y 0 o un
  // decimal no son un tiempo de lectura que el sitio pueda mostrar.
  it.each([0, -1, 2.5, "4", "4 min"])(
    "rechaza %j como tiempo de lectura",
    (readingTimeMinutes) => {
      expect(() =>
        storySchema.parse({ ...validFrontmatter, readingTimeMinutes })
      ).toThrow();
    }
  );

  it("rechaza el frontmatter sin título", () => {
    const { title, ...withoutTitle } = validFrontmatter;

    expect(() => storySchema.parse(withoutTitle)).toThrow();
  });

  it.each([
    {
      title: "Título corto"
    },
    {
      summary: "Resumen corto"
    },
    {
      imageAlt: "N"
    },
    {
      imageCredit: "N"
    },
    {
      imageLicense: "N"
    }
  ])('rechaza el frontmatter cuando el texto de título tiene menor longitud a la permitida', (frontmatterWithShortTextAttribute) => {
    const faultyFrontmatter = {
      ...validFrontmatter,
      ...frontmatterWithShortTextAttribute
    };
    expect(() => storySchema.parse(faultyFrontmatter)).toThrow();
  });

  it("asume una lista de temas vacía cuando no se declara", () => {
    const { themes, ...withoutThemes } = validFrontmatter;

    expect(storySchema.parse(withoutThemes).themes).toEqual([]);
  });

  it("ya no lee `tags` como temas", () => {
    const { themes, ...withoutThemes } = validFrontmatter;
    const parsed = storySchema.parse({
      ...withoutThemes,
      tags: ["junin", "docentes"]
    });

    expect(parsed.themes).toEqual([]);
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
      id: "mateo-salazar"
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
