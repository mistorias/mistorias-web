// Extensión `.ts` explícita: este script corre con `node` directo, igual que
// scripts/next-version.ts.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { scanBuiltHtml } from "../src/lib/security/dist-scan.ts";

/**
 * Recorre el HTML de `dist/` y falla si alguna página trae algo que la CSP
 * bloquearía o que abre una pestaña sin `noopener noreferrer` (ADR 0037).
 *
 * Uso: node scripts/check-dist.ts [directorio]   (por defecto, dist)
 */
function htmlFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    if (statSync(full).isDirectory()) {
      return htmlFiles(full);
    }
    return full.endsWith(".html") ? [full] : [];
  });
}

function main(): void {
  const directory = process.argv[2] ?? "dist";
  const files = htmlFiles(directory);
  if (files.length === 0) {
    throw new Error(`No HTML found in ${directory}: did the build run?`);
  }

  const problems = files.flatMap((file) =>
    scanBuiltHtml(readFileSync(file, "utf8")).map(
      (violation) => `  ${file}: [${violation.rule}] ${violation.detail}`
    )
  );

  if (problems.length > 0) {
    console.error(`The built HTML breaks what the CSP promises:\n${problems.join("\n")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${files.length} pages checked in ${directory}: no scripts, event handlers or external resources.`);
}

main();
