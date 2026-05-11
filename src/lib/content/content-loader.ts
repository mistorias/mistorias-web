import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { storySchema, type StoryFrontmatter } from "./schema";

const RAW_HTML_PATTERN = /<[^>]+>/;

export type StoryEntry = StoryFrontmatter & {
  slug: string;
  body: string;
};

const defaultStoriesDirectory = path.resolve(
  process.cwd(),
  "content/mistorias-contenido/stories"
);

function parseFrontmatter(rawFile: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const startsWithFence = rawFile.startsWith("---\n");
  if (!startsWithFence) {
    throw new Error("Missing frontmatter fence.");
  }

  const secondFenceIndex = rawFile.indexOf("\n---\n", 4);
  if (secondFenceIndex < 0) {
    throw new Error("Invalid frontmatter format.");
  }

  const frontmatterBlock = rawFile.slice(4, secondFenceIndex).trim();
  const body = rawFile.slice(secondFenceIndex + 5).trim();
  const frontmatter: Record<string, unknown> = {};

  for (const line of frontmatterBlock.split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    if (!key) {
      continue;
    }

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      const values = rawValue
        .slice(1, -1)
        .split(",")
        .map((value) => value.trim().replace(/^"|"$/g, ""))
        .filter(Boolean);
      frontmatter[key] = values;
      continue;
    }

    frontmatter[key] = rawValue.replace(/^"|"$/g, "");
  }

  return { frontmatter, body };
}

export function assertNoRawHtml(value: string, filePath: string): void {
  if (RAW_HTML_PATTERN.test(value)) {
    throw new Error(`Raw HTML is not allowed in ${filePath}.`);
  }
}

export async function loadStories(
  directory = defaultStoriesDirectory
): Promise<StoryEntry[]> {
  const files = await readdir(directory, { withFileTypes: true });
  const stories: StoryEntry[] = [];

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".md")) {
      continue;
    }

    const filePath = path.join(directory, file.name);
    const rawFile = await readFile(filePath, "utf8");
    const { frontmatter, body } = parseFrontmatter(rawFile);

    for (const value of Object.values(frontmatter)) {
      if (typeof value === "string") {
        assertNoRawHtml(value, filePath);
      }
    }
    assertNoRawHtml(body, filePath);

    const parsed = storySchema.parse(frontmatter);
    stories.push({
      ...parsed,
      body,
      slug: file.name.replace(/\.md$/, "")
    });
  }

  return stories.sort((a, b) => b.date.getTime() - a.date.getTime());
}
