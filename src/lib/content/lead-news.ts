/**
 * Título de la primera noticia de una historia (issue #264).
 *
 * mistorias-redes-sociales lo usa para su «Noticia de la semana: …». Es el
 * primer texto en negrita bajo `## Noticias principales`, que es como escribe
 * el equipo editorial cada noticia, sea en párrafos o en lista.
 *
 * Depende del título de una sección, cosa que el resto del sitio evita
 * (`storySchema` solo valida frontmatter). Por eso no falla: si la historia no
 * trae la sección o la sección no trae negritas, devuelve `undefined` y el feed
 * omite el dato, en vez de detener la publicación de la historia.
 */

const LEAD_NEWS_HEADING = "## Noticias principales";

const SECTION_HEADING = /^#{1,2} /;
const BOLD_TEXT = /\*\*(.+?)\*\*/;

const leadNewsSectionOf = (body: string): readonly string[] => {
  const lines = body.split("\n");
  const start = lines.findIndex((line) => line.trim() === LEAD_NEWS_HEADING);

  if (start === -1) return [];

  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => SECTION_HEADING.test(line));

  return end === -1 ? rest : rest.slice(0, end);
};

export const findLeadNewsTitle = (body: string): string | undefined =>
  leadNewsSectionOf(body).join("\n").match(BOLD_TEXT)?.[1].trim();
