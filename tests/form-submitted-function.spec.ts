import { afterEach, describe, expect, it, vi } from "vitest";
import formSubmittedFunction from "../netlify/functions/form-submitted";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("función formSubmitted de Netlify", () => {
  it("registra un envío anónimo sin llamar a la red", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await formSubmittedFunction.formSubmitted({
      data: { "form-name": "opinion-historia", visibilidad: "anonimo" }
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith('{"event":"comment-skipped","reason":"not-public"}');
  });

  it("solo publica comentarios de historias que existen en data/story-order.json", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await formSubmittedFunction.formSubmitted({
      data: {
        "form-name": "opinion-historia",
        visibilidad: "publico",
        historia: "una-historia-inventada",
        nombre: "Rosa",
        comentario: "Hola"
      }
    });

    expect(info).toHaveBeenCalledWith(
      '{"event":"comment-skipped","reason":"unpublished-story"}'
    );
  });

  it("sin configuración de la App lo registra y termina sin error", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.stubEnv("COMMENTS_GITHUB_APP_ID", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const publishedStory = (await import("../data/story-order.json")).default.order[0];

    await formSubmittedFunction.formSubmitted({
      data: {
        "form-name": "opinion-historia",
        visibilidad: "publico",
        historia: publishedStory,
        nombre: "Rosa",
        comentario: "Hola"
      }
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledWith('{"event":"comments-misconfigured"}');
  });
});
