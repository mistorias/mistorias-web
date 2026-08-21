import { z } from "astro/zod";

/**
 * Frontmatter de una historia.
 *
 * `themes` es la clave vigente. `tags` es el nombre viejo y se sigue
 * aceptando mientras el submódulo `mistorias-contenido` migra: rechazarlo hoy
 * haría fallar el build de historias ya publicadas. Cuando ninguna historia lo
 * declare, la clave `tags` y este respaldo se eliminan.
 */
export const storySchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    date: z.coerce.date(),
    author: z.string().min(1),
    themes: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  })
  .transform(({ themes, tags, ...rest }) => ({
    ...rest,
    themes: themes ?? tags ?? []
  }));

export type StoryFrontmatter = z.infer<typeof storySchema>;
