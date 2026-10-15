// Extensión `.ts` explícita: este script corre con `node` directo, igual que
// scripts/generate-story-order-cache.ts.
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import {
  bumpForCommits,
  compareVersions,
  describeCountedCommits,
  nextVersion,
  parseGitLog,
  replaceVersionLine,
  versionFromTag
} from "../src/lib/release/version-bump.ts";

const packageJsonPath = "package.json";

/**
 * Calcula la versión siguiente a partir de los commits desde el último tag de
 * release y, si corresponde subirla, reescribe solo la línea "version" de
 * package.json (issue #194). Nunca commitea, etiqueta ni abre el PR: eso lo
 * hace .github/workflows/subir-version.yml.
 *
 * La base es el tag y no el package.json: si ya se fusionó una subida que
 * todavía no se publicó, el cálculo parte del mismo punto y no encadena
 * versiones que nunca salieron.
 *
 * En GitHub Actions deja en $GITHUB_OUTPUT `hay_cambios`, `anterior` y `nueva`.
 *
 * Uso:
 *   pnpm next-version
 *   pnpm next-version -- --summary <archivo>   # además escribe el cuerpo del PR
 */
function main(): void {
  const tag = git("describe", "--tags", "--abbrev=0", "--match", "v*");
  const releasedVersion = versionFromTag(tag);
  const commits = parseGitLog(
    git("log", `${tag}..HEAD`, "--format=%x1e%H%x1f%s%x1f%b%x1f", "--name-only")
  );

  const bump = bumpForCommits(commits);
  const candidate = nextVersion(releasedVersion, bump);
  const packageJson = readFileSync(packageJsonPath, "utf8");
  const currentVersion = JSON.parse(packageJson).version as string;

  if (bump === "none") {
    console.log(`Desde ${tag} no hay commits que lleguen a los lectores. Nada que subir.`);
    return setOutputs({ hay_cambios: "false" });
  }

  if (compareVersions(candidate, currentVersion) <= 0) {
    console.log(
      `Desde ${tag} corresponde ${candidate}, y package.json ya está en ${currentVersion}. Nada que subir.`
    );
    return setOutputs({ hay_cambios: "false" });
  }

  writeFileSync(packageJsonPath, replaceVersionLine(packageJson, currentVersion, candidate));
  console.log(`Versión: ${currentVersion} -> ${candidate} (${bump}, desde ${tag}).`);

  const summaryPath = argumentAfter("--summary");
  if (summaryPath) {
    writeFileSync(summaryPath, buildSummary(tag, bump, describeCountedCommits(commits)));
  }

  setOutputs({ hay_cambios: "true", anterior: currentVersion, nueva: candidate });
}

function buildSummary(tag: string, bump: string, countedCommits: string[]): string {
  return [
    `Sube \`version\` en \`package.json\` según los commits desde \`${tag}\` (SemVer + Conventional Commits, issue #194).`,
    "",
    `Subida: **${bump}**. Commits que la deciden:`,
    "",
    ...countedCommits,
    "",
    "Este PR lo abre `.github/workflows/subir-version.yml`. Fusionarlo no publica nada: el release sigue siendo el tag, y lo crea una persona.",
    ""
  ].join("\n");
}

function git(...args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function argumentAfter(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function setOutputs(outputs: Record<string, string>): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`);
  appendFileSync(outputPath, lines.join(""));
}

try {
  main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
