// Revisa el HTML ya construido contra lo que promete la CSP (`script-src
// 'none'`, `default-src 'self'`). El build no falla si una página trae un
// <script> o carga algo de otro origen: el navegador lo bloquea en silencio y
// la página se ve rota solo en producción (ADR 0037). Es lógica pura; el
// runner `scripts/check-dist.ts` recorre `dist/` y la llama.

export type DistViolation = {
  readonly rule: string;
  readonly detail: string;
};

const SCRIPT_TAG = /<script\b/i;
const OPENING_TAG = /<([a-z][a-z0-9-]*)\b([^>]*)>/gi;
const EVENT_HANDLER_ATTRIBUTE = /\son[a-z]+\s*=/i;
const JAVASCRIPT_URL = /\b(?:href|src|action|formaction)\s*=\s*["']?\s*javascript:/i;
const ABSOLUTE_URL = /^(?:https?:)?\/\//i;

// Elementos que cargan un recurso al abrir la página. `a` y `link rel=canonical`
// no cargan nada, así que se quedan fuera.
const SUBRESOURCE_URL_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {
  img: ["src", "srcset"],
  source: ["src", "srcset"],
  video: ["src", "poster"],
  audio: ["src"],
  iframe: ["src"],
  embed: ["src"],
  object: ["data"],
  form: ["action"],
};
const LOADING_LINK_RELATIONS = ["stylesheet", "preload", "prefetch", "modulepreload", "icon"];

function attributeValue(attributes: string, name: string): string | undefined {
  const match = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(attributes);
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

/** Devuelve todo lo que un HTML construido tendría que no tener. */
export function scanBuiltHtml(html: string): DistViolation[] {
  const violations: DistViolation[] = [];

  if (SCRIPT_TAG.test(html)) {
    violations.push({ rule: "script", detail: "contiene una etiqueta <script>" });
  }

  for (const [tag, name, attributes] of [...html.matchAll(OPENING_TAG)].map((m) => [m[0], m[1].toLowerCase(), m[2]] as const)) {
    if (EVENT_HANDLER_ATTRIBUTE.test(attributes)) {
      violations.push({ rule: "manejador-de-evento", detail: tag });
    }
    if (JAVASCRIPT_URL.test(tag)) {
      violations.push({ rule: "javascript-url", detail: tag });
    }
    if (name === "a" && attributeValue(attributes, "target")?.toLowerCase() === "_blank") {
      const rel = (attributeValue(attributes, "rel") ?? "").toLowerCase().split(/\s+/);
      if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
        violations.push({ rule: "blank-sin-noopener", detail: tag });
      }
    }
    const external = externalSubresource(name, attributes);
    if (external) {
      violations.push({ rule: "recurso-externo", detail: `${tag} (${external})` });
    }
  }

  return violations;
}

function externalSubresource(tag: string, attributes: string): string | undefined {
  if (tag === "link") {
    const relations = (attributeValue(attributes, "rel") ?? "").toLowerCase().split(/\s+/);
    const href = attributeValue(attributes, "href");
    return href && ABSOLUTE_URL.test(href) && relations.some((r) => LOADING_LINK_RELATIONS.includes(r)) ? href : undefined;
  }
  for (const name of SUBRESOURCE_URL_ATTRIBUTES[tag] ?? []) {
    const value = attributeValue(attributes, name);
    // `srcset` lleva varias URL separadas por coma: se revisa cada candidata.
    const candidates = (value ?? "").split(",").map((part) => part.trim().split(/\s+/)[0]);
    const found = candidates.find((candidate) => ABSOLUTE_URL.test(candidate));
    if (found) {
      return found;
    }
  }
  return undefined;
}
