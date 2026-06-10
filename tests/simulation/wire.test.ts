import { describe, it, expect } from "vitest";
import { Wire } from "../../src/simulation/core/wire";
import { PinRef, GridCoord } from "../../src/types";

describe("Wire", () => {
  const startPin: PinRef = {
    parentId: "arduino-uno",
    pinId: "D9",
    parentType: "board",
  };
  const endPin: PinRef = {
    parentId: "led-1",
    pinId: "anode",
    parentType: "component",
  };

  describe("creation", () => {
    it("creates wire with valid start/end pins", () => {
      const path: GridCoord[] = [{ row: 0, col: 0 }, { row: 5, col: 0 }];
      const wire = new Wire("w1", startPin, endPin, path, "#ff0000");
      expect(wire.id).toBe("w1");
      expect(wire.startPin).toEqual(startPin);
      expect(wire.endPin).toEqual(endPin);
      expect(wire.path).toEqual(path);
    });

    it("color is stored correctly", () => {
      const wire = new Wire("w1", startPin, endPin, [], "#00ff00");
      expect(wire.color).toBe("#00ff00");
    });
  });

  describe("validation", () => {
    it("self-connect (same pin) throws validation error", () => {
      const samePin: PinRef = {
        parentId: "arduino-uno",
        pinId: "D9",
        parentType: "board",
      };
      const wire = new Wire("w1", samePin, { ...samePin }, [], "#ff0000");
      expect(() => wire.validate()).toThrow(
        "Wire start and end pins cannot be the same",
      );
    });
  });

  describe("Manhattan path generation", () => {
    it("creates L-shaped route", () => {
      const start: GridCoord = { row: 0, col: 0 };
      const end: GridCoord = { row: 5, col: 10 };
      const path = Wire.createManhattanPath(start, end);
      expect(path.length).toBe(3);
      expect(path[0]).toEqual({ row: 0, col: 0 });
      expect(path[1]).toEqual({ row: 0, col: 10 });
      expect(path[2]).toEqual({ row: 5, col: 10 });
    });

    it("path has at least 2 points (start and end)", () => {
      const start: GridCoord = { row: 0, col: 0 };
      const end: GridCoord = { row: 5, col: 0 };
      const path = Wire.createManhattanPath(start, end);
      expect(path.length).toBeGreaterThanOrEqual(2);
      expect(path[0]).toEqual({ row: 0, col: 0 });
      expect(path[path.length - 1]).toEqual({ row: 5, col: 0 });
    });
  });
});
