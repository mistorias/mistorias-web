// Mutation testing (issue #112): mide si los tests detectan cambios reales en
// el código, no solo si lo ejecutan (lo que la cobertura de líneas no ve).
// `thresholds.break` en 60: un puntaje menor falla `pnpm mutation-test` (con
// vitest 4.1 el puntaje total es ~85%; con el runner roto por vitest 5 era 0%,
// y nadie lo notó porque nada fallaba). `htmlReporter.fileName` usa
// `index.html` para que el reporte quede en una URL de carpeta legible
// cuando se publica en GitHub Pages.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  // pnpm no deja node_modules plano, así que el autodescubrimiento de
  // plugins de Stryker (glob sobre `@stryker-mutator/*`) no encuentra el
  // runner: hay que declararlo explícitamente.
  plugins: ["@stryker-mutator/vitest-runner"],
  testRunner: "vitest",
  mutate: ["src/**/*.ts"],
  // La mayoría de mutantes en este proyecto son estáticos (constantes,
  // schemas Zod evaluados al importar el módulo): sin esto, Stryker corre
  // toda la suite de tests por cada uno en vez de una sola vez.
  ignoreStatic: true,
  thresholds: { break: 60 },
  htmlReporter: {
    fileName: "reports/mutation/index.html",
  },
};

export default config;
