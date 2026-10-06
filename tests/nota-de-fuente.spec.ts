import { describe, expect, it } from "vitest";
import NotaDeFuente from "../src/components/NotaDeFuente.astro";
import { renderAstroComponent } from "./support/render-astro-component";
import { visibleText } from "./support/visible-text";

const props = {
  fuente: "el README del repositorio del sitio",
  href: "https://github.com/mistorias/mistorias-web/blob/main/README.md",
};

describe("NotaDeFuente", () => {
  it("enlaza el documento que resume con su nombre y su dirección", async () => {
    const html = await renderAstroComponent(NotaDeFuente, { props });

    expect(html).toContain(`href="${props.href}"`);
    expect(visibleText(html)).toContain(props.fuente);
  });

  it("abre el documento en una pestaña nueva avisándolo, como todo enlace externo", async () => {
    const html = await renderAstroComponent(NotaDeFuente, { props });

    expect(html).toContain('target="_blank"');
    expect(html).toContain("(se abre en una pestaña nueva)");
  });
});
