import { defineConfig } from "astro/config";
import { noRawHtml } from "./src/lib/content/no-raw-html-integration";
import { storyAssetFolders } from "./src/lib/content/story-asset-folders-integration";
import { simboloDeMarca } from "./src/lib/marca/simbolo-gate-integration";
import { resolveDeploymentConfig } from "./src/lib/deployment";

const { site, base } = resolveDeploymentConfig(process.env.DEPLOY_TARGET);

export default defineConfig({
  srcDir: "src",
  integrations: [noRawHtml(), storyAssetFolders(), simboloDeMarca()],
  site,
  base
});
