import { experimental_AstroContainer } from "astro/container";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";

export async function renderAstroComponent(
  component: AstroComponentFactory,
  options?: {
    props?: Record<string, unknown>;
    slots?: Record<string, string>;
    site?: string;
    url?: string;
  }
): Promise<string> {
  const astroConfig = options?.site ? { site: options.site } : undefined;
  const container = await experimental_AstroContainer.create({ astroConfig });
  const renderOptions = {
    props: options?.props,
    slots: options?.slots,
    request: options?.url ? new Request(new URL(options.url, "https://example.com")) : undefined,
  };
  return container.renderToString(component, renderOptions);
}
