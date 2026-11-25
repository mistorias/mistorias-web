// Extensión `.ts` explícita: este script corre con `node` directo, igual que
// scripts/next-version.ts.
import { appendFileSync } from "node:fs";
import {
  type Approval,
  type FileChange,
  type PolicyConfig,
  evaluateMergePolicy
} from "../src/lib/release/merge-policy.ts";
import { type Commit, revertedHashes } from "../src/lib/release/version-bump.ts";

/**
 * Check requerido `politica-semver` (ADR 0037): lee un PR de GitHub, aplica
 * `evaluateMergePolicy` y falla si el PR es del bot y necesita a una persona
 * que todavía no lo aprobó. Corre desde la rama base, nunca desde la del PR:
 * un PR no puede reescribir la regla con la que se juzga.
 *
 * Entorno: GH_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, BOT_LOGINS (coma),
 * POLICY_PROTECTED y POLICY_MINOR_WHEN_ADDED (arreglos JSON; opcionales: sin
 * ellos rigen los de este repositorio).
 */
const DEFAULT_CONFIG: PolicyConfig = {
  protectedPatterns: [
    ".github/**",
    ".claude/**",
    ".devcontainer/**",
    "CLAUDE.md",
    "Dockerfile",
    "docker-entrypoint.sh",
    "netlify.toml",
    "astro.config.mjs",
    "coverage.config.ts",
    "stryker.config.mjs",
    "playwright.config.ts",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "public/_headers",
    "public/_redirects",
    "scripts/**",
    "src/layouts/BaseLayout.astro",
    "src/styles/tokens.css",
    "src/content.config.ts",
    "src/lib/content/**",
    "src/lib/release/**",
    "src/lib/security/**",
    "src/lib/**/*gate*.ts"
  ],
  minorWhenAddedPatterns: ["src/pages/**", "src/components/**", "src/layouts/**"]
};
// Más commits que esto no se leen uno por uno: decide una persona.
const MAX_COMMITS = 30;

type ApiCommit = { sha: string; commit: { message: string }; author: { login: string } | null };

async function main(): Promise<void> {
  const repository = required("GITHUB_REPOSITORY");
  const number = required("PR_NUMBER");
  const botLogins = required("BOT_LOGINS").split(",").map((login) => login.trim()).filter(Boolean);
  const config: PolicyConfig = {
    protectedPatterns: jsonList("POLICY_PROTECTED") ?? DEFAULT_CONFIG.protectedPatterns,
    minorWhenAddedPatterns: jsonList("POLICY_MINOR_WHEN_ADDED") ?? DEFAULT_CONFIG.minorWhenAddedPatterns
  };

  const pull = await api<{ title: string; user: { login: string }; head: { sha: string } }>(`/repos/${repository}/pulls/${number}`);
  if (!botLogins.includes(pull.user.login)) {
    return report(`El PR #${number} es de ${pull.user.login}, no del bot: la política no se aplica.`, true);
  }

  const files = (await paginate<{ filename: string; status: string }>(`/repos/${repository}/pulls/${number}/files`)).map(toFileChange);
  const apiCommits = await paginate<ApiCommit>(`/repos/${repository}/pulls/${number}/commits`);
  if (apiCommits.length > MAX_COMMITS) {
    return report(`El PR trae ${apiCommits.length} commits (más de ${MAX_COMMITS}): lo revisa una persona.`, false);
  }
  const commits = await Promise.all(apiCommits.map((entry) => toCommit(repository, entry)));
  const originals = await findReverted(repository, commits);
  const reviews = await paginate<{ user: { login: string } | null; state: string; author_association: string; commit_id: string }>(
    `/repos/${repository}/pulls/${number}/reviews`
  );

  const result = evaluateMergePolicy({
    author: pull.user.login,
    botLogins,
    title: pull.title,
    commits,
    commitAuthors: apiCommits.map((entry) => entry.author?.login ?? null),
    files,
    linkedIssueTypes: await linkedIssueTypes(repository, Number(number)),
    approvals: latestApprovals(reviews),
    headSha: pull.head.sha,
    config,
    lookup: (hash) => originals.find((commit) => commit.hash.startsWith(hash))
  });

  const lines = [
    `Subida: **${result.bump}**. ${result.needsHuman ? "Necesita a una persona." : "Puede fusionarse sola."}`,
    ...result.reasons.map((reason) => `- ${reason}`)
  ];
  report(lines.join("\n"), result.pass);
}

