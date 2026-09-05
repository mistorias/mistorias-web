import { reference } from "astro:content";
import { z } from "astro/zod";

/**
 * Qué hizo la inteligencia artificial en una historia.
 *
 * Va en la historia y no en la ficha de quien firma porque el reparto cambia
 * entre una historia y otra: la misma persona puede escribir una entera y
 * dirigir la siguiente. Los valores están en castellano porque son lenguaje
 * editorial —los elige quien escribe y los lee quien visita el sitio—, no
 * identificadores de código.
 */
export const AUTHORSHIP_VALUES = [
  "escrito-por-persona",
  "editado-con-ia",
  "escrito-con-ia"
] as const;

export type Authorship = (typeof AUTHORSHIP_VALUES)[number];

/**
 * Frontmatter de una historia.
 *
 * `themes` es la clave vigente. `tags` es el nombre viejo y se sigue
 * aceptando mientras el submódulo `mistorias-contenido` migra: rechazarlo hoy
 * haría fallar el build de historias ya publicadas. Cuando ninguna historia lo
 * declare, la clave `tags` y este respaldo se eliminan.
 *
 * `author` no es el nombre de quien firma sino una referencia a `authors/`:
 * así una firma sin ficha rompe el build en vez de publicarse huérfana, y el
 * nombre visible se edita en un solo archivo.
 */
export const storySchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    date: z.coerce.date(),
    author: reference("authors"),
    authorship: z.enum(AUTHORSHIP_VALUES),
    themes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    imageAlt: z.string().min(1).optional(),
    imageCredit: z.string().min(1).optional(),
    imageLicense: z.string().min(1).optional()
  })
  .transform(({ themes, tags, ...rest }) => ({
    ...rest,
    themes: themes ?? tags ?? []
  }));

export type StoryFrontmatter = z.infer<typeof storySchema>;

/**
 * Frontmatter de una ficha de autoría.
 *
 * `bio` es la línea que se muestra al pie de cada historia que esa persona
 * firma; la biografía larga es el cuerpo del archivo.
 *
 * `link` y `linkLabel` van juntos o no van, igual que las tres claves de
 * imagen de una historia: un enlace sin rótulo no se puede escribir de forma
 * accesible, y un rótulo sin enlace no lleva a ninguna parte. Es lo único que
 * se pide para que quien lee pueda verificar que hay alguien detrás — nunca un
 * correo, que este repositorio es público y su historial no se borra.
 */
export const authorSchema = z
  .object({
    name: z.string().min(1),
    bio: z.string().min(1),
    link: z.url().optional(),
    linkLabel: z.string().min(1).optional()
  })
  .refine(
    ({ link, linkLabel }) =>
      (link === undefined) === (linkLabel === undefined),
    {
      message:
        "`link` y `linkLabel` van juntos: declara los dos o ninguno."
    }
  );

export type AuthorFrontmatter = z.infer<typeof authorSchema>;
