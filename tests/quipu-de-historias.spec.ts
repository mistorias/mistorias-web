import { describe, it, expect } from "vitest";
import { renderAstroComponent } from "./support/render-astro-component";
import QuipuDeHistorias from "../src/components/QuipuDeHistorias.astro";
import { buildStoryFixture } from "./support/story-fixture";
import { readableWeekRange } from "../src/lib/dates";
import type { TimelineYear } from "../src/lib/weeks";
import type { CollectionEntry } from "astro:content";

describe("QuipuDeHistorias", () => {
  // Test 1: El año en el índice 0 lleva open en su <details>
  it("el año en el índice 0 lleva open en su <details>", async () => {
    const historia = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toMatch(/<details[^>]*\s+open/);
  });

  // Test 2: Un segundo año en el array NO lleva open
  it("un segundo año en el array NO lleva open", async () => {
    const historia = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });

    const ano1: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia],
        },
      ],
    };

    const ano2: TimelineYear<CollectionEntry<"stories">> = {
      year: 2025,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2025-W18",
          start: new Date("2025-04-28"),
          end: new Date("2025-05-04"),
          stories: [historia],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano1, ano2] },
    });

    // El primer <details> tiene open
    const firstDetailsOpenMatch = html.match(/<details[^>]*\s+open/);
    expect(firstDetailsOpenMatch).not.toBeNull();

    // Extraer el segundo <details>: debe encontrar uno que NO tenga open
    const afterFirstDetails = html.substring(
      html.indexOf("</details>") + 10
    );
    const secondDetailsMatch = afterFirstDetails.match(/<details[^>]*>/);
    expect(secondDetailsMatch).not.toBeNull();
    expect(secondDetailsMatch![0]).not.toMatch(/\s+open/);
  });

  // Test 3: El <h2> muestra el año y junto a él el conteo pluralizado (1 historia)
  it("el <h2> muestra el año y el conteo pluralizado (1 historia)", async () => {
    const historia = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toMatch(/<h2[^>]*>2026<\/h2>/);
    expect(html).toContain("1 historia");
  });

  // Test 3b: El <h2> muestra el año y junto a él el conteo pluralizado (3 historias)
  it("el <h2> muestra el año y el conteo pluralizado (3 historias)", async () => {
    const historia1 = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });
    const historia2 = buildStoryFixture({
      id: "historia-2",
      date: new Date("2026-04-27"),
    });
    const historia3 = buildStoryFixture({
      id: "historia-3",
      date: new Date("2026-04-28"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 3,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia1, historia2, historia3],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toMatch(/<h2[^>]*>2026<\/h2>/);
    expect(html).toContain("3 historias");
  });

  // Test 4: Una semana con una historia: muestra datetime con el key y el rango de fechas formateado
  it("una semana con una historia: muestra datetime con el key y el rango de fechas formateado", async () => {
    const historia = buildStoryFixture({
      id: "historia-1",
      title: "Mi Historia",
      summary: "Resumen de la historia",
      date: new Date("2026-04-26"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toContain('datetime="2026-W18"');
    const expectedWeekRange = readableWeekRange(
      new Date("2026-04-27"),
      new Date("2026-05-03")
    );
    expect(html).toContain(`Semana ${expectedWeekRange}`);
  });

  // Test 5: Una semana con una historia: contiene un <a href> con el título y un <p> con el resumen
  it("una semana con una historia: contiene un <a href> con el título y un <p> con el resumen", async () => {
    const historia = buildStoryFixture({
      id: "el-id-de-la-historia",
      title: "Mi Historia",
      summary: "Resumen de la historia",
      date: new Date("2026-04-26"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toContain('href="/historias/el-id-de-la-historia/"');
    expect(html).toContain("Mi Historia");
    expect(html).toContain("Resumen de la historia");
  });

  // Test 6: Una semana con dos historias produce exactamente DOS ocurrencias de class="nudo-de-quipu__hueco"
  it('una semana con dos historias produce exactamente DOS class="nudo-de-quipu__hueco"', async () => {
    const historia1 = buildStoryFixture({
      id: "historia-1",
      title: "Primera Historia",
      summary: "Resumen 1",
      date: new Date("2026-04-26"),
    });
    const historia2 = buildStoryFixture({
      id: "historia-2",
      title: "Segunda Historia",
      summary: "Resumen 2",
      date: new Date("2026-04-27"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 2,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia1, historia2],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    const huecoCount = (html.match(/class="nudo-de-quipu__hueco"/g) ?? []).length;
    expect(huecoCount).toBe(2);
  });

  // Test 7: Una semana vacía contiene 0 ocurrencias de class="nudo-de-quipu__hueco"
  it('una semana vacía contiene 0 class="nudo-de-quipu__hueco"', async () => {
    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 0,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toContain('class="quipu-semana quipu-semana--vacia"');
    expect(html).toContain('aria-hidden="true"');

    // Extraer el <span class="quipu-semana__cuerda"> y verificar que dentro no hay class="nudo-de-quipu__hueco"
    // La semana vacía debe tener un NudoDeQuipu con cantidad=0, lo que genera 0 huecos
    const vacio = html.match(/<li[^>]*class="quipu-semana quipu-semana--vacia"[\s\S]*?<\/li>/);
    expect(vacio).not.toBeNull();
    expect(vacio![0]).not.toContain('class="nudo-de-quipu__hueco"');
  });

  // Test 8: Una semana vacía: NO contiene <time> ni <a href para historias
  it("una semana vacía: NO contiene <time> ni <a href para historias (solo las semanas CON historias)", async () => {
    const historia = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia],
        },
        {
          kind: "week",
          key: "2026-W19",
          start: new Date("2026-05-04"),
          end: new Date("2026-05-10"),
          stories: [],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    // Debe contener un <time> solo para la semana con historia
    const timeCount = (html.match(/<time/g) ?? []).length;
    expect(timeCount).toBe(1);

    // Debe contener solo un <a href="/historias/
    const historiaLinkCount = (html.match(/href="\/historias\//g) ?? []).length;
    expect(historiaLinkCount).toBe(1);
  });

  // Test 9: Un hueco colapsado: contiene el texto "X semanas sin historia"
  it("un hueco colapsado: contiene el texto \"X semanas sin historia\"", async () => {
    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 0,
      entries: [
        {
          kind: "gap",
          key: "gap-2026-W01-W05",
          weeks: 5,
          year: 2026,
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toContain("5 semanas sin historia");
  });

  // Test 10: Un hueco colapsado SÍ invoca NudoDeQuipu pero con cantidad: 0
  // Verifica que no tiene class="nudo-de-quipu__hueco"
  it("un hueco colapsado SÍ invoca NudoDeQuipu con cantidad: 0 y sin class=\"nudo-de-quipu__hueco\"", async () => {
    const historia = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia],
        },
        {
          kind: "gap",
          key: "gap-2026-W20-W23",
          weeks: 4,
          year: 2026,
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toContain("4 semanas sin historia");

    // Extraer el <li class="quipu-hueco"> y verificar que dentro no hay class="nudo-de-quipu__hueco"
    // El hueco debe tener un NudoDeQuipu con cantidad=0, lo que genera 0 huecos
    const hueco = html.match(/<li[^>]*class="quipu-hueco"[\s\S]*?<\/li>/);
    expect(hueco).not.toBeNull();
    expect(hueco![0]).not.toContain('class="nudo-de-quipu__hueco"');
  });

  // Test 11: La greca existe en CADA año (verificar con al menos dos años)
  it("la greca existe en CADA año (incluido el primero/más reciente)", async () => {
    const historia1 = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });
    const historia2 = buildStoryFixture({
      id: "historia-2",
      date: new Date("2025-04-26"),
    });

    const ano1: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia1],
        },
      ],
    };

    const ano2: TimelineYear<CollectionEntry<"stories">> = {
      year: 2025,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2025-W18",
          start: new Date("2025-04-28"),
          end: new Date("2025-05-04"),
          stories: [historia2],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano1, ano2] },
    });

    // Contar elementos con class="quipu-anio__greca"
    const grecaCount = (html.match(/class="quipu-anio__greca"/g) ?? []).length;
    expect(grecaCount).toBe(2); // Una para cada año
  });

  // Test 12: Redondeo por posición — año con 3 entradas
  // Primera: redondeo="arriba" → class="nudo-de-quipu nudo-de-quipu--arriba"
  // Última: redondeo="abajo" → class="nudo-de-quipu nudo-de-quipu--abajo"
  // Del medio: redondeo="ninguno" → class="nudo-de-quipu nudo-de-quipu--ninguno"
  it("redondeo por posición: primera entrada redondea arriba, última redondea abajo, del medio: ninguno", async () => {
    const historia1 = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });
    const historia2 = buildStoryFixture({
      id: "historia-2",
      date: new Date("2026-05-03"),
    });
    const historia3 = buildStoryFixture({
      id: "historia-3",
      date: new Date("2026-05-10"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 3,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia1],
        },
        {
          kind: "week",
          key: "2026-W19",
          start: new Date("2026-05-04"),
          end: new Date("2026-05-10"),
          stories: [historia2],
        },
        {
          kind: "week",
          key: "2026-W20",
          start: new Date("2026-05-11"),
          end: new Date("2026-05-17"),
          stories: [historia3],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    // Verificar que aparecen las tres clases de redondeo en el orden esperado
    expect(html).toContain('class="nudo-de-quipu nudo-de-quipu--arriba"');
    expect(html).toContain('class="nudo-de-quipu nudo-de-quipu--ninguno"');
    expect(html).toContain('class="nudo-de-quipu nudo-de-quipu--abajo"');

    // Verificar que aparecen en ese orden (arriba antes que abajo, abajo después de ninguno)
    const idxArriba = html.indexOf('class="nudo-de-quipu nudo-de-quipu--arriba"');
    const idxNinguno = html.indexOf('class="nudo-de-quipu nudo-de-quipu--ninguno"');
    const idxAbajo = html.indexOf('class="nudo-de-quipu nudo-de-quipu--abajo"');
    expect(idxArriba < idxNinguno && idxNinguno < idxAbajo).toBe(true);
  });

  // Test 13: Año con una sola entrada — redondeo="ambos"
  it('año con una sola entrada: redondeo="ambos"', async () => {
    const historia = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W18",
          start: new Date("2026-04-27"),
          end: new Date("2026-05-03"),
          stories: [historia],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toContain('class="nudo-de-quipu nudo-de-quipu--ambos"');
  });
});
