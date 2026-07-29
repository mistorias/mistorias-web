import { defineConfig } from "astro/config";

const deploymentTarget = process.env.DEPLOY_TARGET ?? "development";
const isGitHubPages = deploymentTarget === "development";

export default defineConfig({
  srcDir: "src",
  site: isGitHubPages
    ? "https://mistorias.github.io"
    : "https://mistorias.pe",
  base: isGitHubPages ? "/mistorias-web" : "/"
});
