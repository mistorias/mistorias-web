// El destino está fijo en el código a propósito: ninguna variable de entorno ni
// dato del lector puede apuntar la función a otro repositorio (ADR 0036).
export const CONTENT_OWNER = "mistorias";
export const CONTENT_REPOSITORY = "mistorias-contenido";
export const CONTENT_BRANCH = "main";

export const REPOSITORY_URL = `https://api.github.com/repos/${CONTENT_OWNER}/${CONTENT_REPOSITORY}`;

const REQUEST_TIMEOUT_MS = 8000;

export type FetchLike = typeof fetch;

/**
 * Una llamada a la API de GitHub con timeout propio: la función de Netlify
 * dura 60 s como máximo y seis llamadas colgadas no pueden agotarlos.
 */
export function githubRequest(
  fetchImpl: FetchLike,
  token: string,
  method: "GET" | "POST" | "PUT",
  url: string,
  body?: unknown
): Promise<Response> {
  return fetchImpl(url, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "mistorias-comentarios",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
}

export function githubError(response: Response): Error {
  return new Error(`github-${response.status}`);
}
