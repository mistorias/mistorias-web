import { defineConfig } from "astro/config";
import { noRawHtml } from "./src/lib/content/no-raw-html-integration";
import { storyAssetFolders } from "./src/lib/content/story-asset-folders-integration";

const deploymentTarget = process.env.DEPLOY_TARGET ?? "development";
const isGitHubPages = deploymentTarget === "development";

export default defineConfig({
  srcDir: "src",
  integrations: [noRawHtml(), storyAssetFolders()],
  site: isGitHubPages
    ? "https://mistorias.github.io"
    : "https://mistorias.pe",
  base: isGitHubPages ? "/mistorias-web" : "/"
});
