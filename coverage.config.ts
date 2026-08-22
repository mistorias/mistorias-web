// Configuración de cobertura compartida entre vitest.config.ts y tests/cobertura.spec.ts
// El estándar del equipo es una cobertura mayor a 90% (docs/STANDARDS.md)
export const COBERTURA_MINIMA = 90.01;

export const coverageConfig = {
  enabled: true,
  provider: "v8" as const,
  // Incluye TypeScript + los componentes .astro con tests propios (issue #33).
  // No se usa src/**/*.astro porque incluiría todos los .astro sin tests,
  // arrastrando la cobertura promedio. En su lugar, listamos explícitamente
  // solo los que tenemos tests para, más sus hijos que se importan.
  include: [
    "src/**/*.ts",
    "src/layouts/BaseLayout.astro",
    "src/components/LogotipoMistorias.astro",
    "src/components/SimboloMistorias.astro",
    "src/components/TarjetaHistoria.astro",
    "src/components/ListaTemas.astro",
    "src/components/CabeceraSitio.astro",
    "src/components/PieSitio.astro",
    "src/components/DatoConFuente.astro",
  ],
  reporter: ["text", ["text-summary", { file: "cobertura.txt" }]] as Array<
    "text" | ["text-summary", { file: string }]
  >,
  thresholds: {
    lines: COBERTURA_MINIMA,
    statements: COBERTURA_MINIMA,
    functions: COBERTURA_MINIMA,
    branches: COBERTURA_MINIMA,
  },
};
