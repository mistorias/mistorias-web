import { z } from "astro/zod";

export const storySchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  date: z.coerce.date(),
  author: z.string().min(1),
  tags: z.array(z.string()).default([])
});

export type StoryFrontmatter = z.infer<typeof storySchema>;
