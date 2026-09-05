import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
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

export const collections = { stories, authors };
