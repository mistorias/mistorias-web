import { describe, expect, it, afterEach, vi } from "vitest";
import { buildTimeline, type TimelineWeek, type TimelineGap } from "../src/lib/weeks";

type TestStory = {
  readonly id: string;
  readonly date: Date;
};

const getId = (story: TestStory) => story.id;
const getDate = (story: TestStory) => story.date;

const story = (id: string, date: Date): TestStory => ({
  id,
  date
});

describe("buildTimeline", () => {
  it("devuelve una lista vacía cuando no hay historias", () => {
    const result = buildTimeline([], getDate, getId);

    expect(result).toEqual([]);
  });

  it("devuelve un año con una semana que contiene la historia", () => {
    const dateInWeek = new Date("2026-09-07T00:00:00Z"); // lunes de la semana 36
    const stories = [story("story-1", dateInWeek)];

    const result = buildTimeline(stories, getDate, getId);

    expect(result).toHaveLength(1);
    expect(result[0]?.year).toBe(2026);
    expect(result[0]?.entries).toHaveLength(1);
    expect(result[0]?.entries[0]?.kind).toBe("week");
    expect((result[0]?.entries[0] as TimelineWeek<TestStory>).stories).toEqual(stories);
    expect(result[0]?.storyCount).toBe(1);
  });

  it("calcula el key en formato ISO-8601 YYYY-Www", () => {
    const mondayOfWeek37 = new Date("2026-09-07T00:00:00Z"); // lunes W37
    const stories = [story("story-1", mondayOfWeek37)];

    const result = buildTimeline(stories, getDate, getId);
    const week = result[0]?.entries[0] as TimelineWeek<TestStory>;

    expect(week.key).toBe("2026-W37");
  });

  it("establece start al lunes y end al domingo de la semana ISO", () => {
    const dateInWeek = new Date("2026-01-07T12:00:00Z"); // miércoles de W02
    const stories = [story("story-1", dateInWeek)];

    const result = buildTimeline(stories, getDate, getId);
    const week = result[0]?.entries[0] as TimelineWeek<TestStory>;

    const expectedMonday = new Date("2026-01-05T00:00:00Z");
    const expectedSunday = new Date("2026-01-11T00:00:00Z");

    expect(week.start).toEqual(expectedMonday);
    expect(week.end).toEqual(expectedSunday);
  });

  it("el cálculo no depende de la zona horaria local", () => {
    vi.stubEnv("TZ", "America/Lima");  // UTC-5

    // Medianoche UTC en lunes 5. En Lima son las 19:00 del domingo 4.
    // Si usa getDay() local, vería domingo (6) en lugar de lunes (1).
    // La implementación DEBE usar getUTCDay() para que el resultado sea siempre
    // el lunes 5 de enero, en la semana 2.
    const dateUtc = new Date("2026-01-05T00:00:00Z");
    const stories = [story("story-1", dateUtc)];

    const result = buildTimeline(stories, getDate, getId);
    const week = result[0]?.entries[0] as TimelineWeek<TestStory>;

    expect(week.start).toEqual(new Date("2026-01-05T00:00:00Z"));
    expect(week.key).toBe("2026-W02");
  });

  it("agrupa varias historias en la misma semana", () => {
    const monday = new Date("2026-01-05T00:00:00Z");  // lunes
    const wednesday = new Date("2026-01-07T15:30:00Z");  // miércoles
    const sunday = new Date("2026-01-11T23:59:00Z");  // domingo

    const stories = [
      story("story-1", wednesday),
      story("story-2", monday),
      story("story-3", sunday)
    ];

    const result = buildTimeline(stories, getDate, getId);
    const week = result[0]?.entries[0] as TimelineWeek<TestStory>;

    expect(week.stories).toHaveLength(3);
    expect(week.stories.map(s => s.id)).toEqual([
      "story-3",  // domingo, más reciente
      "story-1",  // miércoles
      "story-2"   // lunes, más antiguo
    ]);
  });

  it("desempata por id ascendente cuando dos historias tienen la misma fecha", () => {
    const sameDate = new Date("2026-01-08T12:00:00Z");

    const stories = [
      story("beta", sameDate),
      story("alpha", sameDate),
      story("gamma", sameDate)
    ];

    const result = buildTimeline(stories, getDate, getId);
    const week = result[0]?.entries[0] as TimelineWeek<TestStory>;

    expect(week.stories.map(s => s.id)).toEqual([
      "alpha",
      "beta",
      "gamma"
    ]);
  });

  it("ordena los años de más reciente a más antiguo", () => {
    const stories = [
      story("story-2025-01", new Date("2025-06-02T00:00:00Z")),
      story("story-2026-01", new Date("2026-06-02T00:00:00Z")),
      story("story-2024-01", new Date("2024-06-02T00:00:00Z"))
    ];

    const result = buildTimeline(stories, getDate, getId);

    expect(result.map(y => y.year)).toEqual([2026, 2025, 2024]);
  });

  it("ordena las entradas dentro de un año de más reciente a más antiguo", () => {
    const stories = [
      story("story-1", new Date("2026-02-09T00:00:00Z")),  // W07
      story("story-2", new Date("2026-02-16T00:00:00Z")),  // W08 (1 semana después)
      story("story-3", new Date("2026-02-23T00:00:00Z"))   // W09 (1 semana después)
    ];

    const result = buildTimeline(stories, getDate, getId);
    const year = result[0]!;

    expect(year.entries.map((e) => (e as TimelineWeek<TestStory>).key)).toEqual([
      "2026-W09",  // 2026-02-23 (más reciente)
      "2026-W08",  // 2026-02-16
      "2026-W07"   // 2026-02-09 (más antiguo)
    ]);
  });

  it("el rango es determinístico: la misma entrada produce la misma salida", () => {
    const stories = [
      story("story-1", new Date("2026-03-09T10:00:00Z")),  // W11
      story("story-2", new Date("2026-03-16T15:30:00Z"))   // W12 (1 semana después)
    ];

    // Primera ejecución
    const result1 = buildTimeline(stories, getDate, getId);

    // Segunda ejecución
    const result2 = buildTimeline(stories, getDate, getId);

    // Ambas deberían ser idénticas
    expect(result1).toEqual(result2);

    // El rango debe ser desde la más antigua a la más reciente
    const years = result1.map(y => y.year);
    expect(years).toEqual([2026]);  // solo un año

    const keys = result1[0]!.entries.map(e => (e as TimelineWeek<TestStory>).key);
    expect(keys[0]).toBe("2026-W12");  // 2026-03-16 es más reciente
    expect(keys[1]).toBe("2026-W11");  // 2026-03-09 es más antiguo
  });

  it("emite semanas vacías cuando el hueco es de 2 semanas o menos", () => {
    const stories = [
      story("story-1", new Date("2026-01-05T00:00:00Z")),  // W02
      story("story-2", new Date("2026-02-02T00:00:00Z"))   // W06, gap de 3 semanas (W03, W04, W05)
    ];

    const result = buildTimeline(stories, getDate, getId);
    const year = result[0]!;

    // Dado que el gap es de 3 semanas (más que GAP_THRESHOLD=2), debería colapsar
    // en un TimelineGap
    expect(year.entries).toHaveLength(3);
    expect(year.entries[0]?.kind).toBe("week");
    expect(year.entries[1]?.kind).toBe("gap");
    expect(year.entries[2]?.kind).toBe("week");

    const gap = year.entries[1] as TimelineGap;
    expect(gap.weeks).toBe(3);
  });

  it("emite un gap cuando hay 3 o más semanas sin historia", () => {
    const stories = [
      story("story-1", new Date("2026-01-05T00:00:00Z")),  // W02
      story("story-2", new Date("2026-03-09T00:00:00Z"))   // W11, gap de 8 semanas (W03-W10)
    ];

    const result = buildTimeline(stories, getDate, getId);
    const year = result[0]!;

    expect(year.entries).toHaveLength(3);
    expect((year.entries[1] as TimelineGap).weeks).toBe(8);
  });

  it("storyCount es la cantidad de historias del año, no de semanas", () => {
    const stories = [
      story("story-1", new Date("2026-01-05T00:00:00Z")),  // W02
      story("story-2", new Date("2026-01-05T12:00:00Z")),  // W02, misma semana
      story("story-3", new Date("2026-01-12T00:00:00Z")),  // W03
      story("story-4", new Date("2025-06-02T00:00:00Z"))   // 2025
    ];

    const result = buildTimeline(stories, getDate, getId);

    const year2026 = result.find(y => y.year === 2026)!;
    const year2025 = result.find(y => y.year === 2025)!;

    expect(year2026.storyCount).toBe(3);  // 3 historias en 2026
    expect(year2025.storyCount).toBe(1);  // 1 historia en 2025
  });

  it("un hueco que cruza el 1 de enero se parte en el borde de año", () => {
    const stories = [
      story("story-2026-01", new Date("2026-01-05T00:00:00Z")),   // 2026, W02
      story("story-2025-12", new Date("2025-12-08T00:00:00Z")),   // 2025, W50
      story("story-2025-10", new Date("2025-10-06T00:00:00Z"))    // 2025, W41
    ];

    const result = buildTimeline(stories, getDate, getId);

    const year2026 = result.find(y => y.year === 2026)!;
    const year2025 = result.find(y => y.year === 2025)!;

    // En 2025: gap entre W41 y W50 (8 semanas: W42-W49)
    const gap2025 = year2025.entries.find(e => e.kind === "gap") as TimelineGap | undefined;
    expect(gap2025).toBeDefined();
    expect(gap2025?.weeks).toBe(8);

    // El hueco W50 → W02 cruza el borde de año: W51, W52 de 2025, W01 de 2026
    // Cuando se parte en el borde: 2025 tiene W51-W52 (2 semanas = GAP_THRESHOLD),
    // 2026 tiene W01 (1 semana < GAP_THRESHOLD).
    // Ambas partes cumplen la condición de emitir semanas vacías.
    const year2026Entries = year2026.entries.map(e => (e as TimelineWeek<TestStory>).key);

    // Debería haber W01 (vacía) entre nada y W02
    expect(year2026Entries).toContain("2026-W01");
    expect(year2026Entries).toContain("2026-W02");

    // Verificar que W01 está vacía
    const w01 = year2026.entries.find(e =>
      e.kind === "week" && (e as TimelineWeek<TestStory>).key === "2026-W01"
    ) as TimelineWeek<TestStory> | undefined;
    expect(w01).toBeDefined();
    expect(w01?.stories).toHaveLength(0);
  });

  it("el año de agrupación es el año ISO de la semana", () => {
    // Una historia cercana al 1 de enero puede pertenecer al año anterior
    // En ISO-8601, la semana 1 puede incluir días de diciembre del año anterior
    // Por ejemplo, 2025-12-29 es lunes de la semana 1 de 2026

    const stories = [
      story("story-dec-29", new Date("2025-12-29T00:00:00Z")),  // 2025 de calendario, pero W01 de 2026
      story("story-dec-22", new Date("2025-12-22T00:00:00Z"))   // 2025 de calendario, W52 de 2025
    ];

    const result = buildTimeline(stories, getDate, getId);

    // Debería haber dos años: 2026 y 2025
    expect(result.map(y => y.year)).toEqual([2026, 2025]);

    // La historia del 29 de diciembre debería estar en el año 2026
    // (porque pertenece a la semana 1 de 2026)
    const year2026 = result.find(y => y.year === 2026)!;
    const week = year2026.entries[0] as TimelineWeek<TestStory>;
    expect(week.stories.map(s => s.id)).toContain("story-dec-29");

    // La historia del 22 de diciembre debería estar en el año 2025
    const year2025 = result.find(y => y.year === 2025)!;
    const week2025 = year2025.entries[0] as TimelineWeek<TestStory>;
    expect(week2025.stories.map(s => s.id)).toContain("story-dec-22");
  });

  it("emite semanas vacías cuando el hueco es de 1 o 2 semanas", () => {
    const stories = [
      story("story-1", new Date("2026-02-02T00:00:00Z")),  // W06
      story("story-2", new Date("2026-02-16T00:00:00Z"))   // W08, gap de 1 semana (W07)
    ];

    const result = buildTimeline(stories, getDate, getId);
    const year = result[0]!;

    // Debería haber 3 entradas: W08, W07 (vacía), W06
    expect(year.entries).toHaveLength(3);
    expect(year.entries[0]?.kind).toBe("week");
    expect(year.entries[1]?.kind).toBe("week");  // Semana vacía
    expect(year.entries[2]?.kind).toBe("week");

    // La semana vacía debería tener stories vacío
    const emptyWeek = year.entries[1] as TimelineWeek<TestStory>;
    expect(emptyWeek.stories).toHaveLength(0);
    expect(emptyWeek.key).toBe("2026-W07");
  });

  it("TimelineGap expone su año ISO y el key lo incluye sin ambigüedad", () => {
    // Un gap de 4 semanas dentro de 2025 (W41 a W50 son W42-W49 = 8 semanas)
    // garantiza un TimelineGap > GAP_THRESHOLD
    const stories = [
      story("a", new Date("2025-10-06T00:00:00Z")),  // 2025-W41
      story("b", new Date("2025-12-08T00:00:00Z"))   // 2025-W50 (gap de 8 semanas)
    ];

    const result = buildTimeline(stories, getDate, getId);
    const year2025 = result.find(y => y.year === 2025)!;

    // Buscar el gap en 2025
    const gap = year2025.entries.find(e => e.kind === "gap") as TimelineGap | undefined;

    // Debe haber un TimelineGap de 8 semanas
    expect(gap).toBeDefined();

    // El gap debe exponer su año ISO
    expect(gap?.year).toBe(2025);

    // El key debe incluir el año para evitar colisiones
    expect(gap?.key).toContain("2025");

    // El gap debe identificar claramente su rango dentro del año
    expect(gap?.weeks).toBe(8);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });
});
