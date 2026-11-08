import { afterEach, describe, expect, it, vi } from "vitest";
import OpinionHistoria from "../src/components/OpinionHistoria.astro";
import { renderAstroComponent } from "./support/render-astro-component";

afterEach(() => {
  vi.unstubAllEnvs();
});

function render(): Promise<string> {
  return renderAstroComponent(OpinionHistoria, {
    props: { historiaId: "historia-de-prueba" }
  });
}

function inputTag(html: string, attribute: string): string {
  const match = html.match(new RegExp(`<input[^>]*${attribute}[^>]*>`));
  if (!match) {
    throw new Error(`No hay un <input> con ${attribute}`);
  }
  return match[0];
}

describe("OpinionHistoria", () => {
  it("mantiene el formulario de Netlify con su honeypot, su nombre y la historia", async () => {
    const html = await render();

    expect(html).toContain('name="opinion-historia"');
    expect(html).toContain('data-netlify="true"');
    expect(html).toContain('netlify-honeypot="opinion-empresa"');
    expect(html).toContain('name="form-name" value="opinion-historia"');
    expect(html).toContain('name="historia" value="historia-de-prueba"');
    expect(html).toContain('name="opinion-empresa"');
  });

  it("sigue pidiendo la calificación y nunca dice que se publica", async () => {
    const html = await render();

    expect(html.match(/name="calificacion"/g)).toHaveLength(5);
    expect(inputTag(html, 'value="3"')).toContain("required");
    expect(html).toContain("solo cuenta para el promedio");
  });

  it("limita el comentario a 1500 caracteres", async () => {
    const html = await render();

    expect(html).toMatch(/<textarea[^>]*maxlength="1500"/);
  });

  it("pregunta quién puede leer el comentario con dos opciones y anónimo marcado", async () => {
    const html = await render();

    expect(html).toContain("¿Quién puede leer tu comentario?");
    expect(html.match(/name="visibilidad"/g)).toHaveLength(2);
    expect(inputTag(html, 'value="anonimo"')).toContain("checked");
    expect(inputTag(html, 'value="publico"')).not.toContain("checked");
    expect(html).toContain("Solo el equipo de Mistorias. Es anónimo y no se publica");
    expect(html).toContain("Todos: publícalo bajo la historia con mi nombre");
  });

  it("pide el nombre con límite de 60 caracteres y autocompletado de nombre, sin obligarlo", async () => {
    const html = await render();
    const nameInput = inputTag(html, 'name="nombre"');

    expect(nameInput).toContain('maxlength="60"');
    expect(nameInput).toContain('autocomplete="name"');
    expect(nameInput).not.toContain("required");
    expect(html).toContain('for="opinion-nombre-historia-de-prueba"');
  });

  it("explica qué se publica, que se revisa en público en GitHub y cómo retirarlo", async () => {
    const html = await render();

    expect(html).toContain("Para publicarlo necesitamos tu nombre y tu comentario.");
    expect(html).toContain("Los comentarios con enlaces o correos no se publican.");
    expect(html).toContain("Lo revisamos en público, en GitHub");
    expect(html).toContain("ese registro no se puede borrar");
    expect(html).toContain("Para retirarlo después, escríbenos desde");
  });

  it("enlaza «Reportar un problema» con la ruta del sitio y respeta la base", async () => {
    vi.stubEnv("BASE_URL", "/mistorias-web/");

    const html = await render();

    expect(html).toMatch(/<a href="\/mistorias-web\/reportar\/"[^>]*>Reportar un problema<\/a>/);
  });

  it("envía el formulario a la página de gracias", async () => {
    const html = await render();

    expect(html).toContain('action="/gracias/"');
  });
});
