import { describe, expect, it } from "vitest";
import {
  fetchOpinionSubmissions,
  parseNextPageUrl
} from "../src/lib/ratings/netlify-forms";

const API = "https://api.netlify.com/api/v1";
const FORMS_URL = `${API}/sites/site-1/forms`;
const FIRST_PAGE = `${API}/forms/form-2/submissions?per_page=100`;
const SECOND_PAGE = `${API}/forms/form-2/submissions?page=2&per_page=100`;

const forms = [
  { id: "form-1", name: "reportar" },
  { id: "form-2", name: "opinion-historia" }
];

type Reply = { status?: number; body: unknown; link?: string };

// Un `fetch` de mentira: responde por URL y recuerda qué se le pidió.
function fakeFetch(replies: Record<string, Reply>) {
  const calls: { url: string; authorization: string | null }[] = [];
  const fetchFake = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({
      url,
      authorization: new Headers(init?.headers).get("authorization")
    });
    const reply = replies[url];
    if (reply === undefined) {
      return new Response("no encontrado", { status: 404 });
    }
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: reply.link ? { Link: reply.link } : {}
    });
  }) as typeof fetch;
  return { fetch: fetchFake, calls };
}

const options = (fetchFake: typeof fetch) => ({
  token: "token-secreto",
  siteId: "site-1",
  fetch: fetchFake
});

// Netlify trae más campos por envío (id, fechas…); el cliente solo conserva
// `data`, que es lo único que se cuenta.
const submission = (historia: string, calificacion: string) => ({
  id: `${historia}-${calificacion}`,
  created_at: "2026-11-08T12:00:00Z",
  data: { historia, calificacion }
});
const dataOf = (historia: string, calificacion: string) => ({
  data: { historia, calificacion }
});

describe("parseNextPageUrl", () => {
  it("devuelve la URL con rel=next", () => {
    expect(
      parseNextPageUrl(
        `<${SECOND_PAGE}>; rel="next", <${API}/forms/form-2/submissions?page=9>; rel="last"`
      )
    ).toBe(SECOND_PAGE);
  });

  it("devuelve null sin rel=next o sin header", () => {
    expect(
      parseNextPageUrl(`<${FIRST_PAGE}>; rel="prev"`)
    ).toBeNull();
    expect(parseNextPageUrl(null)).toBeNull();
  });
});

describe("fetchOpinionSubmissions", () => {
  it("busca el formulario por nombre y trae sus envíos", async () => {
    const { fetch, calls } = fakeFetch({
      [FORMS_URL]: { body: forms },
      [FIRST_PAGE]: { body: [submission("historia-a", "5")] }
    });

    const result = await fetchOpinionSubmissions(options(fetch));

    expect(result).toEqual([dataOf("historia-a", "5")]);
    expect(calls.map((call) => call.url)).toEqual([FORMS_URL, FIRST_PAGE]);
  });

  it("envía el token como Bearer en cada pedido", async () => {
    const { fetch, calls } = fakeFetch({
      [FORMS_URL]: { body: forms },
      [FIRST_PAGE]: { body: [] }
    });

    await fetchOpinionSubmissions(options(fetch));

    expect(calls.map((call) => call.authorization)).toEqual([
      "Bearer token-secreto",
      "Bearer token-secreto"
    ]);
  });

  it("sigue el header Link hasta la última página", async () => {
    const { fetch, calls } = fakeFetch({
      [FORMS_URL]: { body: forms },
      [FIRST_PAGE]: {
        body: [submission("historia-a", "5")],
        link: `<${SECOND_PAGE}>; rel="next"`
      },
      [SECOND_PAGE]: { body: [submission("historia-b", "3")] }
    });

    const result = await fetchOpinionSubmissions(options(fetch));

    expect(result).toEqual([dataOf("historia-a", "5"), dataOf("historia-b", "3")]);
    expect(calls.map((call) => call.url)).toEqual([
      FORMS_URL,
      FIRST_PAGE,
      SECOND_PAGE
    ]);
  });

  it("falla con un mensaje claro si no existe el formulario", async () => {
    const { fetch } = fakeFetch({
      [FORMS_URL]: { body: [{ id: "form-1", name: "reportar" }] }
    });

    await expect(fetchOpinionSubmissions(options(fetch))).rejects.toThrow(
      /no encontró el formulario "opinion-historia".*reportar/
    );
  });

  it("falla ante una respuesta que no es 2xx, sin mostrar el token", async () => {
    const { fetch } = fakeFetch({
      [FORMS_URL]: { status: 401, body: { message: "Unauthorized" } }
    });

    const error = await fetchOpinionSubmissions(options(fetch)).catch(
      (caught: Error) => caught
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toMatch(/401/);
    expect((error as Error).message).not.toContain("token-secreto");
  });

  it("falla si una página de envíos responde con error", async () => {
    const { fetch } = fakeFetch({
      [FORMS_URL]: { body: forms },
      [FIRST_PAGE]: { status: 500, body: {} }
    });

    await expect(fetchOpinionSubmissions(options(fetch))).rejects.toThrow(
      /500/
    );
  });

  it("falla si la lista de formularios no tiene la forma esperada", async () => {
    const { fetch } = fakeFetch({ [FORMS_URL]: { body: { forms: [] } } });

    await expect(fetchOpinionSubmissions(options(fetch))).rejects.toThrow(
      /forma inesperada/
    );
  });

  it("falla si los envíos no traen `data`, en vez de contar ceros", async () => {
    const { fetch } = fakeFetch({
      [FORMS_URL]: { body: forms },
      [FIRST_PAGE]: { body: [{ id: "x", fields: { historia: "a" } }] }
    });

    await expect(fetchOpinionSubmissions(options(fetch))).rejects.toThrow(
      /forma inesperada/
    );
  });

  it("no manda el token a un host distinto de api.netlify.com", async () => {
    const { fetch, calls } = fakeFetch({
      [FORMS_URL]: { body: forms },
      [FIRST_PAGE]: {
        body: [],
        link: '<https://malo.example.com/robo>; rel="next"'
      }
    });

    await expect(fetchOpinionSubmissions(options(fetch))).rejects.toThrow(
      /api\.netlify\.com/
    );
    expect(calls.map((call) => call.url)).not.toContain(
      "https://malo.example.com/robo"
    );
  });

  it("falla con un mensaje claro si la red se cae", async () => {
    const broken = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    await expect(fetchOpinionSubmissions(options(broken))).rejects.toThrow(
      /No se pudo consultar Netlify.*fetch failed/
    );
  });

  it("corta si el header Link nunca termina", async () => {
    const loop: Record<string, Reply> = {
      [FORMS_URL]: { body: forms },
      [FIRST_PAGE]: { body: [], link: `<${FIRST_PAGE}>; rel="next"` }
    };
    const { fetch } = fakeFetch(loop);

    await expect(
      fetchOpinionSubmissions({ ...options(fetch), maxPages: 3 })
    ).rejects.toThrow(/más de 3 páginas/);
  });
});
