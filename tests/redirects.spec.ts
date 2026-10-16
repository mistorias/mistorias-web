import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { themesRoute } from "../src/lib/routes";

// `public/_redirects` es un archivo de texto que solo Netlify interpreta: no
// pasa por el build, así que nada avisaría si el destino dejara de existir.
// Estas pruebas lo atan a `routes.ts`, que es donde vive el nombre de la
// sección: si `/temas/` se renombra, la redirección de issue #107 falla acá y
// no en producción.

const REDIRECTS = readFileSync(
  path.resolve(process.cwd(), "public/_redirects"),
  "utf8"
);

// Netlify sirve el sitio en la raíz del dominio (`resolveDeploymentConfig`),
// así que las rutas del archivo se escriben con esa base y no con la de
// GitHub Pages.
const BASE_NETLIFY = "/";

type Rule = {
  readonly from: string;
  readonly to: string;
  readonly status: string;
};

const rules: readonly Rule[] = REDIRECTS.split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith("#"))
  .map((line) => line.split(/\s+/))
  .map(([from, to, status]) => ({
    from: from ?? "",
    to: to ?? "",
    status: status ?? ""
  }));

const ruleFor = (from: string): Rule | undefined =>
  rules.find((rule) => rule.from === from);

describe("redirecciones de /etiquetas hacia /temas", () => {
  // Una redirección temporal le diría al buscador que la ruta vieja va a
  // volver, y volvería a pedirla indefinidamente: acá la mudanza es
  // definitiva (ADR 0009).
  it("redirige de forma permanente", () => {
    expect(rules).not.toHaveLength(0);

    for (const rule of rules) {
      expect(rule.status).toBe("301");
    }
  });

  it("manda cada tema al mismo slug bajo la sección nueva", () => {
    expect(ruleFor("/etiquetas/*")?.to).toBe(
      `${themesRoute(BASE_NETLIFY)}:splat`
    );
  });

  it("manda la sección vieja al índice de temas", () => {
    expect(ruleFor("/etiquetas")?.to).toBe(themesRoute(BASE_NETLIFY));
  });

  // El artefacto que se publica en mistorias.pe no debe llevar nunca la base
  // de GitHub Pages (issue #29): acá el riesgo es el mismo, con el agravante
  // de que un destino mal escrito redirige a un 404.
  it("no arrastra la base de GitHub Pages", () => {
    for (const rule of rules) {
      expect(rule.to).not.toContain("/mistorias-web");
    }
  });
});
