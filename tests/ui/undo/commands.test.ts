import { describe, it, expect, vi } from "vitest";
import type { PlacedComponent, Wire } from "../../../src/ui/workspace/types";
import {
  AddComponentCommand,
  RemoveComponentCommand,
  MoveComponentCommand,
  RotateComponentCommand,
  AddWireCommand,
  RemoveWireCommand,
  ChangePropertyCommand,
} from "../../../src/ui/undo/commands";

/**
 * Creates mock setter functions that capture calls via vi.fn.
 * The returned `state` object is mutated by the setters.
 */
function createMockSetters(
  initialComponents: PlacedComponent[] = [],
  initialWires: Wire[] = [],
) {
  const state = {
    components: [...initialComponents],
    wires: [...initialWires],
  };

  const setComponents = vi.fn((updater: PlacedComponent[] | ((prev: PlacedComponent[]) => PlacedComponent[])) => {
    if (typeof updater === "function") {
      state.components = updater([...state.components]);
    } else {
      state.components = updater;
    }
  });

  const setWires = vi.fn((updater: Wire[] | ((prev: Wire[]) => Wire[])) => {
    if (typeof updater === "function") {
      state.wires = updater([...state.wires]);
    } else {
      state.wires = updater;
    }
  });

  return { setComponents, setWires, state };
}

// ---- Sample data ----

const sampleComponent: PlacedComponent = {
  id: "led-1",
  type: "led",
  x: 100,
  y: 200,
  rotation: 0,
  state: { color: "#ff0000", on: false },
};

const sampleWire: Wire = {
  id: "wire-1",
  startPin: { componentId: "arduino-1", pinId: "d7" },
  endPin: { componentId: "led-1", pinId: "anode" },
  color: "#1e88e5",
  points: [],
};

const sampleWire2: Wire = {
  id: "wire-2",
  startPin: { componentId: "led-1", pinId: "cathode" },
  endPin: { componentId: "gnd-1", pinId: "gnd" },
  color: "#424242",
  points: [],
};

describe("AddComponentCommand", () => {
  it("execute adds the component to state", () => {
    const { setComponents, setWires, state } = createMockSetters();
    const cmd = new AddComponentCommand(sampleComponent, setComponents, setWires);

    cmd.execute();

    expect(setComponents).toHaveBeenCalled();
    expect(state.components).toHaveLength(1);
    expect(state.components[0].id).toBe("led-1");
  });

  it("undo removes the component and its connected wires", () => {
    const { setComponents, setWires, state } = createMockSetters(
      [sampleComponent],
      [sampleWire, sampleWire2],
    );
    const cmd = new AddComponentCommand(sampleComponent, setComponents, setWires);

    cmd.undo();

    expect(setComponents).toHaveBeenCalled();
    expect(state.components).toHaveLength(0);
    expect(setWires).toHaveBeenCalled();
    expect(state.wires).toHaveLength(0);
  });

  it("undo only removes wires connected to the added component", () => {
    const unrelatedWire: Wire = {
      id: "wire-3",
      startPin: { componentId: "arduino-1", pinId: "d8" },
      endPin: { componentId: "resistor-1", pinId: "pin1" },
      color: "#1e88e5",
      points: [],
    };
    const { setComponents, setWires, state } = createMockSetters(
      [sampleComponent],
      [sampleWire, unrelatedWire],
    );
    const cmd = new AddComponentCommand(sampleComponent, setComponents, setWires);

    cmd.undo();

    expect(state.wires).toHaveLength(1);
    expect(state.wires[0].id).toBe("wire-3");
  });
});

describe("RemoveComponentCommand", () => {
  it("execute removes the component and its connected wires", () => {
    const { setComponents, setWires, state } = createMockSetters(
      [sampleComponent],
      [sampleWire, sampleWire2],
    );
    const cmd = new RemoveComponentCommand(
      sampleComponent,
      [sampleWire, sampleWire2],
      setComponents,
      setWires,
    );

    cmd.execute();

    expect(state.components).toHaveLength(0);
    expect(state.wires).toHaveLength(0);
  });

  it("undo restores the component and its wires", () => {
    const { setComponents, setWires, state } = createMockSetters();
    const cmd = new RemoveComponentCommand(
      sampleComponent,
      [sampleWire, sampleWire2],
      setComponents,
      setWires,
    );

    cmd.undo();

    expect(state.components).toHaveLength(1);
    expect(state.components[0].id).toBe("led-1");
    expect(state.wires).toHaveLength(2);
    expect(state.wires.map((w) => w.id).sort()).toEqual(["wire-1", "wire-2"]);
  });
});

