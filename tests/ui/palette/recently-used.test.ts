import { describe, it, expect, beforeEach } from "vitest";
import {
  getRecentlyUsed,
  addRecentlyUsed,
  clearRecentlyUsed,
  STORAGE_KEY,
} from "../../../src/ui/palette/recentlyUsed";

describe("recentlyUsed", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getRecentlyUsed", () => {
    it("returns empty array when no data in localStorage", () => {
      const result = getRecentlyUsed();
      expect(result).toEqual([]);
    });

    it("returns parsed array from localStorage", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["led", "resistor", "capacitor"]));
      const result = getRecentlyUsed();
      expect(result).toEqual(["led", "resistor", "capacitor"]);
    });

    it("returns empty array for corrupted localStorage data", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
      const result = getRecentlyUsed();
      expect(result).toEqual([]);
    });

    it("returns empty array for non-array localStorage data", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify("not-an-array"));
      const result = getRecentlyUsed();
      expect(result).toEqual([]);
    });
  });

  describe("addRecentlyUsed", () => {
    it("adds a new component type to the front of the list", () => {
      addRecentlyUsed("led");

      const result = getRecentlyUsed();
      expect(result).toEqual(["led"]);
    });

    it("moves existing component to the front (deduplication)", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["led", "resistor", "capacitor"]));

      addRecentlyUsed("led");

      const result = getRecentlyUsed();
      expect(result).toEqual(["led", "resistor", "capacitor"]);
      expect(result[0]).toBe("led");
    });

    it("caps the list at 5 entries", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["a", "b", "c", "d", "e"]));

      addRecentlyUsed("f");

      const result = getRecentlyUsed();
      expect(result).toHaveLength(5);
      expect(result[0]).toBe("f");
      // "e" (oldest) should have been evicted
      expect(result).not.toContain("e");
    });

    it("maintains order: most recent first, then previous order preserved", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["led", "resistor", "capacitor"]));

      addRecentlyUsed("buzzer");

      const result = getRecentlyUsed();
      expect(result).toEqual(["buzzer", "led", "resistor", "capacitor"]);
    });

    it("persists to localStorage after add", () => {
      addRecentlyUsed("led");

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBe(JSON.stringify(["led"]));
    });
  });

  describe("clearRecentlyUsed", () => {
    it("removes the key from localStorage", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["led", "resistor"]));
      clearRecentlyUsed();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(getRecentlyUsed()).toEqual([]);
    });

    it("is safe to call when no data exists", () => {
      clearRecentlyUsed();
      expect(getRecentlyUsed()).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("handles adding the same type multiple times", () => {
      addRecentlyUsed("led");
      addRecentlyUsed("led");
      addRecentlyUsed("led");

      const result = getRecentlyUsed();
      expect(result).toEqual(["led"]);
    });

    it("handles a full list where the added item already exists at the end", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(["a", "b", "c", "d", "e"]));

      addRecentlyUsed("e");

      const result = getRecentlyUsed();
      expect(result).toEqual(["e", "a", "b", "c", "d"]);
      expect(result).toHaveLength(5);
    });
  });
});
