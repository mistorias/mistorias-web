export type RecordedCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  hasTimeoutSignal: boolean;
};

type Responder = (call: RecordedCall) => Response | Promise<Response>;

/**
 * Un `fetch` falso que anota cada llamada y responde con lo que decida el test.
 * Sirve para comprobar la secuencia, los cuerpos y los encabezados sin red.
 */
export function createFakeFetch(responder: Responder) {
  const calls: RecordedCall[] = [];

  const fakeFetch = async (url: string | URL | Request, init?: RequestInit) => {
    const call: RecordedCall = {
      url: String(url),
      method: init?.method ?? "GET",
      headers: Object.fromEntries(
        Object.entries((init?.headers ?? {}) as Record<string, string>)
      ),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
      hasTimeoutSignal: init?.signal instanceof AbortSignal
    };
    calls.push(call);
    return responder(call);
  };

  return { fetch: fakeFetch as typeof fetch, calls };
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
