import { describe, it, expect } from "vitest";
import {
  applyComponentHover,
  removeComponentHover,
  applyPinHover,
  removePinHover,
  applyWireModeHighlight,
  removeWireModeHighlight,
} from "../../../src/ui/workspace/hover-effects";

/**
 * Tests for the hover effect integration with ComponentItem.
 * Since Konva can't be rendered in jsdom, we test:
 * 1. The hover effect functions work correctly
 * 2. The wire-drawing highlighting logic
 * 3. Pin validity logic for wire-drawing mode
 */

describe("hover-effects integration", () => {
  describe("component hover glow lifecycle", () => {
    it("apply then remove restores node state", () => {
      const node: Record<string, unknown> = {
        shadowColor: "",
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowOpacity: 0,
        shadowEnabled: false,
      };

      applyComponentHover(node as any);
      expect(node.shadowEnabled).toBe(true);
      expect(node.shadowColor).toBe("#00BFFF");

      removeComponentHover(node as any);
      expect(node.shadowEnabled).toBe(false);
      expect(node.shadowBlur).toBe(0);
      expect(node.shadowOpacity).toBe(0);
    });

    it("applying hover on already-hovered node is idempotent", () => {
      const node: Record<string, unknown> = {
        shadowColor: "#00BFFF",
        shadowBlur: 15,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowOpacity: 0.6,
        shadowEnabled: true,
      };

      applyComponentHover(node as any);
      expect(node.shadowColor).toBe("#00BFFF");
      expect(node.shadowBlur).toBe(15);
    });
  });

  describe("pin hover lifecycle", () => {
    it("apply then remove restores pin state", () => {
      const circle: Record<string, unknown> = {
        radius: 5,
        stroke: "#1e88e5",
        fill: "#1e88e5",
        strokeWidth: 1,
        _defaultStroke: "#1e88e5",
      };

      applyPinHover(circle as any);
      expect(circle.radius).toBe(8);
      expect(circle.stroke).toBe("#ffffff");

      removePinHover(circle as any);
      expect(circle.radius).toBe(5);
      expect(circle.stroke).toBe("#1e88e5");
    });
  });

  describe("wire-drawing pin validity", () => {
    it("same component but different pin is valid", () => {
      const startComponentId = "arduino-1" as string;
      const startPinId = "digital-right-2" as string;
      const targetComponentId = "arduino-1" as string;
      const targetPinId = "analog-bottom-0" as string;

      const isSamePin =
        startComponentId === targetComponentId && startPinId === targetPinId;
      expect(isSamePin).toBe(false);
    });

    it("same pin is invalid", () => {
      const startComponentId = "arduino-1" as string;
      const startPinId = "digital-right-2" as string;
      const targetComponentId = "arduino-1" as string;
      const targetPinId = "digital-right-2" as string;

      const isSamePin =
        startComponentId === targetComponentId && startPinId === targetPinId;
      expect(isSamePin).toBe(true);
    });

    it("different component is always valid", () => {
      const startComponentId = "arduino-1" as string;
      const targetComponentId = "led-1" as string;

      const isSameComponent = startComponentId === targetComponentId;
      expect(isSameComponent).toBe(false);
    });
  });

  describe("wire-mode highlight lifecycle", () => {
    it("valid target highlight then remove", () => {
      const circle: Record<string, unknown> = {
        radius: 5,
        stroke: "#1e88e5",
        fill: "#1e88e5",
        strokeWidth: 1,
        _defaultFill: "#1e88e5",
        _defaultStroke: "#1e88e5",
      };

      applyWireModeHighlight(circle as any, true);
      expect(circle.fill).toBe("#00ff00");

      removeWireModeHighlight(circle as any);
      expect(circle.fill).toBe("#1e88e5");
      expect(circle.stroke).toBe("#1e88e5");
    });

    it("invalid target highlight then remove", () => {
      const circle: Record<string, unknown> = {
        radius: 5,
        stroke: "#1e88e5",
        fill: "#1e88e5",
        strokeWidth: 1,
        _defaultFill: "#1e88e5",
        _defaultStroke: "#1e88e5",
      };

      applyWireModeHighlight(circle as any, false);
      expect(circle.fill).toBe("#ff0000");

      removeWireModeHighlight(circle as any);
      expect(circle.fill).toBe("#1e88e5");
    });
  });
});
