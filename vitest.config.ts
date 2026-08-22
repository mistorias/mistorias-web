/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";
import { coverageConfig } from "./coverage.config";

export default getViteConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    coverage: {
      // Se mide en cada corrida —no solo en CI— para que el resultado del
      // pipeline no sea una sorpresa al abrir el PR.
      enabled: coverageConfig.enabled,
      provider: coverageConfig.provider,
      // Desde issue #33 se miden también `src/**/*.astro` que el Container API
      // renderiza en los tests. Vitest solo cuenta un archivo si algún test lo
      // importa o renderiza de verdad: al no tener que importar todos los .astro
      // del proyecto, archivos sin test (src/pages/, otros componentes de puro
      // maquetado) no entran en el reporte a 0% — solo los que están ejercitados.
      // Esto permite sumar .astro a coverage.include sin que se rompa el umbral
      // por componentes sin tests aún.
      include: coverageConfig.include,
      reporter: coverageConfig.reporter,
      thresholds: coverageConfig.thresholds,
    },
  },
}, {
  srcDir: "src",
});
