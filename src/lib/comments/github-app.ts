import { createSign } from "node:crypto";
import {
  CONTENT_REPOSITORY,
  githubError,
  githubRequest,
  type FetchLike
} from "./github-api";

const base64url = (value: string | Buffer): string =>
  Buffer.from(value).toString("base64url");

/** Netlify guarda el PEM en una sola línea: se aceptan los `\n` escapados. */
export function normalizePrivateKey(raw: string): string {
  return raw.replaceAll("\\n", "\n");
}

/**
 * JWT RS256 con el que una GitHub App se identifica. `iat` va un minuto atrás
 * para tolerar relojes desajustados y `exp` a nueve minutos, bajo el máximo
 * de diez que acepta GitHub. Se firma con `node:crypto`: ninguna dependencia.
 */
export function createAppJwt(
  appId: string,
  privateKeyPem: string,
  nowSeconds: number
): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({ iat: nowSeconds - 60, exp: nowSeconds + 540, iss: appId })
  );
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${claims}`)
    .sign(normalizePrivateKey(privateKeyPem));

  return `${header}.${claims}.${base64url(signature)}`;
}

/**
 * Token de instalación acotado: aunque la App estuviera instalada en más
 * repositorios, este solo sirve para mistorias-contenido y solo para
 * contenidos y PR. Dura una hora y no se guarda.
 */
export async function requestInstallationToken(options: {
  fetch: FetchLike;
  jwt: string;
  installationId: string;
}): Promise<string> {
  const response = await githubRequest(
    options.fetch,
    options.jwt,
    "POST",
    `https://api.github.com/app/installations/${options.installationId}/access_tokens`,
    {
      repositories: [CONTENT_REPOSITORY],
      permissions: { contents: "write", pull_requests: "write" }
    }
  );

  if (response.status !== 201) {
    throw githubError(response);
  }

  const { token } = (await response.json()) as { token?: unknown };
  if (typeof token !== "string" || token === "") {
    throw new Error("github-no-token");
  }

  return token;
}
