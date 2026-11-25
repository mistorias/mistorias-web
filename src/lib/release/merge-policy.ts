// Decide si un PR del bot puede fusionarse sin una persona (ADR 0037). Reutiliza
// el clasificador de `version-bump.ts`, el mismo que decide la versión: así la
// regla del merge y la de la versión no pueden divergir. Es lógica pura; el
// runner `scripts/check-merge-policy.ts` junta los datos de GitHub y la llama.
import {
  type Bump,
  type Commit,
  type CommitLookup,
  classifyCommit,
  highestBump,
  revertedHashes
} from "./version-bump.ts";

export type FileChange = {
  readonly path: string;
  readonly status: "added" | "modified" | "removed" | "renamed";
};

export type Approval = {
  readonly login: string;
  readonly association: string;
  /** El commit sobre el que se dio la aprobación. */
  readonly commitId: string;
};

export type PolicyConfig = {
  /** Rutas (glob) que siempre piden aprobación, sea cual sea la subida. */
  readonly protectedPatterns: readonly string[];
  /** Un archivo nuevo en estas rutas (glob) cuenta como una funcionalidad: al menos minor. */
  readonly minorWhenAddedPatterns: readonly string[];
};

export type PolicyInput = {
  readonly author: string;
  readonly botLogins: readonly string[];
  readonly title: string;
  readonly commits: readonly Commit[];
  /** Login de quien escribió cada commit, en el mismo orden que `commits`; `null` si GitHub no lo sabe. */
  readonly commitAuthors: readonly (string | null)[];
  readonly files: readonly FileChange[];
  /** Tipo (Feature, Bug, Task…) de los issues que el PR cierra. */
  readonly linkedIssueTypes: readonly string[];
  readonly approvals: readonly Approval[];
  readonly headSha: string;
  readonly config: PolicyConfig;
  readonly lookup?: CommitLookup;
};

export type PolicyResult = {
  /** `false` cuando el PR no es del bot: la política no opina. */
  readonly evaluated: boolean;
  readonly bump: Bump;
  readonly protectedPaths: readonly string[];
  readonly needsHuman: boolean;
  readonly approved: boolean;
  readonly pass: boolean;
  readonly reasons: readonly string[];
};

const APPROVER_ASSOCIATIONS: ReadonlySet<string> = new Set(["OWNER", "MEMBER"]);
const REVERT_SUBJECT = /^revert(?:\([^()\s]+\))?!?: /;

/** Traduce un glob a expresión regular: `**` cruza carpetas y `*` no. */
export function globToRegExp(glob: string): RegExp {
  const source = glob
    .split("**")
    .map((part) => part.split("*").map(escapeRegExp).join("[^/]*"))
    .join(".*");
  return new RegExp(`^${source}$`);
}

export function matchesAny(filePath: string, globs: readonly string[]): boolean {
  return globs.some((glob) => globToRegExp(glob).test(filePath));
}

export function evaluateMergePolicy(input: PolicyInput): PolicyResult {
  if (!input.botLogins.includes(input.author)) {
    return {
      evaluated: false,
      bump: "none",
      protectedPaths: [],
      needsHuman: false,
      approved: false,
      pass: true,
      reasons: ["El PR no es del bot: la política no se aplica."]
    };
  }

  const reasons: string[] = [];
  const bump = bumpOfPullRequest(input, reasons);
  const protectedPaths = input.files
    .map((file) => file.path)
    .filter((filePath) => matchesAny(filePath, input.config.protectedPatterns));

  if (bump === "minor" || bump === "major") {
    reasons.push(`La subida es ${bump}: una funcionalidad o un cambio mayor lo aprueba una persona.`);
  }
  if (protectedPaths.length > 0) {
    reasons.push(`Toca rutas protegidas: ${protectedPaths.join(", ")}.`);
  }
  const strangers = input.commitAuthors.filter((login) => login === null || !input.botLogins.includes(login));
  if (strangers.length > 0) {
    reasons.push("La rama tiene commits que no son del bot.");
  }

  const needsHuman = reasons.length > 0;
  const approved = input.approvals.some(
    (approval) =>
      APPROVER_ASSOCIATIONS.has(approval.association) &&
      !input.botLogins.includes(approval.login) &&
      approval.commitId === input.headSha
  );
  if (needsHuman && !approved) {
    reasons.push("Falta la aprobación de una persona sobre el último commit.");
  }

  return {
    evaluated: true,
    bump,
    protectedPaths,
    needsHuman,
    approved,
    pass: !needsHuman || approved,
    reasons
  };
}

/**
 * La mayor subida entre el título (que con squash es el commit que queda), cada
 * commit, el tipo del issue que se cierra y lo que el PR agrega. Lo que no se
 * puede clasificar sube a major: ante la duda decide una persona.
 */
function bumpOfPullRequest(input: PolicyInput, reasons: string[]): Bump {
  const allPaths = input.files.map((file) => file.path);
  // El título no trae el pie de `git revert`: lo heredan los commits.
  const titleCommit: Commit = {
    hash: "titulo",
    subject: input.title,
    body: input.commits.map((commit) => commit.body).join("\n"),
    paths: allPaths
  };
  const find: CommitLookup = (hash) =>
    input.commits.find((commit) => commit.hash.startsWith(hash)) ?? input.lookup?.(hash);

  const bumps: Bump[] = [];
  for (const commit of [titleCommit, ...input.commits]) {
    const bump = classifyCommit(commit, find);
    if (bump === null) {
      reasons.push(`"${commit.subject}" no sigue Conventional Commits: no se puede decidir la subida.`);
      bumps.push("major");
      continue;
    }
    if (bump !== "none" && isUnresolvedRevert(commit, find)) {
      reasons.push(`"${commit.subject}" revierte un commit que no se encontró: no se puede decidir la subida.`);
      bumps.push("major");
      continue;
    }
    bumps.push(bump);
  }

  if (input.linkedIssueTypes.includes("Feature")) {
    bumps.push("minor");
  }
  const added = input.files.filter((file) => file.status === "added").map((file) => file.path);
  if (added.some((filePath) => matchesAny(filePath, input.config.minorWhenAddedPatterns))) {
    bumps.push("minor");
  }
  return highestBump(bumps);
}

function isUnresolvedRevert(commit: Commit, find: CommitLookup): boolean {
  if (!REVERT_SUBJECT.test(commit.subject)) {
    return false;
  }
  return !revertedHashes(commit.body).some((hash) => find(hash) !== undefined);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
