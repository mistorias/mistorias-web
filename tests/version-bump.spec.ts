import { describe, expect, it } from "vitest";
import {
  bumpForCommits,
  classifyCommit,
  compareVersions,
  type Commit,
  describeCountedCommits,
  highestBump,
  isReaderFacing,
  nextVersion,
  parseGitLog,
  replaceVersionLine,
  versionFromTag
} from "../src/lib/release/version-bump";

function commit(subject: string, paths: string[] = ["src/pages/index.astro"], body = ""): Commit {
  return { hash: "abc1234def", subject, body, paths };
}

describe("isReaderFacing", () => {
  it.each([
    ["docs/STANDARDS.md"],
    [".github/workflows/ci.yml"],
    [".claude/settings.json"],
    ["tests/routes.spec.ts"],
    ["README.md"],
    ["src/lib/content/CLAUDE.md"],
    [".devcontainer/devcontainer.json"],
    ["stryker.config.mjs"]
  ])("ignora %s porque no llega a los lectores", (filePath) => {
    expect(isReaderFacing([filePath])).toBe(false);
  });

  it.each([
    ["src/pages/index.astro"],
    ["public/_redirects"],
    ["package.json"],
    ["pnpm-lock.yaml"],
    ["astro.config.mjs"],
    ["content/mistorias-contenido"]
  ])("cuenta %s porque puede cambiar lo que ven los lectores", (filePath) => {
    expect(isReaderFacing([filePath])).toBe(true);
  });

  it("cuenta el commit si al menos una de sus rutas llega a los lectores", () => {
    expect(isReaderFacing(["docs/adr/0001.md", "src/lib/routes.ts"])).toBe(true);
  });

  it("no cuenta un commit sin rutas, como un merge", () => {
    expect(isReaderFacing([])).toBe(false);
  });

  it("solo ignora docs/ en la raíz, no una carpeta docs anidada", () => {
    expect(isReaderFacing(["src/docs/guia.ts"])).toBe(true);
  });
});

describe("classifyCommit", () => {
  it.each([
    ["feat: el lector ve el quipu", "minor"],
    ["feat(rutas): agregar latestStoryRoute", "minor"],
    ["fix(portada): desempatar por id", "patch"],
    ["chore(deps): bump astro from 7.3.5 to 7.3.8", "patch"],
    ["refactor: separar helpers", "patch"],
    ["perf: imágenes más livianas", "patch"],
    ["build: nueva versión de node", "patch"],
    ["docs: documentar /ultima", "none"],
    ["ci: nuevo workflow", "none"],
    ["style: formato", "none"],
    ["test: más casos", "none"]
  ])("%s → %s", (subject, expected) => {
    expect(classifyCommit(commit(subject))).toBe(expected);
  });

  it.each([
    ["feat!: cambia las rutas públicas"],
    ["fix(rutas)!: quita /etiquetas"],
    ["refactor!: nuevo esquema"]
  ])("un ! tras el tipo pide una versión mayor: %s", (subject) => {
    expect(classifyCommit(commit(subject))).toBe("major");
  });

  it("el pie BREAKING CHANGE pide una versión mayor", () => {
    const body = "Explicación.\n\nBREAKING CHANGE: las rutas cambian";

    expect(classifyCommit(commit("fix: rutas", undefined, body))).toBe("major");
  });

  it("el pie BREAKING-CHANGE (con guion) también pide una versión mayor", () => {
    expect(classifyCommit(commit("fix: rutas", undefined, "BREAKING-CHANGE: x"))).toBe("major");
  });

  it("mencionar BREAKING CHANGE en medio de una línea no es el pie", () => {
    expect(classifyCommit(commit("fix: rutas", undefined, "no hay BREAKING CHANGE: aquí"))).toBe("patch");
  });

  it("ignora un feat que solo toca rutas sin impacto para lectores", () => {
    expect(classifyCommit(commit("feat: plantilla", [".github/ISSUE_TEMPLATE/x.md"]))).toBe("none");
  });

  it("ignora un commit no convencional que solo toca rutas sin impacto", () => {
    expect(classifyCommit(commit("Crea una plantilla", [".github/ISSUE_TEMPLATE/x.md"]))).toBe("none");
  });

  it.each([
    ["Crea una plantilla"],
    ["feat:sin espacio"],
    ["feat: "],
    ["Feat: mayúscula"],
    ["feat(): alcance vacío"]
  ])("devuelve null para un commit no convencional que llega a los lectores: %s", (subject) => {
    expect(classifyCommit(commit(subject))).toBeNull();
  });
});

describe("highestBump", () => {
  it("devuelve none para una lista vacía", () => {
    expect(highestBump([])).toBe("none");
  });

  it.each([
    [["none", "patch"], "patch"],
    [["patch", "minor", "patch"], "minor"],
    [["minor", "major", "patch"], "major"],
    [["none", "none"], "none"]
  ] as const)("de %j toma %s", (bumps, expected) => {
    expect(highestBump([...bumps])).toBe(expected);
  });
});

