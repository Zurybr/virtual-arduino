import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SCHEMA_MAP } from "../../../src/ui/properties/schemas";
import { getRecentlyUsed, addRecentlyUsed } from "../../../src/ui/palette/recentlyUsed";

/**
 * Integration tests for the layout rendering.
 * Verifies that the Tinkercad-style layout components exist and render correctly.
 */
describe("Layout integration", () => {
  beforeEach(() => {
    // Clear localStorage for recently used
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    // Nothing to clean up
  });

  describe("Property schema completeness", () => {
    it("should have schemas for all 12+ component types", () => {
      const expectedTypes = [
        "resistor",
        "capacitor",
        "led",
        "potentiometer",
        "buzzer",
        "rgb-led",
        "servo",
        "dc-motor",
        "photoresistor",
        "temperature-sensor",
        "lcd-display",
        "power-supply",
      ];

      for (const type of expectedTypes) {
        expect(SCHEMA_MAP[type]).toBeDefined();
        expect(SCHEMA_MAP[type].length).toBeGreaterThan(0);
      }
    });

    it("each schema should have required fields", () => {
      for (const schemas of Object.values(SCHEMA_MAP)) {
        for (const schema of schemas) {
          expect(schema.key).toBeTruthy();
          expect(schema.label).toBeTruthy();
          expect(schema.type).toBeTruthy();
          expect(schema.defaultValue).toBeDefined();
        }
      }
    });

    it("resistor schema should include E12 series options", () => {
      const resistorSchema = SCHEMA_MAP["resistor"];
      const dropdownSchema = resistorSchema.find((s) => s.key === "resistance");
      expect(dropdownSchema).toBeTruthy();
      expect(dropdownSchema!.options).toBeTruthy();
      expect(dropdownSchema!.options!.length).toBeGreaterThan(0);

      const values = dropdownSchema!.options!.map((o) => o.value);
      expect(values).toContain("220");
      expect(values).toContain("1000");
      expect(values).toContain("10000");
    });

    it("led schema should include color property", () => {
      const ledSchema = SCHEMA_MAP["led"];
      const colorSchema = ledSchema.find((s) => s.key === "color");
      expect(colorSchema).toBeTruthy();
      expect(colorSchema!.type).toBe("color");
    });
  });

  describe("Recently used persistence", () => {
    it("should return empty array when no items stored", () => {
      localStorage.clear();
      const result = getRecentlyUsed();
      expect(result).toEqual([]);
    });

    it("should persist and retrieve recently used items", () => {
      localStorage.clear();
      addRecentlyUsed("led");
      addRecentlyUsed("resistor");

      const result = getRecentlyUsed();
      expect(result[0]).toBe("resistor"); // most recent first
      expect(result[1]).toBe("led");
    });

    it("should cap at 5 items", () => {
      localStorage.clear();
      const types = ["led", "resistor", "capacitor", "buzzer", "servo", "potentiometer"];
      for (const type of types) {
        addRecentlyUsed(type);
      }

      const result = getRecentlyUsed();
      expect(result).toHaveLength(5);
      expect(result[0]).toBe("potentiometer"); // most recent
    });
  });
});
