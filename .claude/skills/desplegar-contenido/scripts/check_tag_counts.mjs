#!/usr/bin/env node
/**
 * Compara las etiquetas y conteos que debería mostrar el sitio contra lo que
 * hay realmente en el contenido editorial (content/mistorias-contenido/stories).
 *
 * Reimplementa en Node, sin levantar Astro, la misma agrupación que usa
 * src/lib/tags.ts (groupByTag: normaliza a minúsculas, deduplica etiquetas
 * repetidas dentro de una misma historia, ordena por relevancia). Sirve para
 * verificar antes del build que /etiquetas y /etiquetas/[etiqueta] van a
 * mostrar los números correctos, sin depender de mirar el HTML generado.
 *
 * Uso: node check_tag_counts.mjs [ruta-a-stories]
 * Por defecto usa content/mistorias-contenido/stories relativo al repo.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../../../..");
const storiesDir = resolve(
  process.argv[2] ?? join(repoRoot, "content/mistorias-contenido/stories")
);

const FRONTMATTER_DELIMITER = "---";

const findMarkdownFiles = (dir) => {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
};

// Extracción mínima del campo `tags` del frontmatter YAML. No reemplaza a
// storySchema (src/lib/content/schema.ts) — esto es una verificación rápida
// previa al build, no un parser YAML completo.
const parseTags = (fileContents) => {
  const [, frontmatter = ""] =
    fileContents.split(FRONTMATTER_DELIMITER, 3);

  const lines = frontmatter.split("\n");
  const tagsLineIndex = lines.findIndex((line) => /^tags:/.test(line.trim()));

  if (tagsLineIndex === -1) {
    return [];
  }

  const inlineMatch = lines[tagsLineIndex].match(/^tags:\s*\[(.*)\]\s*$/);

  if (inlineMatch) {
    return inlineMatch[1]
      .split(",")
      .map((tag) => tag.trim().replace(/^["']|["']$/g, ""))
      .filter((tag) => tag.length > 0);
  }

  const tags = [];

  for (let i = tagsLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const itemMatch = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);

    if (!itemMatch) {
      break;
    }

    tags.push(itemMatch[1]);
  }

  return tags;
};

const normalizeTag = (tag) => tag.trim().toLowerCase();

const main = () => {
  let files;

  try {
    files = findMarkdownFiles(storiesDir);
  } catch (error) {
    console.error(
      `No se pudo leer ${storiesDir}. ¿Está inicializado el submódulo de contenido? ` +
        `Corre "git submodule update --init --recursive".`
    );
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  if (files.length === 0) {
    console.log(
      `No hay historias en ${storiesDir}. El índice de etiquetas se verá vacío.`
    );
    return;
  }

  const grouped = new Map();

  for (const file of files) {
    const contents = readFileSync(file, "utf8");
    const uniqueTags = new Set(
      parseTags(contents).map(normalizeTag).filter((tag) => tag.length > 0)
    );

    for (const tag of uniqueTags) {
      const stories = grouped.get(tag) ?? [];
      stories.push(file);
      grouped.set(tag, stories);
    }
  }

  const sorted = [...grouped.entries()].sort(
    ([tagA, storiesA], [tagB, storiesB]) =>
      storiesB.length - storiesA.length || tagA.localeCompare(tagB, "es")
  );

  console.log(`Historias encontradas: ${files.length}`);
  console.log(`Etiquetas encontradas: ${sorted.length}\n`);

  if (sorted.length === 0) {
    console.log(
      "Ninguna historia tiene etiquetas. /etiquetas mostrará el estado vacío " +
        '("Todavía no hay etiquetas publicadas.") y el índice no enlazará a etiquetas.'
    );
    return;
  }

  console.log("Etiqueta".padEnd(30) + "Historias esperadas en /etiquetas/<etiqueta>");
  console.log("-".repeat(70));

  for (const [tag, stories] of sorted) {
    console.log(`${tag.padEnd(30)}${stories.length}`);
  }

  console.log(
    "\nCompara esta tabla con lo que renderiza `pnpm dev` en /etiquetas y en " +
      "cada /etiquetas/<etiqueta> antes de desplegar."
  );
};

main();
