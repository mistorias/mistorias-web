import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { storyCommentSchema } from "./lib/content/story-comment";
import { authorSchema, storySchema } from "./lib/content/schema";

const stories = defineCollection({
  loader: glob({
    base: "./content/mistorias-contenido/stories",
    pattern: "**/*.md"
  }),
  schema: storySchema
});

// Sin `**`: una ficha de autoría es un solo archivo suelto, no una carpeta con
// recursos como las historias con imagen.
const authors = defineCollection({
  loader: glob({
    base: "./content/mistorias-contenido/authors",
    pattern: "*.md"
  }),
  schema: authorSchema
});

// Comentarios públicos de lectores (ADR 0036): un JSON por comentario, al lado
// de la historia. El patrón del glob es el mismo que admite el gate de
// carpetas, así que lo que entra aquí ya pasó por `storyCommentSchema` dos
// veces.
const comments = defineCollection({
  loader: glob({
    base: "./content/mistorias-contenido/stories",
    pattern: "*/comentario-*.json"
  }),
  schema: storyCommentSchema
});

export const collections = { stories, authors, comments };
