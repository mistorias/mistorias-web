import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readStoryDates } from "../src/lib/content/story-order-source";

const temporaryDirectories: string[] = [];

async function prepareStoriesDirectory(): Promise<string> {
  const tempRoot = await mkdtemp(
    path.join(os.tmpdir(), "mistorias-web-story-order-source-")
  );
  temporaryDirectories.push(tempRoot);
  const storiesDirectory = path.join(tempRoot, "stories");
  await mkdir(storiesDirectory, { recursive: true });
  return storiesDirectory;
}

async function writeStory(
  storiesDirectory: string,
  slug: string,
  frontmatter: string
): Promise<void> {
  await writeFile(
    path.join(storiesDirectory, `${slug}.md`),
    `---\ntitle: "prueba"\n${frontmatter}---\ncuerpo\n`
  );
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  );
});

describe("readStoryDates", () => {
  it("lee id y fecha de cada historia, con la fecha entre comillas", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "una-historia", 'date: "2026-08-07"\n');

    const stories = await readStoryDates(storiesDirectory);

    expect(stories).toEqual([
      { id: "una-historia", date: new Date("2026-08-07") }
    ]);
  });

  it("lee la fecha sin comillas", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "otra-historia", "date: 2026-08-07\n");

    const stories = await readStoryDates(storiesDirectory);

    expect(stories).toEqual([
      { id: "otra-historia", date: new Date("2026-08-07") }
    ]);
  });

  it("ignora la carpeta de imagen de una historia (no termina en .md)", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "con-imagen", 'date: "2026-08-07"\n');
    await mkdir(path.join(storiesDirectory, "con-imagen"), {
      recursive: true
    });

    const stories = await readStoryDates(storiesDirectory);

    expect(stories).toEqual([
      { id: "con-imagen", date: new Date("2026-08-07") }
    ]);
  });

  it("lanza si una historia no declara una fecha válida", async () => {
    const storiesDirectory = await prepareStoriesDirectory();
    await writeStory(storiesDirectory, "sin-fecha", "author: alguien\n");

    await expect(readStoryDates(storiesDirectory)).rejects.toThrow(
      /sin-fecha\.md.*date/
    );
  });
});
