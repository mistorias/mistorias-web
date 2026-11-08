import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createAppJwt,
  normalizePrivateKey,
  requestInstallationToken
} from "../src/lib/comments/github-app";
import { createFakeFetch, jsonResponse } from "./support/fake-fetch";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048
});
const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const legacyPem = privateKey.export({ type: "pkcs1", format: "pem" }).toString();

function decodePart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

describe("normalizePrivateKey", () => {
  it("convierte los \\n escapados en saltos de línea", () => {
    expect(normalizePrivateKey("-----BEGIN X-----\\nabc\\n-----END X-----")).toBe(
      "-----BEGIN X-----\nabc\n-----END X-----"
    );
  });

  it("deja intacta una clave con saltos de línea reales", () => {
    expect(normalizePrivateKey(privateKeyPem)).toBe(privateKeyPem);
  });
});

describe("createAppJwt", () => {
  const nowSeconds = 1_800_000_000;

  it("arma header y claims con la ventana de tiempo de GitHub", () => {
    const [header, claims] = createAppJwt("12345", privateKeyPem, nowSeconds).split(".");

    expect(decodePart(header)).toEqual({ alg: "RS256", typ: "JWT" });
    expect(decodePart(claims)).toEqual({
      iat: 1_799_999_940,
      exp: 1_800_000_540,
      iss: "12345"
    });
  });

  it("firma con RS256: la clave pública verifica la firma", () => {
    const [header, claims, signature] = createAppJwt(
      "12345",
      privateKeyPem,
      nowSeconds
    ).split(".");

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${claims}`);

    expect(verifier.verify(publicKey, signature, "base64url")).toBe(
      true
    );
  });

  it("acepta la clave en formato PKCS#1 con los \\n escapados", () => {
    const escaped = legacyPem.replaceAll("\n", "\\n");
    const [header, claims, signature] = createAppJwt("1", escaped, nowSeconds).split(".");

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${claims}`);

    expect(verifier.verify(publicKey, signature, "base64url")).toBe(true);
  });

  it("falla con una clave que no es una clave", () => {
    expect(() => createAppJwt("1", "no es una clave", nowSeconds)).toThrow();
  });
});

describe("requestInstallationToken", () => {
  it("pide un token acotado al repositorio de contenido y a dos permisos", async () => {
    const { fetch, calls } = createFakeFetch(() =>
      jsonResponse(201, { token: "ghs_abc" })
    );

    const token = await requestInstallationToken({
      fetch,
      jwt: "el.jwt.firmado",
      installationId: "777"
    });

    expect(token).toBe("ghs_abc");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      "https://api.github.com/app/installations/777/access_tokens"
    );
    expect(calls[0].method).toBe("POST");
    expect(calls[0].headers.Authorization).toBe("Bearer el.jwt.firmado");
    expect(calls[0].hasTimeoutSignal).toBe(true);
    expect(calls[0].body).toEqual({
      repositories: ["mistorias-contenido"],
      permissions: { contents: "write", pull_requests: "write" }
    });
  });

  it("falla con el estado si GitHub no responde 201", async () => {
    const { fetch } = createFakeFetch(() => jsonResponse(401, { message: "Bad" }));

    await expect(
      requestInstallationToken({ fetch, jwt: "x", installationId: "1" })
    ).rejects.toThrow("github-401");
  });

  it("falla si la respuesta no trae token", async () => {
    const { fetch } = createFakeFetch(() => jsonResponse(201, {}));

    await expect(
      requestInstallationToken({ fetch, jwt: "x", installationId: "1" })
    ).rejects.toThrow("github-no-token");
  });
});
