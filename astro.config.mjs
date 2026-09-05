import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { noRawHtml } from "./src/lib/content/no-raw-html-integration";
import { authorsNoRawHtml } from "./src/lib/content/authors-no-raw-html-integration";
import { storyAssetFolders } from "./src/lib/content/story-asset-folders-integration";
import { storyImageRequirements } from "./src/lib/content/story-image-requirements-integration";
import { brandSymbol } from "./src/lib/brand/symbol-gate-integration";
import { publicSvg } from "./src/lib/assets/public-svg-gate-integration";
import { portadaIllustration } from "./src/lib/assets/illustration-gate-integration";
import { isDevelopmentTarget, resolveDeploymentConfig } from "./src/lib/deployment";

const { site, base } = resolveDeploymentConfig(process.env.DEPLOY_TARGET);

// GitHub Pages sirve bajo /mistorias-web, no en la raíz del origen: un
// crawler nunca llega a leer robots.txt ahí (solo mira la raíz del
// dominio), así que un sitemap real en ese destino quedaría más
// descubrible, no menos — justo lo que ADR 0008/0015 busca evitar para el
// build de trabajo en progreso. La barrera efectiva ahí es el
// <meta name="robots" content="noindex"> de BaseLayout.astro; generar un
// sitemap además no aporta nada y sí expone de más.
const integraciones = [
  noRawHtml(),
  authorsNoRawHtml(),
  storyAssetFolders(),
  storyImageRequirements(),
  brandSymbol(),
  portadaIllustration(),
  publicSvg()
];

if (!isDevelopmentTarget(process.env.DEPLOY_TARGET)) {
  integraciones.push(
    sitemap({
      // 404 no es contenido; reportar/ es soporte, no contenido editorial
      // (issue #44) — ninguno vale la pena indexar.
      filter: (page) => !page.includes("/reportar/") && !page.includes("/404")
    })
  );
}

export default defineConfig({
  srcDir: "src",
  integrations: integraciones,
  site,
  base
});
