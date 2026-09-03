import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { noRawHtml } from "./src/lib/content/no-raw-html-integration";
import { storyAssetFolders } from "./src/lib/content/story-asset-folders-integration";
import { storyImageRequirements } from "./src/lib/content/story-image-requirements-integration";
import { brandSymbol } from "./src/lib/brand/symbol-gate-integration";
import { publicSvg } from "./src/lib/assets/public-svg-gate-integration";
import { portadaIllustration } from "./src/lib/assets/illustration-gate-integration";
import { resolveDeploymentConfig } from "./src/lib/deployment";

const { site, base } = resolveDeploymentConfig(process.env.DEPLOY_TARGET);

export default defineConfig({
  srcDir: "src",
  integrations: [
    noRawHtml(),
    storyAssetFolders(),
    storyImageRequirements(),
    brandSymbol(),
    portadaIllustration(),
    publicSvg(),
    sitemap({
      // 404 no es contenido; reportar/ es soporte, no contenido editorial
      // (issue #44) — ninguno vale la pena indexar.
      filter: (page) => !page.includes("/reportar/") && !page.includes("/404")
    })
  ],
  site,
  base
});
