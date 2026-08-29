import { describe, expect, it } from "vitest";
import {
  hashOrderedIds,
  neighborsFor,
  orderStoriesByDate
} from "../src/lib/content/story-order";

type TestStory = { readonly id: string; readonly date: Date };

const idOf = (story: TestStory) => story.id;
const dateOf = (story: TestStory) => story.date;

describe("orderStoriesByDate", () => {
  it("ordena ascendente por fecha (la más antigua primero)", () => {
    const ordered = orderStoriesByDate(
      [
        { id: "reciente", date: new Date("2026-08-07") },
        { id: "antigua", date: new Date("2026-01-15") }
      ],
      idOf,
      dateOf
    );

    expect(ordered).toEqual(["antigua", "reciente"]);
  });

  it("desempata fechas iguales por id, de forma determinística", () => {
    const ordered = orderStoriesByDate(
      [
        { id: "b-historia", date: new Date("2026-08-07") },
        { id: "a-historia", date: new Date("2026-08-07") }
      ],
      idOf,
      dateOf
    );

    expect(ordered).toEqual(["a-historia", "b-historia"]);
  });

  it("no altera el arreglo que recibe", () => {
    const originals = [
      { id: "reciente", date: new Date("2026-08-07") },
      { id: "antigua", date: new Date("2026-01-15") }
    ];

    orderStoriesByDate(originals, idOf, dateOf);

    expect(originals.map(idOf)).toEqual(["reciente", "antigua"]);
  });

  it("devuelve una lista vacía cuando no hay historias", () => {
    expect(orderStoriesByDate([], idOf, dateOf)).toEqual([]);
  });
});

describe("neighborsFor", () => {
  const orderedIds = ["primera", "segunda", "tercera"];

  it("una historia intermedia tiene ambos vecinos", () => {
    expect(neighborsFor(orderedIds, "segunda")).toEqual({
      previous: "primera",
      next: "tercera"
    });
  });

  it("la primera historia no tiene anterior", () => {
    expect(neighborsFor(orderedIds, "primera")).toEqual({
      previous: null,
      next: "segunda"
    });
  });

  it("la última historia no tiene siguiente", () => {
    expect(neighborsFor(orderedIds, "tercera")).toEqual({
      previous: "segunda",
      next: null
    });
  });

  it("una sola historia no tiene ningún vecino", () => {
    expect(neighborsFor(["unica"], "unica")).toEqual({
      previous: null,
      next: null
    });
  });

  it("devuelve null en ambos si el id no está en la lista", () => {
    expect(neighborsFor(orderedIds, "inexistente")).toEqual({
      previous: null,
      next: null
    });
  });
});

describe("hashOrderedIds", () => {
  it("el mismo orden produce el mismo hash", () => {
    const ids = ["a", "b", "c"];

    expect(hashOrderedIds(ids)).toBe(hashOrderedIds([...ids]));
  });

  it("un orden distinto produce un hash distinto", () => {
    expect(hashOrderedIds(["a", "b", "c"])).not.toBe(
      hashOrderedIds(["b", "a", "c"])
    );
  });

  it("agregar o quitar un id cambia el hash", () => {
    expect(hashOrderedIds(["a", "b"])).not.toBe(
      hashOrderedIds(["a", "b", "c"])
    );
  });

  it("depende solo del orden, no de la fecha exacta: dos conjuntos con el mismo orden relativo dan el mismo hash", () => {
    const ordered1 = orderStoriesByDate(
      [
        { id: "a", date: new Date("2026-01-01") },
        { id: "b", date: new Date("2026-02-01") }
      ],
      idOf,
      dateOf
    );
    const ordered2 = orderStoriesByDate(
      [
        { id: "a", date: new Date("2026-01-05") },
        { id: "b", date: new Date("2026-02-20") }
      ],
      idOf,
      dateOf
    );

    expect(hashOrderedIds(ordered1)).toBe(hashOrderedIds(ordered2));
  });
});
