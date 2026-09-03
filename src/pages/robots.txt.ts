import type { APIRoute } from "astro";
import { buildRobotsTxt } from "../lib/seo/robots";

export const GET: APIRoute = () =>
  new Response(buildRobotsTxt(process.env.DEPLOY_TARGET), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
