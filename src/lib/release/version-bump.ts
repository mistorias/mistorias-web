// Decide la subida de versión (SemVer) a partir de los commits desde el
// último release, según Conventional Commits (issue #194). Es lógica pura: el
// runner `scripts/next-version.ts` se encarga de leer git y de escribir
// `package.json`.

export type Bump = "none" | "patch" | "minor" | "major";

export type Commit = {
  hash: string;
  subject: string;
  body: string;
  paths: string[];
};

// Rutas que no cambian nada de lo que ven las lectoras y los lectores:
// documentación, automatización de GitHub, agentes de IA, tests y tooling de
// desarrollo. Un commit que solo toca estas rutas no sube la versión, sea cual
// sea su tipo.
const IGNORED_PATHS: readonly RegExp[] = [
  /^docs\//,
  /^\.github\//,
  /^\.claude\//,
  /^tests\//,
  /^\.devcontainer\//,
  /^stryker\.config\./,
  /\.md$/
];

// Tipos que, por definición, no llegan a los lectores (docs/STANDARDS.md).
const TYPES_WITHOUT_BUMP: ReadonlySet<string> = new Set(["docs", "ci", "style", "test"]);

const BUMP_ORDER: readonly Bump[] = ["none", "patch", "minor", "major"];

// <tipo>(<alcance>)!: <asunto>, con alcance y ! opcionales.
const CONVENTIONAL_SUBJECT = /^(?<type>[a-z]+)(?:\([^()\s]+\))?(?<breaking>!)?: \S/;

// El pie va al inicio de una línea, según la especificación.
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE: /m;

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export function isReaderFacing(paths: readonly string[]): boolean {
  return paths.some((filePath) => !IGNORED_PATHS.some((pattern) => pattern.test(filePath)));
}

/**
 * Devuelve la subida que pide un commit, o `null` cuando el commit llega a los
 * lectores pero no sigue Conventional Commits: ahí no hay cómo decidir sin
 * adivinar, así que quien llama debe detenerse.
 */
export function classifyCommit(commit: Commit): Bump | null {
  if (!isReaderFacing(commit.paths)) {
    return "none";
  }

  const match = CONVENTIONAL_SUBJECT.exec(commit.subject);
  if (!match?.groups) {
    return null;
  }

  if (match.groups.breaking || BREAKING_FOOTER.test(commit.body)) {
    return "major";
  }
  if (match.groups.type === "feat") {
    return "minor";
  }
  return TYPES_WITHOUT_BUMP.has(match.groups.type) ? "none" : "patch";
}

export function highestBump(bumps: readonly Bump[]): Bump {
  return bumps.reduce<Bump>(
    (highest, bump) => (BUMP_ORDER.indexOf(bump) > BUMP_ORDER.indexOf(highest) ? bump : highest),
    "none"
  );
}

/**
 * La mayor subida entre los commits. Falla listando todos los commits no
 * convencionales a la vez, para corregirlos en una sola pasada.
 */
export function bumpForCommits(commits: readonly Commit[]): Bump {
  const classified = commits.map((commit) => ({ commit, bump: classifyCommit(commit) }));
  const nonConventional = classified.filter(({ bump }) => bump === null);

  if (nonConventional.length > 0) {
    const list = nonConventional
      .map(({ commit }) => `  ${shortHash(commit.hash)} ${commit.subject}`)
      .join("\n");
    throw new Error(
      `These commits change reader-facing files but do not follow Conventional Commits, so the version bump cannot be decided:\n${list}`
    );
  }

  return highestBump(classified.map(({ bump }) => bump as Bump));
}

/** Las líneas en Markdown de los commits que sí suben la versión. */
export function describeCountedCommits(commits: readonly Commit[]): string[] {
  return commits.flatMap((commit) => {
    const bump = classifyCommit(commit);
    return bump && bump !== "none"
      ? [`- \`${shortHash(commit.hash)}\` ${commit.subject} (${bump})`]
      : [];
  });
}

export function versionFromTag(tag: string): string {
  const version = tag.startsWith("v") ? tag.slice(1) : "";
  if (!SEMVER.test(version)) {
    throw new Error(`Tag "${tag}" is not "v" followed by a MAJOR.MINOR.PATCH version.`);
  }
  return version;
}

export function nextVersion(version: string, bump: Bump): string {
  const [major, minor, patch] = parseVersion(version);
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "none":
      return version;
  }
}

/** Negativo si `a` es menor que `b`, positivo si es mayor, cero si son iguales. */
export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const index = left.findIndex((part, position) => part !== right[position]);
  return index === -1 ? 0 : left[index] - right[index];
}

/**
 * Reemplaza solo la línea `"version"` de `package.json`, sin reformatear el
 * resto: el PR debe cambiar esa única línea.
 */
export function replaceVersionLine(packageJson: string, from: string, to: string): string {
  const line = new RegExp(`^(\\s*"version": ")${escapeRegExp(from)}(",?)$`, "gm");
  const matches = packageJson.match(line)?.length ?? 0;
  if (matches !== 1) {
    throw new Error(`Expected exactly one "version": "${from}" line in package.json, found ${matches}.`);
  }
  return packageJson.replace(line, `$1${to}$2`);
}

/**
 * Lee la salida de
 * `git log --format=%x1e%H%x1f%s%x1f%b%x1f --name-only`: \x1e separa commits y
 * \x1f separa campos, dos caracteres que no aparecen en asuntos ni rutas.
 */
export function parseGitLog(raw: string): Commit[] {
  return raw
    .split("\x1e")
    .filter((chunk) => chunk.trim() !== "")
    .map((chunk) => {
      const [hash, subject, body, files = ""] = chunk.split("\x1f");
      return {
        hash,
        subject,
        body: body.trim(),
        paths: files.split("\n").filter((filePath) => filePath !== "")
      };
    });
}

function parseVersion(version: string): [number, number, number] {
  const match = SEMVER.exec(version);
  if (!match) {
    throw new Error(`"${version}" is not a MAJOR.MINOR.PATCH version.`);
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function shortHash(hash: string): string {
  return hash.slice(0, 7);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
