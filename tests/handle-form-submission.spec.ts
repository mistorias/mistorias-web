import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  handleFormSubmission,
  type CommentLogEntry
} from "../src/lib/comments/handle-form-submission";
import { createFakeFetch, jsonResponse, type RecordedCall } from "./support/fake-fetch";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const env = {
  COMMENTS_GITHUB_APP_ID: "12345",
  COMMENTS_GITHUB_APP_INSTALLATION_ID: "777",
  COMMENTS_GITHUB_APP_PRIVATE_KEY: privateKey
    .export({ type: "pkcs8", format: "pem" })
    .toString()
};

const REPO = "https://api.github.com/repos/mistorias/mistorias-contenido";

const publicData = {
  "form-name": "opinion-historia",
  "opinion-empresa": "",
  historia: "historia-a",
  calificacion: "4",
  visibilidad: "publico",
  nombre: "Rosa Quispe",
  comentario: "Me hizo pensar en mi abuela."
};

function githubFake(options: { pulls?: unknown[]; refStatus?: number } = {}) {
  return createFakeFetch((call: RecordedCall) => {
    const key = `${call.method} ${call.url}`;
    if (key === "POST https://api.github.com/app/installations/777/access_tokens") {
      return jsonResponse(201, { token: "ghs_t" });
    }
    if (key.startsWith(`GET ${REPO}/pulls`)) {
      return jsonResponse(200, options.pulls ?? []);
    }
    if (key === `GET ${REPO}/git/ref/heads/main`) {
      return jsonResponse(200, { object: { sha: "abc" } });
    }
    if (key === `POST ${REPO}/git/refs`) {
      return jsonResponse(options.refStatus ?? 201, {});
    }
    if (key.startsWith(`PUT ${REPO}/contents/`)) {
      return jsonResponse(201, {});
    }
    if (key === `POST ${REPO}/pulls`) {
      return jsonResponse(201, { number: 42 });
    }
    return jsonResponse(404, {});
  });
}

async function run(
  overrides: {
    data?: Record<string, string>;
    env?: Record<string, string | undefined>;
    fakeFetch?: ReturnType<typeof githubFake>;
  } = {}
) {
  const fake = overrides.fakeFetch ?? githubFake();
  const logs: CommentLogEntry[] = [];

  await handleFormSubmission({
    data: overrides.data ?? publicData,
    env: overrides.env ?? env,
    fetch: fake.fetch,
    now: () => new Date("2026-11-08T20:15:00.000Z"),
    publishedStoryIds: ["historia-a"],
    log: (entry) => logs.push(entry)
  });

  return { calls: fake.calls, logs };
}

