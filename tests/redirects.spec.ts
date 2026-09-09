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

type Regla = {
  readonly origen: string;
  readonly destino: string;
  readonly codigo: string;
};

const reglas: readonly Regla[] = REDIRECTS.split("\n")
  .map((linea) => linea.trim())
  .filter((linea) => linea.length > 0 && !linea.startsWith("#"))
  .map((linea) => linea.split(/\s+/))
  .map(([origen, destino, codigo]) => ({
    origen: origen ?? "",
    destino: destino ?? "",
    codigo: codigo ?? ""
  }));

const reglaDe = (origen: string): Regla | undefined =>
  reglas.find((regla) => regla.origen === origen);

describe("redirecciones de /etiquetas hacia /temas", () => {
  // Una redirección temporal le diría al buscador que la ruta vieja va a
  // volver, y volvería a pedirla indefinidamente: acá la mudanza es
  // definitiva (ADR 0009).
  it("redirige de forma permanente", () => {
    expect(reglas).not.toHaveLength(0);

    for (const regla of reglas) {
      expect(regla.codigo).toBe("301");
    }
  });

  it("manda cada tema al mismo slug bajo la sección nueva", () => {
    expect(reglaDe("/etiquetas/*")?.destino).toBe(
      `${themesRoute(BASE_NETLIFY)}:splat`
    );
  });

  it("manda la sección vieja al índice de temas", () => {
    expect(reglaDe("/etiquetas")?.destino).toBe(themesRoute(BASE_NETLIFY));
  });

  // El artefacto que se publica en mistorias.pe no debe llevar nunca la base
  // de GitHub Pages (issue #29): acá el riesgo es el mismo, con el agravante
  // de que un destino mal escrito redirige a un 404.
  it("no arrastra la base de GitHub Pages", () => {
    for (const regla of reglas) {
      expect(regla.destino).not.toContain("/mistorias-web");
    }
  });
});
