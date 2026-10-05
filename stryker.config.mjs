// Mutation testing (issue #112): mide si los tests detectan cambios reales en
// el código, no solo si lo ejecutan (lo que la cobertura de líneas no ve).
// No define `thresholds.break` a propósito: por ahora no debe hacer fallar
// el build, solo dar visibilidad del puntaje. `htmlReporter.fileName` usa
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
  // No usar `ignoreStatic: true`: con @stryker-mutator/vitest-runner 10 y
  // vitest 5 los mutantes quedan "sobrevivientes" sin correr ningún test
  // ("Ran 0.00 tests per mutant") y el reporte sale en 0%. Ver ADR 0019 §6.
  htmlReporter: {
    fileName: "reports/mutation/index.html",
  },
};

export default config;
