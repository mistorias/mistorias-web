import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashOrderedIds } from "../src/lib/content/story-order";
import {
  isCacheValid,
  readCache,
  resolveNeighbors,
  writeCache
} from "../src/lib/content/story-order-cache";

describe("story-order-cache", () => {
  let tempDir: string;
  let cachePath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "story-order-cache-"));
    cachePath = path.join(tempDir, "story-order.json");
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("readCache", () => {
    it("devuelve null si el archivo no existe", () => {
      expect(readCache(cachePath)).toBeNull();
    });

    it("devuelve null si el archivo no es JSON válido", () => {
      writeFileSync(cachePath, "esto no es json");

      expect(readCache(cachePath)).toBeNull();
    });
  });

  describe("writeCache", () => {
    it("escribe generatedAt, hash, order y el mapa de vecinos, legibles desde disco", () => {
      const orderedIds = ["primera", "segunda", "tercera"];

      const cache = writeCache(orderedIds, cachePath);

      expect(cache.order).toEqual(orderedIds);
      expect(cache.hash).toBe(hashOrderedIds(orderedIds));
      expect(cache.generatedAt).toEqual(expect.any(String));
      expect(cache.stories["segunda"]).toEqual({
        previous: "primera",
        next: "tercera"
      });
      expect(readCache(cachePath)).toEqual(cache);
    });
  });

  describe("isCacheValid", () => {
    it("es válido cuando el hash coincide con el orden actual", () => {
      const orderedIds = ["a", "b"];
      const cache = writeCache(orderedIds, cachePath);

      expect(isCacheValid(cache, orderedIds)).toBe(true);
    });

    it("no es válido cuando el orden actual cambió", () => {
      const cache = writeCache(["a", "b"], cachePath);

      expect(isCacheValid(cache, ["b", "a"])).toBe(false);
    });

    it("no es válido cuando no hay cache", () => {
      expect(isCacheValid(null, ["a"])).toBe(false);
    });
  });

  describe("resolveNeighbors", () => {
    it("usa el cache cuando existe y es válido", () => {
      const orderedIds = ["a", "b", "c"];
      writeCache(orderedIds, cachePath);

      const neighbors = resolveNeighbors(orderedIds, cachePath);

      expect(neighbors["b"]).toEqual({ previous: "a", next: "c" });
    });

    it("calcula en memoria cuando no existe el cache, sin escribir nada", () => {
      const orderedIds = ["a", "b", "c"];

      const neighbors = resolveNeighbors(orderedIds, cachePath);

      expect(neighbors["b"]).toEqual({ previous: "a", next: "c" });
      expect(readCache(cachePath)).toBeNull();
    });

    it("calcula en memoria cuando el cache quedó desactualizado, sin reescribirlo", () => {
      const staleCache = writeCache(["a", "b"], cachePath);
      const currentIds = ["a", "b", "c"];

      const neighbors = resolveNeighbors(currentIds, cachePath);

      expect(neighbors["c"]).toEqual({ previous: "b", next: null });
      expect(readCache(cachePath)).toEqual(staleCache);
    });
  });
});
