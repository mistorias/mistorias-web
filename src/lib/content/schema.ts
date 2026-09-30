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
 * `themes` es la clave de los temas de la historia. El nombre viejo, `tags`,
 * ya no se lee: `mistorias-contenido` migró todas sus historias.
 *
 * `readingTimeMinutes` es solo el número, con la unidad en el nombre: lo lee
 * también quien consume el contenido sin pasar por este esquema. No se
 * calcula acá; lo calcula y verifica el pipeline de mistorias-contenido
 * (palabras de `## La historia` entre 200 por minuto, hacia arriba).
 *
 * `author` no es el nombre de quien firma, sino una referencia a `authors/`:
 * así una firma sin ficha rompe el build en vez de publicarse huérfana, y el
 * nombre visible se edita en un solo archivo.
 */
export const storySchema = z.object({
  title: z.string().min(15),
  summary: z.string().min(50),
  date: z.coerce.date(),
  author: reference("authors"),
  authorship: z.enum(AUTHORSHIP_VALUES),
  readingTimeMinutes: z.number().int().positive(),
  themes: z.array(z.string()).default([]),
  imageAlt: z.string().min(10).optional(),
  imageCredit: z.string().min(5).optional(),
  imageLicense: z.string().min(2).optional()
});

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
