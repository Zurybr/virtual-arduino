import { describe, it, expect, beforeEach } from "vitest";

// We test the pure hover effect utility functions.
// Since Konva nodes can't be instantiated in a jsdom test environment,
// we create mock objects that have the same shape as Konva nodes.

describe("hover-effects utilities", () => {
  // We'll import dynamically after mocks are set up
  let hoverEffects: typeof import("../../../src/ui/workspace/hover-effects");

  beforeEach(async () => {
    hoverEffects = await import("../../../src/ui/workspace/hover-effects");
  });

  describe("applyComponentHover", () => {
    it("should set shadow properties on a node", () => {
      const node = {
        shadowColor: "",
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowOpacity: 0,
        shadowEnabled: false,
      };

      hoverEffects.applyComponentHover(node as any);

      expect(node.shadowColor).toBe("#00BFFF");
      expect(node.shadowBlur).toBe(15);
      expect(node.shadowOpacity).toBe(0.6);
      expect(node.shadowEnabled).toBe(true);
    });

    it("should set shadow offset to 0,0", () => {
      const node = {
        shadowColor: "",
        shadowBlur: 0,
        shadowOffsetX: 10,
        shadowOffsetY: 10,
        shadowOpacity: 0,
        shadowEnabled: false,
      };

      hoverEffects.applyComponentHover(node as any);

      expect(node.shadowOffsetX).toBe(0);
      expect(node.shadowOffsetY).toBe(0);
    });
  });

  describe("removeComponentHover", () => {
    it("should clear shadow properties on a node", () => {
      const node = {
        shadowColor: "#00BFFF",
        shadowBlur: 15,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowOpacity: 0.6,
        shadowEnabled: true,
      };

      hoverEffects.removeComponentHover(node as any);

      expect(node.shadowEnabled).toBe(false);
      expect(node.shadowBlur).toBe(0);
      expect(node.shadowOpacity).toBe(0);
    });
  });

  describe("applyPinHover", () => {
    it("should enlarge pin radius to PIN_HOVER_RADIUS", () => {
      const circle: Record<string, unknown> = {
        radius: 5,
        strokeWidth: 1,
        stroke: "#999",
        fill: "#1e88e5",
      };

      hoverEffects.applyPinHover(circle as any);

      expect(circle.radius).toBe(8);
      expect(circle.strokeWidth).toBe(2);
    });

    it("should set stroke to white for visibility", () => {
      const circle: Record<string, unknown> = {
        radius: 5,
        strokeWidth: 1,
        stroke: "#1e88e5",
        fill: "#1e88e5",
      };

      hoverEffects.applyPinHover(circle as any);

      expect(circle.stroke).toBe("#ffffff");
    });
  });

  describe("removePinHover", () => {
    it("should restore pin radius to PIN_RADIUS", () => {
      const circle = {
        radius: 8,
        strokeWidth: 2,
        stroke: "#ffffff",
        fill: "#1e88e5",
        _defaultStroke: "#1e88e5",
      };

      hoverEffects.removePinHover(circle as any);

      expect(circle.radius).toBe(5);
      expect(circle.strokeWidth).toBe(1);
    });

    it("should restore the original stroke color", () => {
      const circle = {
        radius: 8,
        strokeWidth: 2,
        stroke: "#ffffff",
        fill: "#1e88e5",
        _defaultStroke: "#1e88e5",
      };

      hoverEffects.removePinHover(circle as any);

      expect(circle.stroke).toBe("#1e88e5");
    });
  });

  describe("applyWireModeHighlight", () => {
    it("should set green for valid target pin", () => {
      const circle = {
        radius: 5,
        stroke: "#999",
        fill: "#1e88e5",
        strokeWidth: 1,
      };

      hoverEffects.applyWireModeHighlight(circle as any, true);

      expect(circle.fill).toBe("#00ff00");
      expect(circle.strokeWidth).toBe(3);
    });

    it("should set red for invalid target pin", () => {
      const circle = {
        radius: 5,
        stroke: "#999",
        fill: "#1e88e5",
        strokeWidth: 1,
      };

      hoverEffects.applyWireModeHighlight(circle as any, false);

      expect(circle.fill).toBe("#ff0000");
      expect(circle.strokeWidth).toBe(3);
    });
  });

  describe("removeWireModeHighlight", () => {
    it("should restore pin to default appearance", () => {
      const circle = {
        radius: 8,
        stroke: "#00ff00",
        fill: "#00ff00",
        strokeWidth: 3,
        _defaultFill: "#1e88e5",
        _defaultStroke: "#1e88e5",
      };

      hoverEffects.removeWireModeHighlight(circle as any);

      expect(circle.fill).toBe("#1e88e5");
      expect(circle.stroke).toBe("#1e88e5");
      expect(circle.strokeWidth).toBe(1);
      expect(circle.radius).toBe(5);
    });
  });
});
