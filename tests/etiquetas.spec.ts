import { describe, expect, it } from "vitest";
import { agruparPorEtiqueta, normalizarEtiqueta } from "../src/lib/etiquetas";

type HistoriaDePrueba = {
  readonly titulo: string;
  readonly etiquetas: readonly string[];
};

const etiquetasDe = (historia: HistoriaDePrueba) => historia.etiquetas;

const historia = (
  titulo: string,
  etiquetas: readonly string[]
): HistoriaDePrueba => ({ titulo, etiquetas });

describe("normalizarEtiqueta", () => {
  it("baja a minúsculas y recorta los espacios", () => {
    expect(normalizarEtiqueta("  Inteligencia-Artificial ")).toBe(
      "inteligencia-artificial"
    );
  });
});

describe("agruparPorEtiqueta", () => {
  it("no devuelve grupos cuando no hay historias", () => {
    expect(agruparPorEtiqueta([], etiquetasDe)).toEqual([]);
  });

  it("reúne bajo una misma etiqueta las historias que la comparten", () => {
    const grupos = agruparPorEtiqueta(
      [historia("Primera", ["junin"]), historia("Segunda", ["junin"])],
      etiquetasDe
    );

    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.etiqueta).toBe("junin");
    expect(grupos[0]?.historias.map((h) => h.titulo)).toEqual([
      "Primera",
      "Segunda"
    ]);
  });

  it("ordena los grupos por cantidad de historias, de mayor a menor", () => {
    const grupos = agruparPorEtiqueta(
      [
        historia("Primera", ["docentes", "junin"]),
        historia("Segunda", ["docentes"])
      ],
      etiquetasDe
    );

    expect(grupos.map((grupo) => grupo.etiqueta)).toEqual(["docentes", "junin"]);
  });

  it("desempata alfabéticamente cuando dos etiquetas tienen la misma cantidad", () => {
    const grupos = agruparPorEtiqueta(
      [historia("Única", ["junin", "docentes", "america-latina"])],
      etiquetasDe
    );

    expect(grupos.map((grupo) => grupo.etiqueta)).toEqual([
      "america-latina",
      "docentes",
      "junin"
    ]);
  });

  it("conserva el orden en que llegaron las historias dentro de cada grupo", () => {
    const grupos = agruparPorEtiqueta(
      [
        historia("Reciente", ["docentes"]),
        historia("Antigua", ["docentes"])
      ],
      etiquetasDe
    );

    expect(grupos[0]?.historias.map((h) => h.titulo)).toEqual([
      "Reciente",
      "Antigua"
    ]);
  });

  it("trata como una sola etiqueta las variantes de mayúsculas y espacios", () => {
    const grupos = agruparPorEtiqueta(
      [historia("Primera", ["Junin"]), historia("Segunda", [" junin "])],
      etiquetasDe
    );

    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.etiqueta).toBe("junin");
  });

  it("descarta las etiquetas vacías", () => {
    const grupos = agruparPorEtiqueta(
      [historia("Primera", ["", "   ", "junin"])],
      etiquetasDe
    );

    expect(grupos.map((grupo) => grupo.etiqueta)).toEqual(["junin"]);
  });

  it("no repite una historia que declara dos veces la misma etiqueta", () => {
    const grupos = agruparPorEtiqueta(
      [historia("Primera", ["junin", "Junin"])],
      etiquetasDe
    );

    expect(grupos[0]?.historias).toHaveLength(1);
  });
});
