import { defineConfig } from "astro/config";
import { noRawHtml } from "./src/lib/content/no-raw-html-integration";
import { storyAssetFolders } from "./src/lib/content/story-asset-folders-integration";
import { simboloDeMarca } from "./src/lib/marca/simbolo-gate-integration";
import { configuracionDeDespliegue } from "./src/lib/despliegue";

const { site, base } = configuracionDeDespliegue(process.env.DEPLOY_TARGET);

export default defineConfig({
  srcDir: "src",
  integrations: [noRawHtml(), storyAssetFolders(), simboloDeMarca()],
  site,
  base
});
