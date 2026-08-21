#!/usr/bin/env node
/**
 * Compara los temas y conteos que debería mostrar el sitio contra lo que hay
 * realmente en el contenido editorial (content/mistorias-contenido/stories).
 *
 * Reimplementa en Node, sin levantar Astro, la misma agrupación que usa
 * src/lib/themes.ts (groupByTheme: normaliza a minúsculas, deduplica temas
 * repetidos dentro de una misma historia, ordena por relevancia). Sirve para
 * verificar antes del build que /temas y /temas/[tema] van a mostrar los
 * números correctos, sin depender de mirar el HTML generado.
 *
 * Uso: node check_theme_counts.mjs [ruta-a-stories]
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

// `themes` es la clave vigente; `tags` es la vieja y storySchema
// (src/lib/content/schema.ts) la sigue aceptando mientras el contenido migra.
// Este script acepta las dos por la misma razón.
const THEMES_KEY = /^(themes|tags):/;
const INLINE_THEMES = /^(?:themes|tags):\s*\[(.*)\]\s*$/;

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

// Extracción mínima del campo de temas del frontmatter YAML. No reemplaza a
// storySchema (src/lib/content/schema.ts) — esto es una verificación rápida
// previa al build, no un parser YAML completo.
const parseThemes = (fileContents) => {
  const [, frontmatter = ""] = fileContents.split(FRONTMATTER_DELIMITER, 3);

  const lines = frontmatter.split("\n");
  const themesLineIndex = lines.findIndex((line) =>
    THEMES_KEY.test(line.trim())
  );

  if (themesLineIndex === -1) {
    return [];
  }

  const inlineMatch = lines[themesLineIndex].trim().match(INLINE_THEMES);

  if (inlineMatch) {
    return inlineMatch[1]
      .split(",")
      .map((theme) => theme.trim().replace(/^["']|["']$/g, ""))
      .filter((theme) => theme.length > 0);
  }

  const themes = [];

  for (let i = themesLineIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const itemMatch = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);

    if (!itemMatch) {
      break;
    }

    themes.push(itemMatch[1]);
  }

  return themes;
};

const normalizeTheme = (theme) => theme.trim().toLowerCase();

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
      `No hay historias en ${storiesDir}. El índice de temas se verá vacío.`
    );
    return;
  }

  const grouped = new Map();

  for (const file of files) {
    const contents = readFileSync(file, "utf8");
    const uniqueThemes = new Set(
      parseThemes(contents)
        .map(normalizeTheme)
        .filter((theme) => theme.length > 0)
    );

    for (const theme of uniqueThemes) {
      const stories = grouped.get(theme) ?? [];
      stories.push(file);
      grouped.set(theme, stories);
    }
  }

  const sorted = [...grouped.entries()].sort(
    ([themeA, storiesA], [themeB, storiesB]) =>
      storiesB.length - storiesA.length || themeA.localeCompare(themeB, "es")
  );

  console.log(`Historias encontradas: ${files.length}`);
  console.log(`Temas encontrados: ${sorted.length}\n`);

  if (sorted.length === 0) {
    console.log(
      "Ninguna historia tiene temas. /temas mostrará el estado vacío " +
        '("Todavía no hay temas publicados.") y el índice no enlazará a temas.'
    );
    return;
  }

  console.log("Tema".padEnd(30) + "Historias esperadas en /temas/<tema>");
  console.log("-".repeat(70));

  for (const [theme, stories] of sorted) {
    console.log(`${theme.padEnd(30)}${stories.length}`);
  }

  console.log(
    "\nCompara esta tabla con lo que renderiza `pnpm dev` en /temas y en " +
      "cada /temas/<tema> antes de desplegar."
  );
};

main();
