import { describe, expect, it } from "vitest";
import {
  buildShareLinks,
  X_TEXT_LIMIT,
  type ShareLink,
} from "../src/lib/social/share-links";

const story = {
  url: "https://mistorias.pe/historias/el-aula-de-madera/",
  title: "El aula de madera donde Ximena aprende",
  summary:
    "Una escuela rural de Cusco enseña con lo que tiene: tablas, lluvia y una maestra que no se rinde.",
  imageUrl: "https://mistorias.pe/_astro/principal.abc123.jpg",
};

const linkFor = (links: readonly ShareLink[], network: string) => {
  const link = links.find((candidate) => candidate.network === network);
  if (link === undefined) throw new Error(`No hay enlace para ${network}`);
  return new URL(link.href);
};

describe("buildShareLinks", () => {
  it("comparte en X, Facebook, Pinterest y LinkedIn, en ese orden", () => {
    expect(buildShareLinks(story).map((link) => link.network)).toEqual([
      "x",
      "facebook",
      "pinterest",
      "linkedin",
    ]);
  });

  // Instagram no tiene una URL web para compartir: solo su app o la Web Share
  // API, que exige JavaScript y la CSP lo prohíbe (issue #151).
  it("no ofrece Instagram, que no se puede compartir sin JavaScript", () => {
    expect(buildShareLinks(story).map((link) => link.network)).not.toContain(
      "instagram"
    );
  });

  it("nombra cada red como la conoce quien lee", () => {
    expect(buildShareLinks(story).map((link) => link.label)).toEqual([
      "X",
      "Facebook",
      "Pinterest",
      "LinkedIn",
    ]);
  });

  it("usa los endpoints de compartir de cada red", () => {
    const links = buildShareLinks(story);

    expect(linkFor(links, "x").origin + linkFor(links, "x").pathname).toBe(
      "https://x.com/intent/post"
    );
    expect(
      linkFor(links, "facebook").origin + linkFor(links, "facebook").pathname
    ).toBe("https://www.facebook.com/sharer/sharer.php");
    expect(
      linkFor(links, "pinterest").origin + linkFor(links, "pinterest").pathname
    ).toBe("https://www.pinterest.com/pin/create/button/");
    expect(
      linkFor(links, "linkedin").origin + linkFor(links, "linkedin").pathname
    ).toBe("https://www.linkedin.com/sharing/share-offsite/");
  });

  it("marca la URL compartida con utm_source de cada red", () => {
    const links = buildShareLinks(story);

    expect(linkFor(links, "x").searchParams.get("url")).toBe(
      `${story.url}?utm_source=x`
    );
    expect(linkFor(links, "facebook").searchParams.get("u")).toBe(
      `${story.url}?utm_source=facebook`
    );
    expect(linkFor(links, "pinterest").searchParams.get("url")).toBe(
      `${story.url}?utm_source=pinterest`
    );
    expect(linkFor(links, "linkedin").searchParams.get("url")).toBe(
      `${story.url}?utm_source=linkedin`
    );
  });

  it("acepta la URL de la historia como objeto URL", () => {
    const links = buildShareLinks({ ...story, url: new URL(story.url) });

    expect(linkFor(links, "x").searchParams.get("url")).toBe(
      `${story.url}?utm_source=x`
    );
  });

  it("lleva título y resumen en el texto de X y en la descripción de Pinterest", () => {
    const links = buildShareLinks(story);
    const expected = `${story.title}\n\n${story.summary}`;

    expect(linkFor(links, "x").searchParams.get("text")).toBe(expected);
    expect(linkFor(links, "pinterest").searchParams.get("description")).toBe(
      expected
    );
  });

  it("pasa a Pinterest la og:image como imagen del pin", () => {
    const links = buildShareLinks(story);

    expect(linkFor(links, "pinterest").searchParams.get("media")).toBe(
      story.imageUrl
    );
  });

  it("codifica tildes, eñes y símbolos para que no rompan la URL", () => {
    const links = buildShareLinks({
      ...story,
      title: "¿Qué aprende Ñusta & su aula?",
    });
    const href = links.find((link) => link.network === "x")?.href ?? "";

    expect(href).not.toMatch(/[¿Ñé ]/u);
    expect(href).toContain("%C2%BFQu%C3%A9");
    expect(href).toContain("%26");
    expect(linkFor(links, "x").searchParams.get("text")).toContain(
      "¿Qué aprende Ñusta & su aula?"
    );
  });

  it("recorta en palabra completa el texto de X para que quepa con la URL en 280 caracteres", () => {
    const longSummary = `${"palabra ".repeat(60)}final`;
    const links = buildShareLinks({ ...story, summary: longSummary });
    const text = linkFor(links, "x").searchParams.get("text") ?? "";

    expect([...text].length).toBeLessThanOrEqual(X_TEXT_LIMIT);
    expect(text.startsWith(`${story.title}\n\n`)).toBe(true);
    expect(text.endsWith("palabra…")).toBe(true);
  });

  it("corta a la fuerza un texto sin espacios antes que pasarse del límite", () => {
    const links = buildShareLinks({
      ...story,
      title: "a".repeat(300),
      summary: "b".repeat(60),
    });
    const text = linkFor(links, "x").searchParams.get("text") ?? "";

    expect([...text].length).toBe(X_TEXT_LIMIT);
    expect(text.endsWith("a…")).toBe(true);
  });

  it("no recorta Pinterest, que admite descripciones más largas", () => {
    const longSummary = `${"palabra ".repeat(60)}final`;
    const links = buildShareLinks({ ...story, summary: longSummary });

    expect(
      linkFor(links, "pinterest").searchParams.get("description")
    ).toContain("final");
  });
});
