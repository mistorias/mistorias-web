import { describe, expect, it } from "vitest";
import {
  type PolicyInput,
  evaluateMergePolicy,
  globToRegExp,
  matchesAny
} from "../src/lib/release/merge-policy";
import type { Commit } from "../src/lib/release/version-bump";

const CONFIG = {
  protectedPatterns: [".github/**", "CLAUDE.md", "public/_headers", "src/layouts/BaseLayout.astro", "src/lib/**/*-gate.ts"],
  minorWhenAddedPatterns: ["src/pages/**", "src/components/**"]
};

const commit = (subject: string, paths: string[], body = "", hash = "aaaaaaa1111"): Commit => ({
  hash,
  subject,
  body,
  paths
});

function input(overrides: Partial<PolicyInput> = {}): PolicyInput {
  const commits = overrides.commits ?? [commit("fix: foco visible", ["src/styles/base.css"])];
  return {
    author: "mistorias-bot[bot]",
    botLogins: ["mistorias-bot[bot]"],
    title: "fix: foco visible",
    commits,
    commitAuthors: commits.map(() => "mistorias-bot[bot]"),
    files: [{ path: "src/styles/base.css", status: "modified" }],
    linkedIssueTypes: ["Bug"],
    approvals: [],
    headSha: "head1",
    config: CONFIG,
    ...overrides
  };
}

describe("globToRegExp", () => {
  it("** cruza carpetas y * no", () => {
    expect(matchesAny(".github/workflows/ci.yml", [".github/**"])).toBe(true);
    expect(matchesAny("src/lib/a/b-gate.ts", ["src/lib/**/*-gate.ts"])).toBe(true);
    expect(matchesAny("src/lib/a/b/c-gate.ts", ["src/lib/*/*-gate.ts"])).toBe(false);
    expect(matchesAny("CLAUDE.md", ["CLAUDE.md"])).toBe(true);
  });

  it("el punto y otros caracteres especiales son literales", () => {
    expect(globToRegExp("a.b").test("aXb")).toBe(false);
    expect(globToRegExp("a+b").test("a+b")).toBe(true);
  });

  it("el patrón debe coincidir con la ruta completa", () => {
    expect(matchesAny("docs/CLAUDE.md", ["CLAUDE.md"])).toBe(false);
    expect(matchesAny("CLAUDE.md.bak", ["CLAUDE.md"])).toBe(false);
  });
});

describe("evaluateMergePolicy: quién", () => {
  it("no opina sobre un PR que no es del bot", () => {
    const result = evaluateMergePolicy(input({ author: "paolocarrasco" }));

    expect(result).toMatchObject({ evaluated: false, pass: true, needsHuman: false });
  });

  it("un fix del bot sin rutas protegidas se fusiona solo", () => {
    const result = evaluateMergePolicy(input());

    expect(result).toMatchObject({ evaluated: true, bump: "patch", needsHuman: false, pass: true });
    expect(result.reasons).toEqual([]);
  });

  it("un commit de una persona en la rama pide revisión humana", () => {
    const commits = [commit("fix: a", ["src/a.ts"]), commit("fix: b", ["src/b.ts"], "", "bbbbbbb2222")];
    const result = evaluateMergePolicy(input({ commits, commitAuthors: ["mistorias-bot[bot]", "paolocarrasco"] }));

    expect(result.pass).toBe(false);
    expect(result.reasons).toContain("La rama tiene commits que no son del bot.");
  });

  it("un commit sin autor conocido también pide revisión humana", () => {
    const result = evaluateMergePolicy(input({ commitAuthors: [null] }));

    expect(result.needsHuman).toBe(true);
  });
});

describe("evaluateMergePolicy: la subida", () => {
  it.each([
    ["none", "docs: aclarar el ADR", ["docs/adr/0001.md"], false],
    ["patch", "fix: foco visible", ["src/styles/base.css"], false],
    ["minor", "feat: cuadro de diálogo", ["src/styles/base.css"], true],
    ["major", "feat!: cambia las rutas", ["src/lib/routes.ts"], true]
  ])("%s: %s", (bump, subject, paths, needsHuman) => {
    const commits = [commit(subject, paths)];
    const files = paths.map((path) => ({ path, status: "modified" as const }));
    const result = evaluateMergePolicy(input({ title: subject, commits, files }));

    expect(result.bump).toBe(bump);
    expect(result.needsHuman).toBe(needsHuman);
    expect(result.pass).toBe(!needsHuman);
  });

  it("toma la mayor entre el título y los commits", () => {
    const commits = [commit("fix: a", ["src/a.ts"])];
    const result = evaluateMergePolicy(input({ title: "feat: algo nuevo", commits }));

    expect(result.bump).toBe("minor");
  });

  it("un issue de tipo Feature sube a minor aunque el bot lo llame fix", () => {
    const result = evaluateMergePolicy(input({ linkedIssueTypes: ["Feature"] }));

    expect(result.bump).toBe("minor");
    expect(result.pass).toBe(false);
  });

  it("un archivo nuevo en src/pages o src/components sube a minor aunque se llame fix", () => {
    const files = [{ path: "src/components/Dialogo.astro", status: "added" as const }];

    expect(evaluateMergePolicy(input({ files })).bump).toBe("minor");
  });

  it("modificar un componente existente no lo sube", () => {
    const files = [{ path: "src/components/Dialogo.astro", status: "modified" as const }];

    expect(evaluateMergePolicy(input({ files })).bump).toBe("patch");
  });

  it("un título que no es Conventional Commits pide a una persona", () => {
    const result = evaluateMergePolicy(input({ title: "Arreglo el foco" }));

    expect(result.bump).toBe("major");
    expect(result.reasons[0]).toContain("no sigue Conventional Commits");
  });

  it("un commit no convencional también", () => {
    const commits = [commit("arreglo", ["src/a.ts"])];

    expect(evaluateMergePolicy(input({ commits })).pass).toBe(false);
  });
});

