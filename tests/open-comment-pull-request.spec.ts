import { describe, expect, it } from "vitest";
import {
  MAX_OPEN_COMMENT_PULL_REQUESTS,
  openCommentPullRequest
} from "../src/lib/comments/open-comment-pull-request";
import { createFakeFetch, jsonResponse, type RecordedCall } from "./support/fake-fetch";

const pullRequest = {
  branch: "comentarios/historia-a-0123456789abcdef",
  path: "stories/historia-a/comentario-0123456789abcdef.json",
  contents: '{\n  "story": "historia-a"\n}\n',
  commitMessage: "chore(comentarios): llega un comentario de lector en «historia-a»",
  title: "Comentario de lector en «historia-a»",
  body: "cuerpo"
};

const REPO = "https://api.github.com/repos/mistorias/mistorias-contenido";

function openPulls(count: number, prefix = "comentarios/") {
  return Array.from({ length: count }, (_, index) => ({
    head: { ref: `${prefix}x-${index}` }
  }));
}

function happyPath(
  options: { pulls?: unknown[]; refStatus?: number; failAt?: string } = {}
) {
  return createFakeFetch((call: RecordedCall) => {
    const key = `${call.method} ${call.url}`;
    if (options.failAt === key) {
      return jsonResponse(500, { message: "boom" });
    }
    if (key === `GET ${REPO}/pulls?state=open&per_page=100`) {
      return jsonResponse(200, options.pulls ?? []);
    }
    if (key === `GET ${REPO}/git/ref/heads/main`) {
      return jsonResponse(200, { object: { sha: "abc123" } });
    }
    if (key === `POST ${REPO}/git/refs`) {
      return jsonResponse(options.refStatus ?? 201, {});
    }
    if (key === `PUT ${REPO}/contents/${pullRequest.path}`) {
      return jsonResponse(201, {});
    }
    if (key === `POST ${REPO}/pulls`) {
      return jsonResponse(201, { number: 42 });
    }
    return jsonResponse(404, { message: `inesperada ${key}` });
  });
}

describe("openCommentPullRequest", () => {
  it("el tope de la cola es 15", () => {
    expect(MAX_OPEN_COMMENT_PULL_REQUESTS).toBe(15);
  });

  it("hace las cinco llamadas a GitHub en orden y devuelve el número del PR", async () => {
    const { fetch, calls } = happyPath();

    const result = await openCommentPullRequest({ fetch, token: "ghs_t", pullRequest });

    expect(result).toEqual({ status: "opened", number: 42 });
    expect(calls.map((call) => `${call.method} ${call.url.replace(REPO, "")}`)).toEqual([
      "GET /pulls?state=open&per_page=100",
      "GET /git/ref/heads/main",
      "POST /git/refs",
      "PUT /contents/stories/historia-a/comentario-0123456789abcdef.json",
      "POST /pulls"
    ]);
  });

  it("cada llamada lleva el token, la versión de la API y un timeout", async () => {
    const { fetch, calls } = happyPath();

    await openCommentPullRequest({ fetch, token: "ghs_t", pullRequest });

    for (const call of calls) {
      expect(call.headers.Authorization).toBe("Bearer ghs_t");
      expect(call.headers["X-GitHub-Api-Version"]).toBe("2022-11-28");
      expect(call.headers.Accept).toBe("application/vnd.github+json");
      expect(call.headers["Content-Type"]).toBe("application/json");
      expect(call.headers["User-Agent"]).toBe("mistorias-comentarios");
      expect(call.hasTimeoutSignal).toBe(true);
    }
  });

  it("crea la rama desde el commit de main, sube el archivo en base64 y abre el PR hacia main", async () => {
    const { fetch, calls } = happyPath();

    await openCommentPullRequest({ fetch, token: "t", pullRequest });

    expect(calls[2].body).toEqual({
      ref: "refs/heads/comentarios/historia-a-0123456789abcdef",
      sha: "abc123"
    });
    expect(calls[3].body).toEqual({
      message: pullRequest.commitMessage,
      content: Buffer.from(pullRequest.contents).toString("base64"),
      branch: pullRequest.branch
    });
    expect(calls[4].body).toEqual({
      title: pullRequest.title,
      head: pullRequest.branch,
      base: "main",
      body: "cuerpo"
    });
  });

  it("solo cuenta los PR abiertos cuya rama empieza por comentarios/", async () => {
    const { fetch } = happyPath({
      pulls: [...openPulls(14), ...openPulls(30, "dependabot/")]
    });

    const result = await openCommentPullRequest({ fetch, token: "t", pullRequest });

    expect(result.status).toBe("opened");
  });

  it("no abre otro PR cuando la cola ya llegó al tope y no llama más a GitHub", async () => {
    const { fetch, calls } = happyPath({ pulls: openPulls(15) });

    const result = await openCommentPullRequest({ fetch, token: "t", pullRequest });

    expect(result).toEqual({ status: "queue-full" });
    expect(calls).toHaveLength(1);
  });

  it("un 422 al crear la rama significa que el comentario ya existe", async () => {
    const { fetch, calls } = happyPath({ refStatus: 422 });

    const result = await openCommentPullRequest({ fetch, token: "t", pullRequest });

    expect(result).toEqual({ status: "duplicate" });
    expect(calls).toHaveLength(3);
  });

  it.each([
    ["GET", "/pulls?state=open&per_page=100"],
    ["GET", "/git/ref/heads/main"],
    ["POST", "/git/refs"],
    ["PUT", `/contents/${pullRequest.path}`],
    ["POST", "/pulls"]
  ])("falla con el estado si %s %s no responde bien", async (method, suffix) => {
    const { fetch } = happyPath({ failAt: `${method} ${REPO}${suffix}` });

    await expect(
      openCommentPullRequest({ fetch, token: "t", pullRequest })
    ).rejects.toThrow("github-500");
  });

  it("propaga un error de red", async () => {
    const fetch = (() => Promise.reject(new TypeError("fetch failed"))) as typeof globalThis.fetch;

    await expect(
      openCommentPullRequest({ fetch, token: "t", pullRequest })
    ).rejects.toThrow("fetch failed");
  });
});
