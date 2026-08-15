import { describe, expect, it } from "vitest";
import {
  aboutRoute,
  assetRoute,
  brandRoute,
  buildRoute,
  editorialContentRoute,
  homeRoute,
  reportRoute,
  siteCodeRoute,
  storyRoute,
  tagRoute,
  tagsRoute
} from "../src/lib/routes";

// El sitio se despliega en dos destinos con base distinta: GitHub Pages sirve
// bajo /mistorias-web y Netlify bajo la raíz. Un enlace escrito a mano se rompe
// en uno de los dos sin que el build avise, así que la construcción vive acá.
const BASE_PAGES = "/mistorias-web/";
const BASE_NETLIFY = "/";

describe("buildRoute", () => {
  it("devuelve la raíz cuando no recibe segmentos", () => {
    expect(buildRoute(BASE_NETLIFY)).toBe("/");
  });

  it("conserva la base del despliegue cuando no recibe segmentos", () => {
    expect(buildRoute(BASE_PAGES)).toBe("/mistorias-web/");
  });

  it("tolera una base sin barra final", () => {
    expect(buildRoute("/mistorias-web")).toBe("/mistorias-web/");
  });

  it("encadena los segmentos bajo la raíz", () => {
    expect(buildRoute(BASE_NETLIFY, "historias", "una-historia")).toBe(
      "/historias/una-historia/"
    );
  });

  it("encadena los segmentos bajo la base del despliegue", () => {
    expect(buildRoute(BASE_PAGES, "historias", "una-historia")).toBe(
      "/mistorias-web/historias/una-historia/"
    );
  });

  it("descarta segmentos vacíos en vez de generar barras dobles", () => {
    expect(buildRoute(BASE_NETLIFY, "", "historias", "")).toBe("/historias/");
  });

  it("normaliza las barras sobrantes de cada segmento", () => {
    expect(buildRoute(BASE_NETLIFY, "/historias/", "/una-historia/")).toBe(
      "/historias/una-historia/"
    );
  });

  it("acepta un identificador de historia con subcarpetas", () => {
    expect(buildRoute(BASE_PAGES, "historias", "2026/agosto/una")).toBe(
      "/mistorias-web/historias/2026/agosto/una/"
    );
  });
});

// Los iconos y el manifiesto viven en `public/` y se sirven tal cual. Son
// archivos, no páginas: llevan la base del despliegue igual que un enlace, pero
// sin la barra final que `buildRoute` agrega (`favicon.ico/` no existe).
describe("assetRoute", () => {
  it("sirve el archivo desde la raíz cuando la base es la raíz", () => {
    expect(assetRoute(BASE_NETLIFY, "favicon.ico")).toBe("/favicon.ico");
  });

  it("antepone la base del despliegue al archivo", () => {
    expect(assetRoute(BASE_PAGES, "favicon.ico")).toBe(
      "/mistorias-web/favicon.ico"
    );
  });

  // Una base sin barra final concatenada a mano da `/mistorias-webfavicon.ico`:
  // un 404 silencioso que ningún build reporta.
  it("tolera una base sin barra final", () => {
    expect(assetRoute("/mistorias-web", "favicon.ico")).toBe(
      "/mistorias-web/favicon.ico"
    );
  });

  it("no agrega barra final al archivo", () => {
    expect(assetRoute(BASE_PAGES, "site.webmanifest")).not.toMatch(/\/$/);
  });

  it("encadena segmentos cuando el archivo vive en una subcarpeta", () => {
    expect(assetRoute(BASE_NETLIFY, "iconos", "favicon-32x32.png")).toBe(
      "/iconos/favicon-32x32.png"
    );
  });
});

describe("rutas con nombre", () => {
  it("apunta el inicio a la base del despliegue", () => {
    expect(homeRoute(BASE_PAGES)).toBe("/mistorias-web/");
    expect(homeRoute(BASE_NETLIFY)).toBe("/");
  });

  it("publica cada historia bajo /historias/", () => {
    expect(storyRoute(BASE_NETLIFY, "2026-08-07-como-se-mueve")).toBe(
      "/historias/2026-08-07-como-se-mueve/"
    );
  });

  it("publica cada etiqueta bajo /etiquetas/", () => {
    expect(tagRoute(BASE_PAGES, "junin")).toBe(
      "/mistorias-web/etiquetas/junin/"
    );
  });

  it("expone el índice de etiquetas y la página Acerca de", () => {
    expect(tagsRoute(BASE_NETLIFY)).toBe("/etiquetas/");
    expect(aboutRoute(BASE_NETLIFY)).toBe("/acerca/");
  });

  // Las cuatro páginas del pie reemplazan enlaces que antes salían a GitHub
  // (issue #28). Como todo enlace interno, tienen que respetar la base del
  // despliegue: escritas a mano acertarían en Netlify y romperían en Pages.
  it("expone las páginas de transparencia que enlaza el pie", () => {
    expect(editorialContentRoute(BASE_NETLIFY)).toBe("/contenido/");
    expect(siteCodeRoute(BASE_NETLIFY)).toBe("/codigo/");
    expect(brandRoute(BASE_NETLIFY)).toBe("/marca/");
    expect(reportRoute(BASE_NETLIFY)).toBe("/reportar/");
  });

  it("publica las páginas del pie bajo la base del despliegue", () => {
    expect(editorialContentRoute(BASE_PAGES)).toBe("/mistorias-web/contenido/");
    expect(siteCodeRoute(BASE_PAGES)).toBe("/mistorias-web/codigo/");
    expect(brandRoute(BASE_PAGES)).toBe("/mistorias-web/marca/");
    expect(reportRoute(BASE_PAGES)).toBe("/mistorias-web/reportar/");
  });
});