function toFileChange(file: { filename: string; status: string }): FileChange {
  const status = file.status === "added" || file.status === "removed" || file.status === "renamed" ? file.status : "modified";
  return { path: file.filename, status };
}

async function toCommit(repository: string, entry: ApiCommit): Promise<Commit> {
  const detail = await api<{ files?: { filename: string }[] }>(`/repos/${repository}/commits/${entry.sha}`);
  const [subject, ...rest] = entry.commit.message.split("\n");
  return { hash: entry.sha, subject, body: rest.join("\n").trim(), paths: (detail.files ?? []).map((file) => file.filename) };
}

// Un revert de algo que ya está en la base: su subida es la del original, que
// no viene en el PR, así que se pide a la API de antemano (la política es síncrona).
async function findReverted(repository: string, commits: readonly Commit[]): Promise<Commit[]> {
  const hashes = commits.flatMap((commit) => revertedHashes(commit.body));
  const found = await Promise.all(
    hashes.map(async (hash) => {
      try {
        return (await toCommit(repository, await api<ApiCommit>(`/repos/${repository}/commits/${hash}`)));
      } catch {
        return undefined;
      }
    })
  );
  return found.filter((commit): commit is Commit => commit !== undefined);
}

// Solo cuenta la última reseña de cada persona: aprobar y después pedir cambios
// (o que se descarte la aprobación) deja de ser una aprobación.
function latestApprovals(
  reviews: readonly { user: { login: string } | null; state: string; author_association: string; commit_id: string }[]
): Approval[] {
  const latest = new Map<string, (typeof reviews)[number]>();
  for (const review of reviews) {
    if (review.user && review.state !== "COMMENTED" && review.state !== "PENDING") {
      latest.set(review.user.login, review);
    }
  }
  return [...latest.values()]
    .filter((review) => review.state === "APPROVED")
    .map((review) => ({ login: review.user!.login, association: review.author_association, commitId: review.commit_id }));
}

async function linkedIssueTypes(repository: string, number: number): Promise<string[]> {
  const [owner, name] = repository.split("/");
  const query = `query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){closingIssuesReferences(first:20){nodes{issueType{name}}}}}}`;
  const response = await fetch(`${apiUrl()}/graphql`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query, variables: { owner, name, number } })
  });
  const body = (await response.json()) as {
    data?: { repository?: { pullRequest?: { closingIssuesReferences?: { nodes: { issueType: { name: string } | null }[] } } } };
  };
  const nodes = body.data?.repository?.pullRequest?.closingIssuesReferences?.nodes ?? [];
  return nodes.flatMap((node) => (node.issueType ? [node.issueType.name] : []));
}

async function paginate<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= 30; page += 1) {
    const batch = await api<T[]>(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) {
      break;
    }
  }
  return items;
}

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, { headers: headers() });
  if (!response.ok) {
    throw new Error(`GitHub respondió ${response.status} a ${path}`);
  }
  return (await response.json()) as T;
}

function headers(): Record<string, string> {
  return { Authorization: `Bearer ${required("GH_TOKEN")}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
}

function apiUrl(): string {
  return process.env.GITHUB_API_URL ?? "https://api.github.com";
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
}

function jsonList(name: string): string[] | undefined {
  const raw = process.env[name]?.trim();
  return raw ? (JSON.parse(raw) as string[]) : undefined;
}

function report(markdown: string, pass: boolean): void {
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Política SemVer\n\n${markdown}\n`);
  }
  if (!pass) {
    process.exitCode = 1;
  }
}


try {
  await main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