describe("handleFormSubmission", () => {
  it("un comentario público válido hace seis llamadas y registra el PR abierto", async () => {
    const { calls, logs } = await run();

    expect(calls.map((call) => `${call.method} ${new URL(call.url).pathname}`)).toEqual([
      "POST /app/installations/777/access_tokens",
      "GET /repos/mistorias/mistorias-contenido/pulls",
      "GET /repos/mistorias/mistorias-contenido/git/ref/heads/main",
      "POST /repos/mistorias/mistorias-contenido/git/refs",
      "PUT /repos/mistorias/mistorias-contenido/contents/stories/historia-a/comentario-29bd7912937f98c1.json",
      "POST /repos/mistorias/mistorias-contenido/pulls"
    ]);
    expect(logs).toEqual([{ event: "comment-opened", story: "historia-a", pr: 42 }]);
  });

  it("firma el JWT de la App con el reloj inyectado y usa el token de instalación en el resto", async () => {
    const { calls } = await run();

    const jwtPayload = JSON.parse(
      Buffer.from(calls[0].headers.Authorization.split(".")[1], "base64url").toString()
    );
    expect(jwtPayload).toEqual({
      iat: 1_794_168_840,
      exp: 1_794_169_440,
      iss: "12345"
    });
    expect(calls[1].headers.Authorization).toBe("Bearer ghs_t");
  });

  it.each([
    ["anónimo", { visibilidad: "anonimo" }, "not-public"],
    ["otro formulario", { "form-name": "reportar-problema" }, "other-form"],
    ["con un enlace", { comentario: "mira https://spam.pe" }, "contains-link"],
    ["con honeypot", { "opinion-empresa": "x" }, "honeypot"],
    ["de una historia desconocida", { historia: "otra" }, "unpublished-story"]
  ])("un envío %s termina sin ninguna llamada de red", async (_label, overrides, reason) => {
    const { calls, logs } = await run({ data: { ...publicData, ...overrides } });

    expect(calls).toEqual([]);
    expect(logs).toEqual([{ event: "comment-skipped", reason }]);
  });

  it.each([
    "COMMENTS_GITHUB_APP_ID",
    "COMMENTS_GITHUB_APP_INSTALLATION_ID",
    "COMMENTS_GITHUB_APP_PRIVATE_KEY"
  ])("sin %s registra comments-misconfigured y no llama a la red", async (name) => {
    const { calls, logs } = await run({ env: { ...env, [name]: undefined } });

    expect(calls).toEqual([]);
    expect(logs).toEqual([{ event: "comments-misconfigured" }]);
  });

  it("trata una variable vacía como ausente", async () => {
    const { logs } = await run({ env: { ...env, COMMENTS_GITHUB_APP_ID: "" } });

    expect(logs).toEqual([{ event: "comments-misconfigured" }]);
  });

  it("un anónimo no registra la falta de configuración", async () => {
    const { logs } = await run({
      data: { ...publicData, visibilidad: "anonimo" },
      env: {}
    });

    expect(logs).toEqual([{ event: "comment-skipped", reason: "not-public" }]);
  });

  it("con la cola llena registra queue-full", async () => {
    const pulls = Array.from({ length: 15 }, () => ({ head: { ref: "comentarios/a-b" } }));

    const { logs } = await run({ fakeFetch: githubFake({ pulls }) });

    expect(logs).toEqual([{ event: "comment-queue-full", story: "historia-a" }]);
  });

  it("un 422 registra duplicate y no abre otro PR", async () => {
    const { calls, logs } = await run({ fakeFetch: githubFake({ refStatus: 422 }) });

    expect(logs).toEqual([{ event: "comment-duplicate", story: "historia-a" }]);
    expect(calls).toHaveLength(4);
  });

  it("un error de GitHub se registra sin lanzar", async () => {
    const fake = createFakeFetch(() => jsonResponse(500, { message: "datos: Rosa" }));

    const { logs } = await run({ fakeFetch: fake });

    expect(logs).toEqual([
      { event: "comment-failed", story: "historia-a", reason: "github-500" }
    ]);
  });

  it("un error de red se registra por su nombre, sin lanzar", async () => {
    const fake = {
      calls: [],
      fetch: (() => Promise.reject(new TypeError("fetch failed Rosa"))) as typeof fetch
    };

    const { logs } = await run({ fakeFetch: fake });

    expect(logs).toEqual([
      { event: "comment-failed", story: "historia-a", reason: "TypeError" }
    ]);
  });

  it("una clave privada inválida se registra sin lanzar ni llamar a la red", async () => {
    const { calls, logs } = await run({
      env: { ...env, COMMENTS_GITHUB_APP_PRIVATE_KEY: "no es una clave" }
    });

    expect(calls).toEqual([]);
    expect(logs).toEqual([
      { event: "comment-failed", story: "historia-a", reason: "Error" }
    ]);
  });

  it("ningún registro lleva el nombre ni el texto del lector", async () => {
    const outcomes = await Promise.all([
      run(),
      run({ fakeFetch: githubFake({ refStatus: 422 }) }),
      run({ fakeFetch: createFakeFetch(() => jsonResponse(500, {})) })
    ]);

    const serialized = JSON.stringify(outcomes.flatMap((outcome) => outcome.logs));

    expect(serialized).not.toContain("Rosa");
    expect(serialized).not.toContain("abuela");
  });
});
