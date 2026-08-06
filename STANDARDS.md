# Development Standards

This file documents code, commit, and pull request standards for Mistorias projects.

## Brand & Editorial Guidelines

All work must align with [Mistorias brand essence](https://github.com/mistorias/mistorias-esencia-de-marca):

- **Empatía** — personas antes que datos (users before abstractions)
- **Transparencia** — contexto claro, fuentes visibles (clear code, documented decisions)
- **Empoderamiento** — comprensión que habilita acción (code that enables contribution)
- **Claridad** — lo complejo se vuelve entendible (simple interfaces over complex internals)

This translates to code that is **human-first**, **transparent**, **empowering to contributors**, and **clear**.

## Code Standards

### Core Principles

Code at Mistorias follows:

1. **SOLID Principles**
   - Single Responsibility — each module has one reason to change
   - Open/Closed — open for extension, closed for modification
   - Liskov Substitution — subtypes must be substitutable
   - Interface Segregation — many specific interfaces over general ones
   - Dependency Inversion — depend on abstractions, not concretions

2. **Clean Code**
   - Meaningful names that reveal intent
   - Small, focused functions (do one thing well)
   - Comments explain *why*, not *what* (code shows what)
   - DRY: Don't Repeat Yourself — extract common patterns
   - No premature optimization

3. **Clean Architecture**
   - Separation of concerns (business logic, UI, infrastructure)
   - Dependencies point inward (never outward)
   - Core domain logic independent of frameworks
   - Testable by design

4. **High Cohesion, Low Coupling**
   - Related functionality grouped together
   - Minimal dependencies between modules
   - Clear contracts between layers

5. **Functional Programming Where Applicable**
   - Prefer immutability and pure functions
   - Avoid side effects at boundaries
   - Favor composition over inheritance
   - Use TypeScript's type system expressively

6. **Test-Driven Development (TDD)**
   - Write tests before implementation (or with)
   - Tests document expected behavior
   - Red → Green → Refactor cycle
   - Aim for meaningful coverage, not 100%

### TypeScript-Specific

- Use strict mode (enforced in `tsconfig.json`)
- Prefer `type` over `interface` unless class-like behavior is needed
- Avoid `any` — use `unknown` if necessary, then narrow
- Zod for runtime validation of external data (as in `storySchema`)

### No Premature Abstractions

Three similar lines of code is better than a premature helper function. If a pattern repeats across different domains, extract it. If it's isolated, leave it.

---

## Commit Standards

### Conventional Commits

All commits follow [Conventional Commits](https://www.conventionalcommits.org/) in Spanish (or English if the codebase uses it).

Format:
```
<type>(<scope>): <subject in present tense>

<body explaining why and what>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Example (Spanish, third-person present):**
```
feat(docker): agregar Dockerfile y entrypoint para dev container

Se proporciona Dockerfile basado en node:24-bookworm-slim que emula
el entorno de despliegue. El entrypoint inicializa submodules e
instala dependencias de forma idempotente.

Cierra #19
```

### Atomic Commits

Each commit represents one logical, self-contained change:

- Do not mix unrelated refactoring with feature work
- One feature per commit (or one small sub-feature if a feature is large)
- One bug fix per commit
- Do not commit WIP or partially tested code

Example: if fixing a bug and improving docs, make two commits:
- `fix: corregir validación de fecha en formulario`
- `docs: aclarar flujo de validación en README`

### Preemptive Commits

Commits describe the **result** of the change using third-person present, focusing on:
- **What the system gains** (for infrastructure, build, or new functionality)
- **What the user can do** (for new features)
- **What the developer can do** (for scripts, pipelines, documentation)

Examples:

**Infrastructure/Build:**
- ✅ `build: Dockerfile es disponible para levantar dev container`
- ❌ `add Dockerfile` (too passive)

**User-facing feature:**
- ✅ `feat: el usuario puede filtrar historias por tema`
- ❌ `feat: agregar filtro de temas` (describes action, not result)

**Developer tooling:**
- ✅ `chore: el desarrollador dispone de script para limpiar volúmenes Docker`
- ❌ `add cleanup script` (too generic)

---

## Pull Request Standards

### PR Description

Every PR must include:

1. **What changed** — a one-liner summarizing the change
2. **Why it changed** — the problem it solves or requirement it fulfills
3. **How to verify** — steps to test the change (run tests, check a feature, etc.)
4. **Related issue** — link to the issue if applicable (e.g., `Closes #19`)

**Template:**

```markdown
## What

[One-line summary of the change]

## Why

[Problem it solves or requirement. Link context: issue, ADR, discussion.]

## How to Verify

- [ ] Run `pnpm test` — tests pass
- [ ] Run `pnpm build` — build succeeds
- [ ] Navigate to http://localhost:4321 and [specific action] works

## Related

Closes #XX
```

### Before Requesting Review

- All tests pass locally (`pnpm test`, `pnpm build`)
- TypeScript type check passes (`pnpm astro check`)
- Commits are atomic and follow Conventional Commits
- Branch is up-to-date with `main`
- No debug code or commented-out lines

### PR Title

Follow Conventional Commits format in the title:
```
feat: descripción breve en presente (issue #XX)
fix: descripción breve (issue #YY)
docs: descripción breve
```

---

## References

- [Mistorias Esencia de Marca](https://github.com/mistorias/mistorias-esencia-de-marca) — brand principles, editorial guidelines
- [CLAUDE.md](CLAUDE.md) — architecture overview
- [CONTRIBUTING.md](CONTRIBUTING.md) — setup and development workflow
- [docs/adr/](docs/adr/) — architectural decisions
