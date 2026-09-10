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

  // Test 6: Una semana con dos historias produce exactamente DOS fill="black" (nudos)
  it("una semana con dos historias produce exactamente DOS fill=\"black\" (nudos)", async () => {
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

    const fillBlackCount = (html.match(/fill="black"/g) ?? []).length;
    expect(fillBlackCount).toBe(2);
  });

  // Test 7: Una semana con dos historias produce viewBox="0 0 20 128"
  it('una semana con dos historias produce viewBox="0 0 20 128"', async () => {
    const historia1 = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-04-26"),
    });
    const historia2 = buildStoryFixture({
      id: "historia-2",
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

    expect(html).toContain('viewBox="0 0 20 128"');
  });

  // Test 8: Una semana con una historia produce viewBox="0 0 20 72"
  it('una semana con una historia produce viewBox="0 0 20 72"', async () => {
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

    expect(html).toContain('viewBox="0 0 20 72"');
  });

  // Test 9: Una semana vacía contiene <svg> con viewBox="0 0 20 32" y sin fill="black"
  it("una semana vacía contiene <svg> con viewBox=\"0 0 20 32\" y sin fill=\"black\"", async () => {
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
    expect(html).toContain('viewBox="0 0 20 32"');

    // Extraer solo el SVG de la semana vacía y verificar que no tiene fill="black"
    // Usar [\s\S] en lugar de . para que coincida con saltos de línea
    const vacio32Match = html.match(/viewBox="0 0 20 32"[\s\S]*?<\/svg>/);
    expect(vacio32Match).not.toBeNull();
    expect(vacio32Match![0]).not.toContain('fill="black"');
  });

  // Test 10: Una semana vacía: NO contiene <time> ni <a href para historias (solo contar las semanas CON historias)
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

  // Test 11: Un hueco colapsado: contiene el texto "X semanas sin historia"
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

  // Test 12: Un hueco colapsado SÍ invoca NudoDeQuipu con cantidad: 0
  // Verifica que su tramo de cuerda no tiene fill="black" y viewBox es "0 0 20 56"
  it("un hueco colapsado SÍ invoca NudoDeQuipu con cantidad: 0, viewBox=\"0 0 20 56\" y sin fill=\"black\"", async () => {
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
    expect(html).toContain('viewBox="0 0 20 56"');

    // Extraer solo el SVG con viewBox="0 0 20 56" (el del hueco) y verificar que no tiene fill="black"
    // Usar [\s\S] en lugar de . para que coincida con saltos de línea
    const hueco56Match = html.match(/viewBox="0 0 20 56"[\s\S]*?<\/svg>/);
    expect(hueco56Match).not.toBeNull();
    expect(hueco56Match![0]).not.toContain('fill="black"');
  });

  // Test 13: La greca existe en CADA año (verificar con al menos dos años)
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

  // Test 14: Redondeo por posición — año con 3 entradas
  // Primera: redondeo="arriba" (2 arcos: A ... A)
  // Última: redondeo="abajo" (2 arcos)
  // Del medio: redondeo="ninguno" (0 arcos)
  it("redondeo por posición: primera entrada redondea arriba (2 arcos), última redondea abajo (2 arcos), del medio: ninguno (0 arcos)", async () => {
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

    // Extraer los 3 SVGs por orden de aparición
    // Usar [\s\S] para capturar contenido multi-línea
    const svgRegex = /<svg[\s\S]*?<\/svg>/g;
    const svgs = html.match(svgRegex) || [];

    // Esperamos al menos 3 SVGs (los de las semanas con historias)
    expect(svgs.length).toBeGreaterThanOrEqual(3);

    // Contar arcos en el path final de cada SVG (fuera del <mask>)
    // El path final es el último que aparece en el SVG (después de </mask>)
    const getLastPathArcs = (svg: string): number => {
        // Encontrar la posición del cierre de </mask>
        const maskCloseIdx = svg.lastIndexOf("</mask>");
        if (maskCloseIdx === -1) return 0;
        // Contar arcos en lo que queda después del cierre de mask
        const afterMask = svg.substring(maskCloseIdx);
        return (afterMask.match(/A /g) ?? []).length;
    };

    const firstSvgArcs = getLastPathArcs(svgs[0] ?? "");
    const secondSvgArcs = getLastPathArcs(svgs[1] ?? "");
    const thirdSvgArcs = getLastPathArcs(svgs[2] ?? "");

    expect(firstSvgArcs).toBe(2); // redondeo="arriba"
    expect(secondSvgArcs).toBe(0); // redondeo="ninguno"
    expect(thirdSvgArcs).toBe(2); // redondeo="abajo"
  });

  // Test 15: Año con una sola entrada — redondeo="ambos" (4 arcos)
  it("año con una sola entrada: redondeo=\"ambos\" (4 arcos)", async () => {
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

    // Extraer el único SVG y contar sus arcos (solo del path final, fuera del mask)
    const svgRegex = /<svg[\s\S]*?<\/svg>/g;
    const svgs = html.match(svgRegex) || [];

    expect(svgs.length).toBeGreaterThanOrEqual(1);

    // Contar arcos en el path final de ese SVG (fuera del <mask>)
    const svg = svgs[0] ?? "";
    const maskCloseIdx = svg.lastIndexOf("</mask>");
    const afterMask = svg.substring(maskCloseIdx);
    const arcCount = (afterMask.match(/A /g) ?? []).length;
    expect(arcCount).toBe(4); // redondeo="ambos"
  });

  // Test 16: El id que recibe NudoDeQuipu es la key de la entrada
  it("el id que recibe NudoDeQuipu es la key de la entrada (id=\"nudo-2026-W36\")", async () => {
    const historia = buildStoryFixture({
      id: "historia-1",
      date: new Date("2026-09-03"),
    });

    const ano: TimelineYear<CollectionEntry<"stories">> = {
      year: 2026,
      storyCount: 1,
      entries: [
        {
          kind: "week",
          key: "2026-W36",
          start: new Date("2026-08-31"),
          end: new Date("2026-09-06"),
          stories: [historia],
        },
      ],
    };

    const html = await renderAstroComponent(QuipuDeHistorias, {
      props: { anos: [ano] },
    });

    expect(html).toContain('id="nudo-2026-W36"');
  });
});
