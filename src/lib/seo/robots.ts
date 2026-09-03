import { isDevelopmentTarget, resolveDeploymentConfig } from "../deployment";
import { assetRoute } from "../routes";

/**
 * Crawlers de entrenamiento de IA a bloquear explícitamente en producción.
 *
 * robots.txt no es un mecanismo de seguridad (un bot que no lo respeta lo
 * ignora igual), así que esto no reemplaza ningún control de acceso: es una
 * señal de preferencia, coherente con "No te rastreamos" (ver codigo.astro).
 * Arranca solo con Bytespider a propósito, no con la lista completa de
 * crawlers de IA conocidos — se amplía cuando haga falta. Candidatos ya
 * identificados para sumar después: GPTBot, CCBot, Google-Extended,
 * ClaudeBot, meta-externalagent, Applebot-Extended, PerplexityBot. Cuidado
 * al ampliar: varias empresas tienen un bot "de búsqueda" y uno "de
 * entrenamiento" con nombres parecidos (p. ej. Applebot sí debe seguir
 * permitido, solo Applebot-Extended es el de entrenamiento) — bloquear el
 * equivocado rompe la indexación real, no el entrenamiento de IA.
 */
const AI_TRAINING_CRAWLERS: readonly string[] = ["Bytespider"];

const SITEMAP_FILENAME = "sitemap-index.xml";

export const buildRobotsTxt = (target: string | undefined): string => {
  if (isDevelopmentTarget(target)) {
    return "User-agent: *\nDisallow: /\n";
  }

  const { site, base } = resolveDeploymentConfig(target);
  const sitemapUrl = `${site}${assetRoute(base, SITEMAP_FILENAME)}`;

  const disallowBlocks = AI_TRAINING_CRAWLERS.map(
    (bot) => `User-agent: ${bot}\nDisallow: /`
  ).join("\n\n");

  return `User-agent: *\nAllow: /\n\n${disallowBlocks}\n\nSitemap: ${sitemapUrl}\n`;
};
