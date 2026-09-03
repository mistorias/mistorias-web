import type { APIContext } from "astro";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "../src/pages/robots.txt";
import { buildRobotsTxt } from "../src/lib/seo/robots";

// GitHub Pages ya se trata como build de trabajo en progreso (ADR 0008,
// issue #28): un robots.txt que permite indexación lo haría más fácil de
// confundir con el sitio real, así que se bloquea por completo.
describe("buildRobotsTxt en development", () => {
  it("bloquea todo el crawleo", () => {
    expect(buildRobotsTxt("development")).toBe("User-agent: *\nDisallow: /\n");
  });

  it("bloquea todo el crawleo cuando no se declara ningún destino", () => {
    expect(buildRobotsTxt(undefined)).toBe(buildRobotsTxt("development"));
  });
});

// mistorias.pe es el sitio real: permite indexación completa por defecto,
// bloquea dirigidamente a los crawlers de entrenamiento de IA conocidos (sin
// tocar los bots de vista previa de enlace, ver ADR 0013) y anuncia el
// sitemap.
describe("buildRobotsTxt en netlify", () => {
  const contenido = buildRobotsTxt("netlify");

  it("permite el crawleo general", () => {
    expect(contenido).toContain("User-agent: *\nAllow: /");
  });

  it("bloquea a Bytespider específicamente", () => {
    expect(contenido).toContain("User-agent: Bytespider\nDisallow: /");
  });

  it("anuncia el sitemap con la URL absoluta de mistorias.pe", () => {
    expect(contenido).toContain(
      "Sitemap: https://mistorias.pe/sitemap-index.xml"
    );
  });

  it("no bloquea a los bots de vista previa de enlace", () => {
    expect(contenido).not.toContain("facebookexternalhit");
    expect(contenido).not.toContain("Twitterbot");
    expect(contenido).not.toContain("Slackbot");
  });
});

describe("buildRobotsTxt ante un destino desconocido", () => {
  it("detiene el build, igual que resolveDeploymentConfig", () => {
    expect(() => buildRobotsTxt("produccion")).toThrowError(/produccion/);
  });
});

// El endpoint solo envuelve buildRobotsTxt en una Response con el content
// type correcto; DEPLOY_TARGET llega por process.env, igual que en
// BaseLayout.astro y LogotipoMistorias.astro.
describe("el endpoint /robots.txt", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sirve el contenido de buildRobotsTxt como texto plano", async () => {
    vi.stubEnv("DEPLOY_TARGET", "netlify");

    const response = await GET({} as APIContext);

    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8"
    );
    expect(await response.text()).toBe(buildRobotsTxt("netlify"));
  });
});
