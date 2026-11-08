import {
  COMMENT_AUTHOR_MAX_LENGTH,
  COMMENT_TEXT_MAX_LENGTH
} from "../content/story-comment";

export type ContentSkipReason =
  | "invalid-length"
  | "contains-link"
  | "contains-email"
  | "reserved-name";

export type CheckedContent = { author: string; text: string };

// Control (\p{Cc}) y formato (\p{Cf}): aquí viven los caracteres invisibles y
// los que invierten la dirección del texto (U+202E y compañía), que sirven
// para disfrazar un nombre o esconder un enlace.
const CONTROL_OR_FORMAT = /[\p{Cc}\p{Cf}]/gu;

const LINK_PATTERNS = [
  /https?:\/\//i,
  /www\./i,
  /[\p{L}\p{N}-]+\.(?:com|pe|net|org|io|info|xyz|ly|me|co|app|site|online|link)(?![\p{L}\p{N}])/iu
];

const EMAIL_PATTERN = /\S+@\S+\.\S+/;

const RESERVED_NAMES = new Set([
  "moderador",
  "moderadora",
  "admin",
  "administrador",
  "administradora",
  "equipo"
]);

function withoutInvisibles(raw: string, keepNewlines: boolean): string {
  return raw
    .normalize("NFC")
    .replace(/\r\n?|[\u2028\u2029]/g, "\n")
    .replace(/\t/g, " ")
    .replace(CONTROL_OR_FORMAT, (char) => (keepNewlines && char === "\n" ? char : ""));
}

export function normalizeText(raw: string): string {
  return withoutInvisibles(raw, true).replace(/\n{3,}/g, "\n\n").trim();
}

export function normalizeAuthor(raw: string): string {
  return withoutInvisibles(raw, false)
    .replace(/\s+/g, " ")
    .trim();
}

// El nombre se compara solo por sus letras: así «M.o.d.e.r.a.d.o.r», «ａｄｍｉｎ»
// o «Mîstörías» no esquivan la regla con signos, anchos o tildes.
function lettersOnly(name: string): string {
  return name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}]/gu, "")
    .replace(/\p{M}/gu, "");
}

function isReservedName(author: string): boolean {
  const letters = lettersOnly(author);
  return letters.includes("mistorias") || RESERVED_NAMES.has(letters);
}

function hasLength(value: string, max: number): boolean {
  return value.length >= 1 && value.length <= max;
}

/**
 * Normaliza y aplica las reglas de contenido de un comentario público
 * (ADR 0036). Un comentario que no las cumple no se pierde: queda como
 * opinión privada en el panel de Netlify, solo no se publica.
 */
export function checkCommentContent(input: {
  author: string;
  text: string;
}): CheckedContent | { skipped: ContentSkipReason } {
  const author = normalizeAuthor(input.author);
  const text = normalizeText(input.text);

  if (
    !hasLength(author, COMMENT_AUTHOR_MAX_LENGTH) ||
    !hasLength(text, COMMENT_TEXT_MAX_LENGTH)
  ) {
    return { skipped: "invalid-length" };
  }

  const both = `${author}\n${text}`;
  // El correo primero: su dominio (`rosa@ejemplo.pe`) también parece un enlace.
  if (EMAIL_PATTERN.test(both)) {
    return { skipped: "contains-email" };
  }
  if (LINK_PATTERNS.some((pattern) => pattern.test(both))) {
    return { skipped: "contains-link" };
  }
  if (isReservedName(author)) {
    return { skipped: "reserved-name" };
  }

  return { author, text };
}
