import { describe, expect, it } from "vitest";
import {
  construirRuta,
  rutaAcerca,
  rutaEtiqueta,
  rutaEtiquetas,
  rutaHistoria,
  rutaInicio
} from "../src/lib/rutas";

// El sitio se despliega en dos destinos con base distinta: GitHub Pages sirve
// bajo /mistorias-web y Netlify bajo la raíz. Un enlace escrito a mano se rompe
// en uno de los dos sin que el build avise, así que la construcción vive acá.
const BASE_PAGES = "/mistorias-web/";
const BASE_NETLIFY = "/";

describe("construirRuta", () => {
  it("devuelve la raíz cuando no recibe segmentos", () => {
    expect(construirRuta(BASE_NETLIFY)).toBe("/");
  });

  it("conserva la base del despliegue cuando no recibe segmentos", () => {
    expect(construirRuta(BASE_PAGES)).toBe("/mistorias-web/");
  });

  it("tolera una base sin barra final", () => {
    expect(construirRuta("/mistorias-web")).toBe("/mistorias-web/");
  });

  it("encadena los segmentos bajo la raíz", () => {
    expect(construirRuta(BASE_NETLIFY, "historias", "una-historia")).toBe(
      "/historias/una-historia/"
    );
  });

  it("encadena los segmentos bajo la base del despliegue", () => {
    expect(construirRuta(BASE_PAGES, "historias", "una-historia")).toBe(
      "/mistorias-web/historias/una-historia/"
    );
  });

  it("descarta segmentos vacíos en vez de generar barras dobles", () => {
    expect(construirRuta(BASE_NETLIFY, "", "historias", "")).toBe("/historias/");
  });

  it("normaliza las barras sobrantes de cada segmento", () => {
    expect(construirRuta(BASE_NETLIFY, "/historias/", "/una-historia/")).toBe(
      "/historias/una-historia/"
    );
  });

  it("acepta un identificador de historia con subcarpetas", () => {
    expect(construirRuta(BASE_PAGES, "historias", "2026/agosto/una")).toBe(
      "/mistorias-web/historias/2026/agosto/una/"
    );
  });
});

describe("rutas con nombre", () => {
  it("apunta el inicio a la base del despliegue", () => {
    expect(rutaInicio(BASE_PAGES)).toBe("/mistorias-web/");
    expect(rutaInicio(BASE_NETLIFY)).toBe("/");
  });

  it("publica cada historia bajo /historias/", () => {
    expect(rutaHistoria(BASE_NETLIFY, "2026-08-07-como-se-mueve")).toBe(
      "/historias/2026-08-07-como-se-mueve/"
    );
  });

  it("publica cada etiqueta bajo /etiquetas/", () => {
    expect(rutaEtiqueta(BASE_PAGES, "junin")).toBe(
      "/mistorias-web/etiquetas/junin/"
    );
  });

  it("expone el índice de etiquetas y la página Acerca de", () => {
    expect(rutaEtiquetas(BASE_NETLIFY)).toBe("/etiquetas/");
    expect(rutaAcerca(BASE_NETLIFY)).toBe("/acerca/");
  });
});
