import { defineConfig } from "vitest/config";

// El estándar del equipo es una cobertura mayor a 90% (docs/STANDARDS.md), y
// este es el número que lo hace cumplir: acá vive el umbral y en ningún otro
// lado. Se fija apenas encima de 90 porque Vitest falla cuando la cobertura
// queda *por debajo* del umbral, y un 90% exacto no es "mayor a 90%".
const COBERTURA_MINIMA = 90.01;

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    coverage: {
      // Se mide en cada corrida —no solo en CI— para que el resultado del
      // pipeline no sea una sorpresa al abrir el PR.
      enabled: true,
      provider: "v8",
      // Se mide el TypeScript de `src/`, que es donde vive la lógica que los
      // tests ejercitan. Los componentes `.astro` quedan fuera: no se prueban
      // con Vitest y contarlos como cero apagaría el umbral sin decir nada
      // sobre la lógica.
      include: ["src/**/*.ts"],
      reporter: [
        // Tabla por archivo en la salida de la corrida: dice cuál es la
        // cobertura actual y qué archivo la está bajando.
        "text",
        // Resumen a archivo para publicarlo en el resumen del job de CI.
        ["text-summary", { file: "cobertura.txt" }],
      ],
      thresholds: {
        lines: COBERTURA_MINIMA,
        statements: COBERTURA_MINIMA,
        functions: COBERTURA_MINIMA,
        branches: COBERTURA_MINIMA,
      },
    },
  },
});
