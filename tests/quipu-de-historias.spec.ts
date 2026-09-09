import { describe, it, expect } from "vitest";
import { renderAstroComponent } from "./support/render-astro-component";
import QuipuDeHistorias from "../src/components/QuipuDeHistorias.astro";
import { buildStoryFixture } from "./support/story-fixture";
import { readableWeekRange } from "../src/lib/dates";
import type { TimelineYear } from "../src/lib/weeks";
import type { CollectionEntry } from "astro:content";

describe("QuipuDeHistorias", () => {
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

  it("el <h2> muestra el año y junto a él el conteo pluralizado (1 historia)", async () => {
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

  it("el <h2> muestra el año y junto a él el conteo pluralizado (3 historias)", async () => {
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

  it("una semana con DOS historias: contiene dos <a href> distintos y NudoDeQuipu fue invocado con cantidad: 2", async () => {
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

    expect(html).toContain('href="/historias/historia-1/"');
    expect(html).toContain('href="/historias/historia-2/"');
    expect(html).toContain("Primera Historia");
    expect(html).toContain("Segunda Historia");

    // Verificar que NudoDeQuipu fue invocado con cantidad: 2
    // (contando exactamente 2 <ellipse>)
    const ellipseCount = (html.match(/<ellipse/g) ?? []).length;
    expect(ellipseCount).toBe(2);
  });

  it("una semana vacía: contiene class='quipu-semana quipu-semana--vacia' y aria-hidden='true'", async () => {
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
  });

  it("una semana vacía: NO contiene <time> ni <a href para historias", async () => {
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

  it("un hueco colapsado: contiene el texto 'X semanas sin historia'", async () => {
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

  it("un hueco colapsado: NO tiene NudoDeQuipu asociado", async () => {
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
    // Solo una <ellipse> de la semana con historia, ninguna del gap
    const ellipseCount = (html.match(/<ellipse/g) ?? []).length;
    expect(ellipseCount).toBe(1);
  });

  it("con base no vacío (GitHub Pages): el href de la historia es correcto", async () => {
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

    // Con BASE_URL por defecto en tests (que es "/"), el href debe ser "/historias/historia-1/"
    expect(html).toContain('href="/historias/historia-1/"');
  });
});