describe("bumpForCommits", () => {
  it("toma la mayor subida entre los commits", () => {
    const commits = [commit("fix: a"), commit("feat: b"), commit("docs: c")];

    expect(bumpForCommits(commits)).toBe("minor");
  });

  it("lista en el error todos los commits no convencionales que llegan a los lectores", () => {
    const commits = [
      { ...commit("Primer cambio"), hash: "1111111aaaa" },
      commit("fix: bien"),
      { ...commit("Segundo cambio"), hash: "2222222bbbb" }
    ];

    expect(() => bumpForCommits(commits)).toThrowError(
      /1111111 Primer cambio\n.*2222222 Segundo cambio/s
    );
  });
});

describe("versionFromTag", () => {
  it("quita la v del tag", () => {
    expect(versionFromTag("v1.8.0")).toBe("1.8.0");
  });

  it.each([["1.8.0"], ["v1.8"], ["v1.8.0-beta"], ["release-1.8.0"]])(
    "rechaza un tag que no es v + SemVer: %s",
    (tag) => {
      expect(() => versionFromTag(tag)).toThrowError(tag);
    }
  );
});

describe("nextVersion", () => {
  it.each([
    ["1.8.0", "none", "1.8.0"],
    ["1.8.3", "patch", "1.8.4"],
    ["1.8.3", "minor", "1.9.0"],
    ["1.8.3", "major", "2.0.0"],
    ["9.9.9", "patch", "9.9.10"]
  ] as const)("%s con %s → %s", (base, bump, expected) => {
    expect(nextVersion(base, bump)).toBe(expected);
  });

  it("rechaza una versión que no es SemVer", () => {
    expect(() => nextVersion("1.8", "patch")).toThrowError("1.8");
  });
});

describe("compareVersions", () => {
  it.each([
    ["1.9.0", "1.8.1", 1],
    ["1.8.1", "1.9.0", -1],
    ["1.9.0", "1.9.0", 0],
    ["2.0.0", "1.99.99", 1],
    ["1.10.0", "1.9.0", 1],
    ["1.9.10", "1.9.9", 1]
  ] as const)("%s comparado con %s → %d", (a, b, expected) => {
    expect(Math.sign(compareVersions(a, b))).toBe(expected);
  });
});

describe("replaceVersionLine", () => {
  const packageJson = '{\n  "name": "mistorias-web",\n  "version": "1.8.0",\n  "private": true\n}\n';

  it("cambia solo la línea de la versión", () => {
    expect(replaceVersionLine(packageJson, "1.8.0", "1.9.0")).toBe(
      '{\n  "name": "mistorias-web",\n  "version": "1.9.0",\n  "private": true\n}\n'
    );
  });

  it("falla si la versión actual no aparece", () => {
    expect(() => replaceVersionLine(packageJson, "1.7.0", "1.9.0")).toThrowError("1.7.0");
  });

  it("falla si la línea de la versión aparece más de una vez", () => {
    const duplicated = packageJson.replace('"private"', '"version": "1.8.0",\n  "private"');

    expect(() => replaceVersionLine(duplicated, "1.8.0", "1.9.0")).toThrowError("2");
  });

  it("no toma un punto de la versión como comodín", () => {
    const lookalike = '{\n  "version": "1x8x0"\n}\n';

    expect(() => replaceVersionLine(lookalike, "1.8.0", "1.9.0")).toThrowError();
  });
});

describe("parseGitLog", () => {
  it("separa hash, asunto, cuerpo y rutas de cada commit", () => {
    const raw =
      "\x1eaaa111\x1ffeat: uno\x1fcuerpo\nde dos líneas\x1f\n\nsrc/a.ts\nsrc/b.ts\n" +
      "\x1ebbb222\x1fdocs: dos\x1f\x1f\n\ndocs/x.md\n";

    expect(parseGitLog(raw)).toEqual([
      { hash: "aaa111", subject: "feat: uno", body: "cuerpo\nde dos líneas", paths: ["src/a.ts", "src/b.ts"] },
      { hash: "bbb222", subject: "docs: dos", body: "", paths: ["docs/x.md"] }
    ]);
  });

  it("devuelve una lista vacía cuando no hay commits", () => {
    expect(parseGitLog("")).toEqual([]);
  });

  it("acepta un commit sin rutas, como un merge", () => {
    expect(parseGitLog("\x1eccc333\x1fMerge x\x1f\x1f\n")).toEqual([
      { hash: "ccc333", subject: "Merge x", body: "", paths: [] }
    ]);
  });
});

describe("describeCountedCommits", () => {
  it("lista solo los commits que suben la versión, con su subida", () => {
    const commits = [
      { ...commit("feat: uno"), hash: "aaaaaaa1111" },
      commit("docs: dos"),
      { ...commit("fix: tres"), hash: "bbbbbbb2222" }
    ];

    expect(describeCountedCommits(commits)).toEqual([
      "- `aaaaaaa` feat: uno (minor)",
      "- `bbbbbbb` fix: tres (patch)"
    ]);
  });
});
