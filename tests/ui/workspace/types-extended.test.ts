import { describe, it, expect } from "vitest";
import {
  type ContextMenuState,
  type WireDrawingState,
  HOVER_SHADOW,
  WIRE_MODE_VALID_COLOR,
  WIRE_MODE_INVALID_COLOR,
  HOVER_TRANSITION_MS,
} from "../../../src/ui/workspace/types";

describe("ContextMenuState type", () => {
  it("should accept canvas target type", () => {
    const state: ContextMenuState = {
      x: 100,
      y: 200,
      targetType: "canvas",
    };
    expect(state.targetType).toBe("canvas");
    expect(state.x).toBe(100);
    expect(state.y).toBe(200);
  });

  it("should accept component target type with targetId", () => {
    const state: ContextMenuState = {
      x: 150,
      y: 250,
      targetType: "component",
      targetId: "led-1",
      componentType: "led",
    };
    expect(state.targetType).toBe("component");
    expect(state.targetId).toBe("led-1");
    expect(state.componentType).toBe("led");
  });

  it("should accept wire target type with targetId", () => {
    const state: ContextMenuState = {
      x: 300,
      y: 400,
      targetType: "wire",
      targetId: "wire-1",
    };
    expect(state.targetType).toBe("wire");
    expect(state.targetId).toBe("wire-1");
  });

  it("should accept pin target type with targetId", () => {
    const state: ContextMenuState = {
      x: 50,
      y: 75,
      targetType: "pin",
      targetId: "anode",
    };
    expect(state.targetType).toBe("pin");
    expect(state.targetId).toBe("anode");
  });
});

describe("WireDrawingState type", () => {
  it("should capture wire drawing state", () => {
    const state: WireDrawingState = {
      startComponentId: "arduino-1",
      startPinId: "digital-right-2",
      startX: 100,
      startY: 200,
      currentX: 300,
      currentY: 400,
    };
    expect(state.startComponentId).toBe("arduino-1");
    expect(state.startPinId).toBe("digital-right-2");
    expect(state.startX).toBe(100);
    expect(state.currentX).toBe(300);
  });
});

describe("Hover highlight constants", () => {
  it("HOVER_SHADOW should have correct color and blur", () => {
    expect(HOVER_SHADOW.color).toBe("#00BFFF");
    expect(HOVER_SHADOW.blur).toBe(15);
    expect(HOVER_SHADOW.opacity).toBe(0.6);
  });

  it("WIRE_MODE_VALID_COLOR should be green", () => {
    expect(WIRE_MODE_VALID_COLOR).toBe("#00ff00");
  });

  it("WIRE_MODE_INVALID_COLOR should be red", () => {
    expect(WIRE_MODE_INVALID_COLOR).toBe("#ff0000");
  });

  it("HOVER_TRANSITION_MS should be 150ms", () => {
    expect(HOVER_TRANSITION_MS).toBe(150);
  });
});
