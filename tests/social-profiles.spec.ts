import { describe, expect, it } from "vitest";
import { SOCIAL_PROFILES } from "../src/lib/social/profiles";

// Las URLs de las redes viven en un solo lugar: el pie las consume desde acá
// y un cambio de usuario en una red se corrige una sola vez (issue #148).
describe("SOCIAL_PROFILES", () => {
  it("declara Instagram, Facebook y X, en ese orden", () => {
    expect(SOCIAL_PROFILES.map((perfil) => perfil.network)).toEqual([
      "instagram",
      "facebook",
      "x",
    ]);
  });

  it("apunta a los perfiles oficiales de Mistorias", () => {
    expect(SOCIAL_PROFILES.map((perfil) => perfil.url)).toEqual([
      "https://www.instagram.com/mistorias.pe",
      "https://www.facebook.com/mistorias.pe/",
      "https://x.com/mistoriaspe",
    ]);
  });

  it("da a cada red el nombre con el que la conoce quien lee", () => {
    expect(SOCIAL_PROFILES.map((perfil) => perfil.label)).toEqual([
      "Instagram",
      "Facebook",
      "X",
    ]);
  });
});
