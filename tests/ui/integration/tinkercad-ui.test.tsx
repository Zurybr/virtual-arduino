import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CommandManager } from "../../../src/ui/undo/CommandManager";
import {
  AddComponentCommand,
  RemoveComponentCommand,
  RotateComponentCommand,
  ChangePropertyCommand,
} from "../../../src/ui/undo/commands";
import type { PlacedComponent, Wire } from "../../../src/ui/workspace/types";
import {
  getCanvasMenuItems,
  getComponentMenuItems,
  getWireMenuItems,
  getPinMenuItems,
} from "../../../src/ui/context-menu/menuConfigs";

/**
 * Integration tests for end-to-end Tinkercad UI flows.
 * Tests cover the command system + menu configs + undo/redo integration.
 */

describe("End-to-end UI integration", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let setComponents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let setWires: any;
  let manager: CommandManager;

  const ledComponent: PlacedComponent = {
    id: "led-1",
    type: "led",
    x: 100,
    y: 200,
    rotation: 0,
    state: { on: false, color: "#ff0000" },
  };

  const resistorComponent: PlacedComponent = {
    id: "resistor-1",
    type: "resistor",
    x: 300,
    y: 200,
    rotation: 0,
    state: { resistance: 1000 },
  };

  const testWire: Wire = {
    id: "wire-1",
    startPin: { componentId: "led-1", pinId: "anode" },
    endPin: { componentId: "resistor-1", pinId: "leg1" },
    color: "#1e88e5",
    points: [],
  };

  beforeEach(() => {
    setComponents = vi.fn((updater: (prev: PlacedComponent[]) => PlacedComponent[]) => {
      return updater([ledComponent, resistorComponent]);
    });

    setWires = vi.fn((updater: (prev: Wire[]) => Wire[]) => {
      return updater([testWire]);
    });
    manager = new CommandManager();
  });

  afterEach(() => {
    // No cleanup needed for unit-level command tests
  });

  describe("Property change flow", () => {
    it("should execute ChangePropertyCommand through CommandManager", () => {
      const command = new ChangePropertyCommand(
        "led-1",
        "color",
        "#ff0000",
        "#00ff00",
        setComponents,
      );

      manager.execute(command);

      expect(setComponents).toHaveBeenCalled();
      const result = setComponents.mock.results[0].value;
      const updatedLed = result.find((c: PlacedComponent) => c.id === "led-1");
      expect(updatedLed.state.color).toBe("#00ff00");
      expect(manager.canUndo).toBe(true);
    });

    it("should undo property change and revert value", () => {
      const command = new ChangePropertyCommand(
        "led-1",
        "color",
        "#ff0000",
        "#00ff00",
        setComponents,
      );

      manager.execute(command);
      setComponents.mockClear();
      manager.undo();

      expect(setComponents).toHaveBeenCalled();
      const result = setComponents.mock.results[0].value;
      const revertedLed = result.find((c: PlacedComponent) => c.id === "led-1");
      expect(revertedLed.state.color).toBe("#ff0000");
    });

    it("should redo property change after undo", () => {
      const command = new ChangePropertyCommand(
        "led-1",
        "color",
        "#ff0000",
        "#00ff00",
        setComponents,
      );

      manager.execute(command);
      manager.undo();
      setComponents.mockClear();
      manager.redo();

      expect(setComponents).toHaveBeenCalled();
      const result = setComponents.mock.results[0].value;
      const redoLed = result.find((c: PlacedComponent) => c.id === "led-1");
      expect(redoLed.state.color).toBe("#00ff00");
    });
  });

  describe("Palette drag → canvas drop flow", () => {
    it("should execute AddComponentCommand through CommandManager", () => {
      const newComponent: PlacedComponent = {
        id: "buzzer-101",
        type: "buzzer",
        x: 400,
        y: 300,
        rotation: 0,
        state: {},
      };

      const command = new AddComponentCommand(
        newComponent,
        setComponents,
        setWires,
      );

      manager.execute(command);

      expect(setComponents).toHaveBeenCalled();
      const result = setComponents.mock.results[0].value;
      expect(result).toHaveLength(3); // 2 existing + 1 new
      const added = result.find((c: PlacedComponent) => c.id === "buzzer-101");
      expect(added).toBeTruthy();
      expect(added.type).toBe("buzzer");
    });

    it("should undo component addition (component removed + wires cascaded)", () => {
      const newComponent: PlacedComponent = {
        id: "buzzer-101",
        type: "buzzer",
        x: 400,
        y: 300,
        rotation: 0,
        state: {},
      };

      const command = new AddComponentCommand(
        newComponent,
        setComponents,
        setWires,
      );

      manager.execute(command);
      setComponents.mockClear();
      setWires.mockClear();
      manager.undo();

      expect(setComponents).toHaveBeenCalled();
      const compsResult = setComponents.mock.results[0].value;
      expect(compsResult).toHaveLength(2);
      expect(compsResult.find((c: PlacedComponent) => c.id === "buzzer-101")).toBeUndefined();
    });
  });

  describe("Context menu → delete → undo flow", () => {
    it("should execute RemoveComponentCommand and cascade wires", () => {
      const connectedWires = [testWire];
      const command = new RemoveComponentCommand(
        ledComponent,
        connectedWires,
        setComponents,
        setWires,
      );

      manager.execute(command);

      expect(setComponents).toHaveBeenCalled();
      const compsResult = setComponents.mock.results[0].value;
      expect(compsResult.find((c: PlacedComponent) => c.id === "led-1")).toBeUndefined();

      expect(setWires).toHaveBeenCalled();
      const wiresResult = setWires.mock.results[0].value;
      expect(wiresResult.find((w: Wire) => w.id === "wire-1")).toBeUndefined();
    });

    it("should undo RemoveComponent and restore component + wires", () => {
      const connectedWires = [testWire];
      const command = new RemoveComponentCommand(
        ledComponent,
        connectedWires,
        setComponents,
        setWires,
      );

      manager.execute(command);
      setComponents.mockClear();
      setWires.mockClear();
      manager.undo();

      expect(setComponents).toHaveBeenCalled();
      const compsResult = setComponents.mock.results[0].value;
      expect(compsResult.find((c: PlacedComponent) => c.id === "led-1")).toBeTruthy();

      expect(setWires).toHaveBeenCalled();
      const wiresResult = setWires.mock.results[0].value;
      expect(wiresResult.find((w: Wire) => w.id === "wire-1")).toBeTruthy();
    });

    it("Rotate from context menu should execute RotateComponentCommand", () => {
      const command = new RotateComponentCommand(
        "led-1",
        0,
        90,
        setComponents,
      );

      manager.execute(command);

      expect(setComponents).toHaveBeenCalled();
      const result = setComponents.mock.results[0].value;
      const rotated = result.find((c: PlacedComponent) => c.id === "led-1");
      expect(rotated.rotation).toBe(90);

      setComponents.mockClear();
      manager.undo();

      const undoResult = setComponents.mock.results[0].value;
      const reverted = undoResult.find((c: PlacedComponent) => c.id === "led-1");
      expect(reverted.rotation).toBe(0);
    });
  });

  describe("Menu config completeness", () => {
    it("component menu should include all required actions", () => {
      const items = getComponentMenuItems();
      const labels = items.filter((i) => !i.separator).map((i) => i.label);

      expect(labels).toContain("Rotate 90°");
      expect(labels).toContain("Duplicate");
      expect(labels).toContain("Delete");
      expect(labels).toContain("Properties");
      expect(labels).toContain("Bring to Front");
      expect(labels).toContain("Send to Back");
    });

    it("canvas menu should include all required actions", () => {
      const items = getCanvasMenuItems(false);
      const labels = items.map((i) => i.label);

      expect(labels).toContain("Paste");
      expect(labels).toContain("Select All");
      expect(labels).toContain("Fit to Screen");
    });

    it("wire menu should include delete and change color", () => {
      const items = getWireMenuItems();
      const labels = items.map((i) => i.label);

      expect(labels).toContain("Delete");
      expect(labels).toContain("Change Color");
    });

    it("pin menu should include start wire action", () => {
      const items = getPinMenuItems();
      const labels = items.map((i) => i.label);

      expect(labels).toContain("Start Wire from Here");
    });
  });

  describe("Undo stack behavior", () => {
    it("should clear redo stack on new command", () => {
      const cmd1 = new ChangePropertyCommand("led-1", "color", "#ff0000", "#00ff00", setComponents);
      manager.execute(cmd1);
      manager.undo();
      expect(manager.canRedo).toBe(true);

      const cmd2 = new ChangePropertyCommand("resistor-1", "resistance", 1000, 2200, setComponents);
      manager.execute(cmd2);

      expect(manager.canRedo).toBe(false);
    });

    it("should handle multiple undo/redo operations", () => {
      const cmd1 = new ChangePropertyCommand("led-1", "color", "#ff0000", "#00ff00", setComponents);
      const cmd2 = new RotateComponentCommand("led-1", 0, 90, setComponents);

      manager.execute(cmd1);
      manager.execute(cmd2);

      expect(manager.canUndo).toBe(true);
      expect(manager.undoStackSize).toBe(2);

      manager.undo(); // undo rotate
      manager.undo(); // undo color change

      expect(manager.canUndo).toBe(false);
      expect(manager.canRedo).toBe(true);
      expect(manager.redoStackSize).toBe(2);
    });
  });
});
