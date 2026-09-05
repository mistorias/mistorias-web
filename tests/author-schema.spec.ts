import { describe, expect, it } from "vitest";
import { authorSchema } from "../src/lib/content/schema";

const validFrontmatter = {
  name: "Paolo Carrasco",
  bio: "Escribe Mistorias desde Barcelona, con raíces arequipeñas."
};

describe("authorSchema", () => {
  it("acepta una ficha con lo mínimo: nombre y una línea de bio", () => {
    const parsed = authorSchema.parse(validFrontmatter);

    expect(parsed.name).toBe("Paolo Carrasco");
    expect(parsed.link).toBeUndefined();
    expect(parsed.linkLabel).toBeUndefined();
  });

  it("rechaza una ficha sin nombre", () => {
    const { name, ...withoutName } = validFrontmatter;

    expect(() => authorSchema.parse(withoutName)).toThrow();
  });

  it("rechaza una bio vacía", () => {
    expect(() => authorSchema.parse({ ...validFrontmatter, bio: "" })).toThrow();
  });

  it("acepta el enlace de verificación cuando trae su rótulo", () => {
    const parsed = authorSchema.parse({
      ...validFrontmatter,
      link: "https://www.instagram.com/paolocarrasco",
      linkLabel: "Instagram"
    });

    expect(parsed.link).toBe("https://www.instagram.com/paolocarrasco");
    expect(parsed.linkLabel).toBe("Instagram");
  });

  // Un enlace sin rótulo no se puede escribir de forma accesible y un rótulo
  // sin enlace no lleva a ninguna parte: van juntos o no van.
  it("rechaza el enlace sin rótulo", () => {
    expect(() =>
      authorSchema.parse({ ...validFrontmatter, link: "https://ejemplo.pe" })
    ).toThrow();
  });

  it("rechaza el rótulo sin enlace", () => {
    expect(() =>
      authorSchema.parse({ ...validFrontmatter, linkLabel: "Instagram" })
    ).toThrow();
  });

  it("rechaza un enlace que no es una URL", () => {
    expect(() =>
      authorSchema.parse({
        ...validFrontmatter,
        link: "instagram.com/paolocarrasco",
        linkLabel: "Instagram"
      })
    ).toThrow();
  });
});
