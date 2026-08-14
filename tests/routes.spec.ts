import { describe, expect, it } from "vitest";
import {
  aboutRoute,
  buildRoute,
  homeRoute,
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
});
