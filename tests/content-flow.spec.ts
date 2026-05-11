import { cp, mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadStories } from "../src/lib/content/content-loader";

const fixturePath = (name: string): string =>
  path.resolve(process.cwd(), "tests/fixtures", name);

const temporaryDirectories: string[] = [];

async function prepareStoriesDirectory(fixtureFilename: string): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "mistorias-web-"));
  temporaryDirectories.push(tempRoot);
  const storiesDirectory = path.join(tempRoot, "stories");
  await mkdir(storiesDirectory, { recursive: true });
  await cp(fixturePath(fixtureFilename), path.join(storiesDirectory, "story.md"));
  return storiesDirectory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      await rm(directory, { recursive: true, force: true });
    })
  );
});

describe("content flow", () => {
  it("loads a valid story from markdown fixture", async () => {
    const storiesDirectory = await prepareStoriesDirectory("valid-story.md");

    const stories = await loadStories(storiesDirectory);

    expect(stories).toHaveLength(1);
    expect(stories[0]).toMatchObject({
      title: "Historia validada",
      summary: "Resumen breve de prueba",
      author: "Equipo Mistorias",
      tags: ["educacion", "comunidad"],
      slug: "story"
    });
    expect(stories[0].date).toBeInstanceOf(Date);
  });

  it("fails when a required schema field is missing", async () => {
    const storiesDirectory = await prepareStoriesDirectory(
      "invalid-story-missing-title.md"
    );

    await expect(loadStories(storiesDirectory)).rejects.toThrow();
  });

  it("fails when raw HTML is present in content", async () => {
    const storiesDirectory = await prepareStoriesDirectory(
      "invalid-story-raw-html.md"
    );

    await expect(loadStories(storiesDirectory)).rejects.toThrow(
      /Raw HTML is not allowed/
    );
  });
});
