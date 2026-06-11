import { describe, it, expect, beforeEach } from "vitest";
import { CommandManager } from "../../../src/ui/undo/CommandManager";
import {
  ChangePropertyCommand,
  AddComponentCommand,
  RemoveComponentCommand,
  RotateComponentCommand,
} from "../../../src/ui/undo/commands";
import { SCHEMA_MAP } from "../../../src/ui/properties/schemas";
import type { PlacedComponent, Wire } from "../../../src/ui/workspace/types";

/**
 * Integration test for property change → undo → redo flow.
 * Tests the full command lifecycle from property edit through undo/redo.
 */
describe("Property change integration flow", () => {
  let components: PlacedComponent[];
  let wires: Wire[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let setComponents: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let setWires: any;
  let manager: CommandManager;

  beforeEach(() => {
    components = [
      {
        id: "resistor-1",
        type: "resistor",
        x: 100,
        y: 200,
        rotation: 0,
        state: { resistance: 1000 },
      },
      {
        id: "led-1",
        type: "led",
        x: 300,
        y: 200,
        rotation: 0,
        state: { on: false, color: "#ff0000" },
      },
    ];
    wires = [];

    setComponents = vi.fn((updater: (prev: PlacedComponent[]) => PlacedComponent[]) => {
      const result = updater([...components]);
      components = result; // update reference for chained calls
      return result;
    });

    setWires = vi.fn((updater: (prev: Wire[]) => Wire[]) => {
      const result = updater([...wires]);
      wires = result;
      return result;
    });

    manager = new CommandManager();
  });

  describe("Select component → property panel → change value → undo", () => {
    it("should change resistor value and revert via undo", () => {
      // Step 1: Simulate selecting a resistor (setComponents already has it)
      const resistorSchema = SCHEMA_MAP["resistor"];
      expect(resistorSchema).toBeDefined();

      const resistanceField = resistorSchema.find((s) => s.key === "resistance");
      expect(resistanceField).toBeTruthy();
      expect(resistanceField!.options).toBeTruthy();

      // Step 2: Change property via command
      const command = new ChangePropertyCommand(
        "resistor-1",
        "resistance",
        1000,
        470,
        setComponents,
      );

      manager.execute(command);

      expect(setComponents).toHaveBeenCalled();
      const afterChange = setComponents.mock.results[0].value;
      const changedResistor = afterChange.find((c: PlacedComponent) => c.id === "resistor-1");
      expect(changedResistor.state.resistance).toBe(470);

      // Step 3: Undo reverts the value
      setComponents.mockClear();
      manager.undo();

      expect(setComponents).toHaveBeenCalled();
      const afterUndo = setComponents.mock.results[0].value;
      const undoneResistor = afterUndo.find((c: PlacedComponent) => c.id === "resistor-1");
      expect(undoneResistor.state.resistance).toBe(1000);
    });

    it("should change LED color and revert via undo", () => {
      const command = new ChangePropertyCommand(
        "led-1",
        "color",
        "#ff0000",
        "#00ff00",
        setComponents,
      );

      manager.execute(command);

      const afterChange = setComponents.mock.results[0].value;
      const changedLed = afterChange.find((c: PlacedComponent) => c.id === "led-1");
      expect(changedLed.state.color).toBe("#00ff00");

      setComponents.mockClear();
      manager.undo();

      const afterUndo = setComponents.mock.results[0].value;
      const undoneLed = afterUndo.find((c: PlacedComponent) => c.id === "led-1");
      expect(undoneLed.state.color).toBe("#ff0000");
    });
  });

  describe("Drag from palette → component appears → undo → disappears", () => {
    it("should add and then remove a new component", () => {
      const newComponent: PlacedComponent = {
        id: "buzzer-101",
        type: "buzzer",
        x: 500,
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
      const afterAdd = setComponents.mock.results[0].value;
      expect(afterAdd).toHaveLength(3);
      expect(afterAdd.find((c: PlacedComponent) => c.id === "buzzer-101")).toBeTruthy();

      // Undo removes it
      setComponents.mockClear();
      setWires.mockClear();
      manager.undo();

      expect(setComponents).toHaveBeenCalled();
      const afterUndo = setComponents.mock.results[0].value;
      expect(afterUndo).toHaveLength(2);
      expect(afterUndo.find((c: PlacedComponent) => c.id === "buzzer-101")).toBeUndefined();
    });
  });

  describe("Context menu → delete → undo → restored", () => {
    it("should remove component with wires and restore both on undo", () => {
      // Setup: add a wire connected to led-1
      wires = [
        {
          id: "wire-1",
          startPin: { componentId: "led-1", pinId: "anode" },
          endPin: { componentId: "resistor-1", pinId: "leg1" },
          color: "#1e88e5",
          points: [],
        },
      ];

      // Re-create setters with wires
      const localSetComponents = vi.fn((updater: (prev: PlacedComponent[]) => PlacedComponent[]) => {
        const result = updater([...components]);
        components = result;
        return result;
      });

      const localSetWires = vi.fn((updater: (prev: Wire[]) => Wire[]) => {
        const result = updater([...wires]);
        wires = result;
        return result;
      });

      const localManager = new CommandManager();

      const command = new RemoveComponentCommand(
        components[1], // led-1
        wires,
        localSetComponents,
        localSetWires,
      );

      localManager.execute(command);

      // Verify removal
      expect(localSetComponents).toHaveBeenCalled();
      const afterRemove = localSetComponents.mock.results[0].value;
      expect(afterRemove.find((c: PlacedComponent) => c.id === "led-1")).toBeUndefined();

      expect(localSetWires).toHaveBeenCalled();
      const wiresAfterRemove = localSetWires.mock.results[0].value;
      expect(wiresAfterRemove.find((w: Wire) => w.id === "wire-1")).toBeUndefined();

      // Undo restores both
      localSetComponents.mockClear();
      localSetWires.mockClear();
      localManager.undo();

      expect(localSetComponents).toHaveBeenCalled();
      const afterUndo = localSetComponents.mock.results[0].value;
      expect(afterUndo.find((c: PlacedComponent) => c.id === "led-1")).toBeTruthy();

      expect(localSetWires).toHaveBeenCalled();
      const wiresAfterUndo = localSetWires.mock.results[0].value;
      expect(wiresAfterUndo.find((w: Wire) => w.id === "wire-1")).toBeTruthy();
    });
  });

  describe("Context menu → rotate → undo → angle reverts", () => {
    it("should rotate component and revert on undo", () => {
      const command = new RotateComponentCommand(
        "led-1",
        0,
        90,
        setComponents,
      );

      manager.execute(command);

      const afterRotate = setComponents.mock.results[0].value;
      const rotated = afterRotate.find((c: PlacedComponent) => c.id === "led-1");
      expect(rotated.rotation).toBe(90);

      setComponents.mockClear();
      manager.undo();

      const afterUndo = setComponents.mock.results[0].value;
      const reverted = afterUndo.find((c: PlacedComponent) => c.id === "led-1");
      expect(reverted.rotation).toBe(0);
    });

    it("should handle full 360° rotation cycle", () => {
      const rotations = [90, 180, 270, 0];

      let currentRotation = 0;
      for (const target of rotations) {
        setComponents.mockClear();
        const command = new RotateComponentCommand(
          "led-1",
          currentRotation,
          target,
          setComponents,
        );
        manager.execute(command);
        currentRotation = target;
      }

      expect(manager.undoStackSize).toBe(4);

      // Undo all 4
      for (let i = 0; i < 4; i++) {
        setComponents.mockClear();
        manager.undo();
      }

      expect(manager.canUndo).toBe(false);
    });
  });
});