describe("MoveComponentCommand", () => {
  it("execute moves component to new position", () => {
    const { setComponents, state } = createMockSetters([sampleComponent]);
    const cmd = new MoveComponentCommand(
      "led-1",
      { x: 100, y: 200 },
      { x: 300, y: 400 },
      setComponents,
    );

    cmd.execute();

    expect(state.components).toHaveLength(1);
    expect(state.components[0].x).toBe(300);
    expect(state.components[0].y).toBe(400);
  });

  it("undo moves component back to old position", () => {
    const { setComponents, state } = createMockSetters([
      { ...sampleComponent, x: 300, y: 400 },
    ]);
    const cmd = new MoveComponentCommand(
      "led-1",
      { x: 100, y: 200 },
      { x: 300, y: 400 },
      setComponents,
    );

    cmd.undo();

    expect(state.components[0].x).toBe(100);
    expect(state.components[0].y).toBe(200);
  });
});

describe("RotateComponentCommand", () => {
  it("execute rotates component by 90 degrees", () => {
    const { setComponents, state } = createMockSetters([sampleComponent]);
    const cmd = new RotateComponentCommand("led-1", 0, 90, setComponents);

    cmd.execute();

    expect(state.components[0].rotation).toBe(90);
  });

  it("undo rotates component back to previous angle", () => {
    const { setComponents, state } = createMockSetters([
      { ...sampleComponent, rotation: 90 },
    ]);
    const cmd = new RotateComponentCommand("led-1", 0, 90, setComponents);

    cmd.undo();

    expect(state.components[0].rotation).toBe(0);
  });

  it("handles wrapping from 270 to 360", () => {
    const { setComponents, state } = createMockSetters([
      { ...sampleComponent, rotation: 270 },
    ]);
    const cmd = new RotateComponentCommand("led-1", 270, 360, setComponents);

    cmd.undo();

    expect(state.components[0].rotation).toBe(270);
  });
});

describe("AddWireCommand", () => {
  it("execute adds the wire to state", () => {
    const { setWires, state } = createMockSetters();
    const cmd = new AddWireCommand(sampleWire, setWires);

    cmd.execute();

    expect(state.wires).toHaveLength(1);
    expect(state.wires[0].id).toBe("wire-1");
  });

  it("undo removes the wire from state", () => {
    const { setWires, state } = createMockSetters([], [sampleWire]);
    const cmd = new AddWireCommand(sampleWire, setWires);

    cmd.undo();

    expect(state.wires).toHaveLength(0);
  });
});

describe("RemoveWireCommand", () => {
  it("execute removes the wire from state", () => {
    const { setWires, state } = createMockSetters([], [sampleWire]);
    const cmd = new RemoveWireCommand(sampleWire, setWires);

    cmd.execute();

    expect(state.wires).toHaveLength(0);
  });

  it("undo restores the wire to state", () => {
    const { setWires, state } = createMockSetters();
    const cmd = new RemoveWireCommand(sampleWire, setWires);

    cmd.undo();

    expect(state.wires).toHaveLength(1);
    expect(state.wires[0].id).toBe("wire-1");
  });
});

describe("ChangePropertyCommand", () => {
  it("execute sets the new property value", () => {
    const { setComponents, state } = createMockSetters([sampleComponent]);
    const cmd = new ChangePropertyCommand("led-1", "color", "#ff0000", "#00ff00", setComponents);

    cmd.execute();

    expect(state.components[0].state.color).toBe("#00ff00");
  });

  it("undo restores the old property value", () => {
    const { setComponents, state } = createMockSetters([
      { ...sampleComponent, state: { ...sampleComponent.state, color: "#00ff00" } },
    ]);
    const cmd = new ChangePropertyCommand("led-1", "color", "#ff0000", "#00ff00", setComponents);

    cmd.undo();

    expect(state.components[0].state.color).toBe("#ff0000");
  });

  it("handles numeric property changes", () => {
    const resistor: PlacedComponent = {
      id: "resistor-1",
      type: "resistor",
      x: 100,
      y: 200,
      rotation: 0,
      state: { resistance: 1000 },
    };
    const { setComponents, state } = createMockSetters([resistor]);
    const cmd = new ChangePropertyCommand("resistor-1", "resistance", 1000, 470, setComponents);

    cmd.execute();

    expect(state.components[0].state.resistance).toBe(470);

    cmd.undo();

    expect(state.components[0].state.resistance).toBe(1000);
  });
});
