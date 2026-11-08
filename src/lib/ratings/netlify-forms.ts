import { z } from "astro/zod";
// Extensión `.ts` explícita: ver la nota en tally-ratings.ts.
import type { Submission } from "./tally-ratings.ts";

export const OPINION_FORM_NAME = "opinion-historia";

const API_ORIGIN = "https://api.netlify.com";
const API_BASE = `${API_ORIGIN}/api/v1`;
const DEFAULT_TIMEOUT_MS = 15_000;
// Con 100 envíos por página, 200 páginas son 20 000 calificaciones: muy por
// encima de lo que este sitio recibe, y evita un bucle si el `Link` nunca cierra.
const DEFAULT_MAX_PAGES = 200;

export type NetlifyFormsOptions = {
  token: string;
  siteId: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  maxPages?: number;
};

const formsSchema = z.array(z.object({ id: z.string(), name: z.string() }));
// De cada envío solo importan sus campos; lo demás (número, fechas, datos del
// visitante) ni se lee ni se guarda.
const submissionsSchema = z.array(
  z.object({ data: z.record(z.string(), z.unknown()) })
);

/** La URL con `rel="next"` de un header `Link`, o `null` si no hay otra página. */
export function parseNextPageUrl(linkHeader: string | null): string | null {
  if (linkHeader === null) return null;

  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="?next"?/);
    if (match) return match[1];
  }

  return null;
}

type Page = { body: unknown; next: string | null };

async function getPage(url: string, options: NetlifyFormsOptions): Promise<Page> {
  // El token solo viaja a api.netlify.com: un `Link` manipulado no puede
  // llevarlo a otro host.
  if (!url.startsWith(`${API_ORIGIN}/`)) {
    throw new Error(
      `Netlify devolvió una URL fuera de api.netlify.com (${new URL(url).origin}); no se le envía el token.`
    );
  }

  let response: Response;

  try {
    response = await (options.fetch ?? fetch)(url, {
      headers: { Authorization: `Bearer ${options.token}` },
      signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`No se pudo consultar Netlify (${url}): ${reason}`);
  }

  if (!response.ok) {
    throw new Error(
      `Netlify respondió ${response.status} a ${url}. Revisa que NETLIFY_FORMS_TOKEN siga vigente y que el sitio sea el correcto.`
    );
  }

  return {
    body: await response.json(),
    next: parseNextPageUrl(response.headers.get("Link"))
  };
}

function parseBody<T>(schema: z.ZodType<T>, body: unknown, what: string): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new Error(
      `Netlify devolvió ${what} con una forma inesperada; no se escribe ningún conteo. ${z.prettifyError(result.error)}`
    );
  }

  return result.data;
}

/**
 * Trae todos los envíos verificados del formulario `opinion-historia`:
 * primero busca el formulario del sitio por nombre y luego recorre sus páginas
 * siguiendo el header `Link`. Ante cualquier cosa inesperada (formulario
 * ausente, respuesta que no es 2xx, `data` con otra forma) falla con un
 * mensaje claro: nunca devuelve una lista vacía que se confundiría con "cero
 * calificaciones" y borraría el conteo publicado.
 */
export async function fetchOpinionSubmissions(
  options: NetlifyFormsOptions
): Promise<Submission[]> {
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;

  const formsPage = await getPage(
    `${API_BASE}/sites/${encodeURIComponent(options.siteId)}/forms`,
    options
  );
  const forms = parseBody(formsSchema, formsPage.body, "la lista de formularios");
  const form = forms.find((candidate) => candidate.name === OPINION_FORM_NAME);

  if (form === undefined) {
    const names = forms.map((candidate) => candidate.name).join(", ") || "ninguno";
    throw new Error(
      `Netlify no encontró el formulario "${OPINION_FORM_NAME}" en el sitio. Formularios que sí hay: ${names}.`
    );
  }

  const submissions: Submission[] = [];
  let url: string | null =
    `${API_BASE}/forms/${encodeURIComponent(form.id)}/submissions?per_page=100`;

  for (let pages = 0; url !== null; pages += 1) {
    if (pages >= maxPages) {
      throw new Error(
        `Netlify devolvió más de ${maxPages} páginas de envíos; se corta para no entrar en un bucle.`
      );
    }

    const page: Page = await getPage(url, options);
    submissions.push(
      ...parseBody(submissionsSchema, page.body, "los envíos del formulario")
    );
    url = page.next;
  }

  return submissions;
}
