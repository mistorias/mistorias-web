import { defineConfig } from "astro/config";

const deploymentTarget = process.env.DEPLOY_TARGET ?? "github-pages";
const isGitHubPages = deploymentTarget === "github-pages";

export default defineConfig({
  srcDir: "src",
  site: isGitHubPages
    ? "https://mistorias.github.io"
    : "https://mistorias.pe",
  base: isGitHubPages ? "/mistorias-web" : "/"
});
