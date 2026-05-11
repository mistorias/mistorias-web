import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { storySchema } from "./lib/content/schema";

const stories = defineCollection({
  loader: glob({
    base: "./content/mistorias-contenido/stories",
    pattern: "**/*.md"
  }),
  schema: storySchema
});

export const collections = { stories };
