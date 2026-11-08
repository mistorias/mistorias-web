import { describe, expect, it } from "vitest";
import {
  buildCommentPullRequest,
  fenceFor
} from "../src/lib/comments/comment-pull-request";

const comment = {
  story: "historia-a",
  id: "0123456789abcdef",
  author: "Rosa Quispe",
  text: "Me hizo pensar en mi abuela.\nGracias.",
  submittedAt: "2026-11-08T20:15:00.000Z"
};

describe("fenceFor", () => {
  it("usa tres backticks si el texto no trae ninguno", () => {
    expect(fenceFor("hola")).toBe("```");
  });

  it("usa una cerca más larga que la secuencia de backticks más larga del texto", () => {
    expect(fenceFor("antes ``` después")).toBe("````");
    expect(fenceFor("`` y ````` y `")).toBe("``````");
  });

  it("mantiene tres backticks cuando el texto solo trae secuencias cortas", () => {
    expect(fenceFor("`uno` ``dos``")).toBe("```");
  });
});

describe("buildCommentPullRequest", () => {
  // Se arma dentro de cada test: Stryker solo atribuye mutantes a lo que corre
  // en un test, no a lo que corre al recolectarlos.
  const build = () => buildCommentPullRequest(comment);

  it("arma la rama y la ruta solo con la historia y el id", () => {
    const pullRequest = build();
    expect(pullRequest.branch).toBe("comentarios/historia-a-0123456789abcdef");
    expect(pullRequest.path).toBe(
      "stories/historia-a/comentario-0123456789abcdef.json"
    );
  });

  it("escribe el contenido como JSON indentado con salto de línea final", () => {
    const pullRequest = build();
    expect(pullRequest.contents).toBe(
      [
        "{",
        '  "story": "historia-a",',
        '  "id": "0123456789abcdef",',
        '  "author": "Rosa Quispe",',
        '  "text": "Me hizo pensar en mi abuela.\\nGracias.",',
        '  "submittedAt": "2026-11-08T20:15:00.000Z"',
        "}",
        ""
      ].join("\n")
    );
  });

  it("usa un título y un mensaje de commit fijos que no traen datos del lector", () => {
    const pullRequest = build();
    expect(pullRequest.title).toBe("Comentario de lector en «historia-a»");
    expect(pullRequest.commitMessage).toBe(
      "chore(comentarios): llega un comentario de lector en «historia-a»"
    );
  });

  it("pone el nombre y el texto en cercas de código y explica cómo moderar", () => {
    const pullRequest = build();
    expect(pullRequest.body).toBe(
      [
        "Un lector pidió publicar este comentario bajo «historia-a».",
        "",
        "**Fusionar = aprobar · Cerrar = rechazar**",
        "",
        "Nombre:",
        "",
        "```",
        "Rosa Quispe",
        "```",
        "",
        "Comentario:",
        "",
        "```",
        "Me hizo pensar en mi abuela.",
        "Gracias.",
        "```",
        ""
      ].join("\n")
    );
  });

  it("no deja que el texto cierre la cerca ni se renderice como Markdown o HTML", () => {
    const hostile = buildCommentPullRequest({
      ...comment,
      author: "```\n@admin",
      text: "```\n@usuario <img src=https://rastreo.test/x.png>\n![](https://rastreo.test/y.png)\n````"
    });

    expect(hostile.body).toContain(
      "````\n```\n@admin\n````\n"
    );
    expect(hostile.body).toContain(
      "`````\n```\n@usuario <img src=https://rastreo.test/x.png>\n![](https://rastreo.test/y.png)\n````\n`````\n"
    );
    expect(hostile.title).toBe("Comentario de lector en «historia-a»");
  });

  it("rechaza un comentario que no cumple el esquema antes de armar nada", () => {
    expect(() =>
      buildCommentPullRequest({ ...comment, story: "../otra" })
    ).toThrow();
  });
});
