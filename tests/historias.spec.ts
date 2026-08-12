import { describe, expect, it } from "vitest";
import { ordenarPorFechaDescendente } from "../src/lib/historias";

type HistoriaDePrueba = { readonly titulo: string; readonly fecha: Date };

const fechaDe = (historia: HistoriaDePrueba) => historia.fecha;

describe("ordenarPorFechaDescendente", () => {
  it("pone primero la historia más reciente", () => {
    const ordenadas = ordenarPorFechaDescendente(
      [
        { titulo: "Antigua", fecha: new Date("2026-01-15") },
        { titulo: "Reciente", fecha: new Date("2026-08-07") }
      ],
      fechaDe
    );

    expect(ordenadas.map((historia) => historia.titulo)).toEqual([
      "Reciente",
      "Antigua"
    ]);
  });

  it("no altera el arreglo que recibe", () => {
    const originales = [
      { titulo: "Antigua", fecha: new Date("2026-01-15") },
      { titulo: "Reciente", fecha: new Date("2026-08-07") }
    ];

    ordenarPorFechaDescendente(originales, fechaDe);

    expect(originales.map((historia) => historia.titulo)).toEqual([
      "Antigua",
      "Reciente"
    ]);
  });

  it("devuelve una lista vacía cuando no hay historias", () => {
    expect(ordenarPorFechaDescendente([], fechaDe)).toEqual([]);
  });
});