describe("evaluateMergePolicy: rutas protegidas", () => {
  it.each([
    [".github/workflows/ci.yml"],
    ["CLAUDE.md"],
    ["public/_headers"],
    ["src/layouts/BaseLayout.astro"],
    ["src/lib/assets/inline-svg-gate.ts"]
  ])("%s exige aprobación aunque sea un fix", (filePath) => {
    const files = [{ path: filePath, status: "modified" as const }];
    const result = evaluateMergePolicy(input({ files }));

    expect(result.protectedPaths).toEqual([filePath]);
    expect(result.pass).toBe(false);
  });

  it("una ruta parecida pero no protegida no cuenta", () => {
    const files = [{ path: "docs/CLAUDE.md", status: "modified" as const }];

    expect(evaluateMergePolicy(input({ files })).protectedPaths).toEqual([]);
  });
});

describe("evaluateMergePolicy: la aprobación", () => {
  const minor = () => input({ title: "feat: nuevo", commits: [commit("feat: nuevo", ["src/a.ts"])] });
  const approval = (overrides = {}) => ({ login: "paolocarrasco", association: "OWNER", commitId: "head1", ...overrides });

  it("una aprobación del dueño sobre el último commit lo deja pasar", () => {
    const result = evaluateMergePolicy({ ...minor(), approvals: [approval()] });

    expect(result).toMatchObject({ needsHuman: true, approved: true, pass: true });
  });

  it("una aprobación de un miembro también vale", () => {
    expect(evaluateMergePolicy({ ...minor(), approvals: [approval({ association: "MEMBER" })] }).pass).toBe(true);
  });

  it("una aprobación sobre un commit anterior no vale", () => {
    const result = evaluateMergePolicy({ ...minor(), approvals: [approval({ commitId: "head0" })] });

    expect(result.pass).toBe(false);
    expect(result.reasons.at(-1)).toBe("Falta la aprobación de una persona sobre el último commit.");
  });

  it("alguien sin relación con el repositorio no aprueba", () => {
    for (const association of ["NONE", "CONTRIBUTOR", "FIRST_TIMER"]) {
      expect(evaluateMergePolicy({ ...minor(), approvals: [approval({ association })] }).pass).toBe(false);
    }
  });

  it("el bot no se aprueba a sí mismo", () => {
    const result = evaluateMergePolicy({ ...minor(), approvals: [approval({ login: "mistorias-bot[bot]" })] });

    expect(result.pass).toBe(false);
  });

  it("sin motivos para pedirla, no hace falta aprobación y no se pide", () => {
    const result = evaluateMergePolicy(input());

    expect(result.approved).toBe(false);
    expect(result.pass).toBe(true);
  });
});

describe("evaluateMergePolicy: rollback", () => {
  const original = commit("feat: cuadro de diálogo", ["src/components/Dialogo.astro"], "", "aaaaaaa1111");
  const rollback = (body: string) => commit("revert: quitar el cuadro de diálogo", ["src/components/Dialogo.astro"], body, "bbbbbbb2222");
  const run = (revertBody: string, lookup?: (hash: string) => Commit | undefined) =>
    evaluateMergePolicy(
      input({
        title: "revert: quitar el cuadro de diálogo",
        commits: [rollback(revertBody)],
        files: [{ path: "src/components/Dialogo.astro", status: "removed" }],
        linkedIssueTypes: [],
        lookup
      })
    );
  const published = (hash: string) => (original.hash.startsWith(hash) ? original : undefined);

  it("el rollback de una funcionalidad es minor y espera aprobación", () => {
    const result = run("This reverts commit aaaaaaa1111.", published);

    expect(result).toMatchObject({ bump: "minor", pass: false });
  });

  it("el rollback de una corrección se fusiona solo", () => {
    const fix = commit("fix: foco", ["src/styles/base.css"], "", "ccccccc3333");
    const result = run("This reverts commit ccccccc3333.", (hash) => (fix.hash.startsWith(hash) ? fix : undefined));

    expect(result).toMatchObject({ bump: "patch", pass: true });
  });

  it("un revert que no dice qué revierte pide a una persona", () => {
    const result = run("");

    expect(result.pass).toBe(false);
    expect(result.reasons.some((reason) => reason.includes("revierte un commit que no se encontró"))).toBe(true);
  });

  it("un revert cuyo original no se encuentra pide a una persona", () => {
    expect(run("This reverts commit ddddddd4444.", published).pass).toBe(false);
  });

  it("un revert que solo toca documentación no necesita encontrar el original", () => {
    const docs = commit("revert: quitar nota", ["docs/a.md"], "", "eeeeeee5555");
    const result = evaluateMergePolicy(
      input({ title: "revert: quitar nota", commits: [docs], files: [{ path: "docs/a.md", status: "modified" }] })
    );

    expect(result).toMatchObject({ bump: "none", pass: true });
  });
});
