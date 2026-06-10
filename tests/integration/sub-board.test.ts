import { describe, it, expect } from "vitest";
import { SubBoard } from "../../src/simulation/core/sub-board";
import { Pin } from "../../src/simulation/core/pin";
import { Wire } from "../../src/simulation/core/wire";
import { PinCapability } from "../../src/types";

describe("SubBoard", () => {
  describe("create sub-board with components and wires", () => {
    it("creates a sub-board with id and name", () => {
      const sub = new SubBoard("sub-1", "LED Module");
      expect(sub.id).toBe("sub-1");
      expect(sub.name).toBe("LED Module");
    });

    it("starts with no components", () => {
      const sub = new SubBoard("sub-1", "Test");
      expect(sub.components.size).toBe(0);
    });

    it("starts with no wires", () => {
      const sub = new SubBoard("sub-1", "Test");
      expect(sub.wires.size).toBe(0);
    });

    it("starts with no external pins", () => {
      const sub = new SubBoard("sub-1", "Test");
      expect(sub.externalPins).toHaveLength(0);
    });

    it("board is null by default", () => {
      const sub = new SubBoard("sub-1", "Test");
      expect(sub.board).toBeNull();
    });

    it("virtualSerialPort is null by default", () => {
      const sub = new SubBoard("sub-1", "Test");
      expect(sub.virtualSerialPort).toBeNull();
    });
  });

  describe("addComponent / removeComponent", () => {
    it("adds a component", () => {
      const sub = new SubBoard("sub-1", "Test");
      sub.addComponent("led-1", { type: "LED", color: "red" });
      expect(sub.components.has("led-1")).toBe(true);
      expect(sub.components.get("led-1")).toEqual({ type: "LED", color: "red" });
    });

    it("removes a component", () => {
      const sub = new SubBoard("sub-1", "Test");
      sub.addComponent("led-1", { type: "LED" });
      const removed = sub.removeComponent("led-1");
      expect(removed).toBe(true);
      expect(sub.components.has("led-1")).toBe(false);
    });

    it("removeComponent returns false for missing", () => {
      const sub = new SubBoard("sub-1", "Test");
      expect(sub.removeComponent("nope")).toBe(false);
    });
  });

  describe("addWire / removeWire", () => {
    it("adds a wire", () => {
      const sub = new SubBoard("sub-1", "Test");
      const wire = new Wire(
        "w1",
        { parentId: "led-1", pinId: "anode", parentType: "component" },
        { parentId: "res-1", pinId: "pin1", parentType: "component" },
        [],
        "#ff0000",
      );
      sub.addWire(wire);
      expect(sub.wires.has("w1")).toBe(true);
    });

    it("removes a wire", () => {
      const sub = new SubBoard("sub-1", "Test");
      const wire = new Wire(
        "w1",
        { parentId: "a", pinId: "1", parentType: "component" },
        { parentId: "b", pinId: "2", parentType: "component" },
        [],
        "#00ff00",
      );
      sub.addWire(wire);
      const removed = sub.removeWire("w1");
      expect(removed).toBe(true);
      expect(sub.wires.has("w1")).toBe(false);
    });

    it("removeWire returns false for missing", () => {
      const sub = new SubBoard("sub-1", "Test");
      expect(sub.removeWire("nope")).toBe(false);
    });
  });

  describe("expose external pins", () => {
    it("adds external pin", () => {
      const sub = new SubBoard("sub-1", "Test");
      const pin = new Pin("ext-1", "component", "sub-1", "VCC", [PinCapability.DIGITAL_WRITE]);
      sub.addExternalPin(pin);
      expect(sub.externalPins).toHaveLength(1);
      expect(sub.externalPins[0].id).toBe("ext-1");
    });

    it("does not add duplicate external pin", () => {
      const sub = new SubBoard("sub-1", "Test");
      const pin = new Pin("ext-1", "component", "sub-1", "VCC", [PinCapability.DIGITAL_WRITE]);
      sub.addExternalPin(pin);
      sub.addExternalPin(pin);
      expect(sub.externalPins).toHaveLength(1);
    });

    it("removes external pin", () => {
      const sub = new SubBoard("sub-1", "Test");
      const pin = new Pin("ext-1", "component", "sub-1", "VCC", [PinCapability.DIGITAL_WRITE]);
      sub.addExternalPin(pin);
      sub.removeExternalPin("ext-1");
      expect(sub.externalPins).toHaveLength(0);
    });

    it("removing non-existent pin does nothing", () => {
      const sub = new SubBoard("sub-1", "Test");
      sub.removeExternalPin("nope");
      expect(sub.externalPins).toHaveLength(0);
    });
  });

  describe("save/load as module", () => {
    it("serializes sub-board to plain object", () => {
      const sub = new SubBoard("sub-1", "LED Module");
      sub.addComponent("led-1", { type: "LED" });
      sub.addExternalPin(new Pin("ext-1", "component", "sub-1", "OUT", [PinCapability.DIGITAL_WRITE]));
      sub.virtualSerialPort = "/dev/ttyUSB0";

      const serialized = sub.serialize();
      const obj = serialized as Record<string, unknown>;
      expect(obj.id).toBe("sub-1");
      expect(obj.name).toBe("LED Module");
      expect(obj.virtualSerialPort).toBe("/dev/ttyUSB0");
    });

    it("deserializes from plain object", () => {
      const sub = new SubBoard("sub-1", "LED Module");
      sub.addComponent("led-1", { type: "LED" });
      const wire = new Wire(
        "w1",
        { parentId: "led-1", pinId: "anode", parentType: "component" },
        { parentId: "sub-1", pinId: "ext-1", parentType: "component" },
        [],
        "#ff0000",
      );
      sub.addWire(wire);
      sub.addExternalPin(new Pin("ext-1", "component", "sub-1", "OUT", [PinCapability.DIGITAL_WRITE]));

      const serialized = sub.serialize();
      const restored = SubBoard.deserialize(serialized as Record<string, unknown>);

      expect(restored.id).toBe("sub-1");
      expect(restored.name).toBe("LED Module");
      expect(restored.components.has("led-1")).toBe(true);
      expect(restored.wires.has("w1")).toBe(true);
      expect(restored.externalPins).toHaveLength(1);
      expect(restored.externalPins[0].id).toBe("ext-1");
    });

    it("round-trip serialization preserves data", () => {
      const sub = new SubBoard("sub-2", "Sensor Module");
      sub.addComponent("tmp36", { type: "sensor" });
      sub.addExternalPin(new Pin("vcc", "component", "sub-2", "VCC", [PinCapability.DIGITAL_WRITE]));
      sub.addExternalPin(new Pin("out", "component", "sub-2", "OUT", [PinCapability.ANALOG_READ]));
      sub.virtualSerialPort = null;

      const serialized = sub.serialize();
      const restored = SubBoard.deserialize(serialized as Record<string, unknown>);

      expect(restored.id).toBe(sub.id);
      expect(restored.name).toBe(sub.name);
      expect(restored.components.size).toBe(sub.components.size);
      expect(restored.externalPins).toHaveLength(sub.externalPins.length);
    });
  });

  describe("connect to main board via bus", () => {
    it("connectToBus stores bus and pin ids", () => {
      const sub = new SubBoard("sub-1", "Test");
      sub.addExternalPin(new Pin("sda", "component", "sub-1", "SDA", [PinCapability.I2C]));
      sub.addExternalPin(new Pin("scl", "component", "sub-1", "SCL", [PinCapability.I2C]));
      sub.connectToBus("I2C_0", ["sda", "scl"]);
      expect(sub.getConnectedBusId()).toBe("I2C_0");
      expect(sub.getConnectedPinIds()).toEqual(["sda", "scl"]);
    });

    it("disconnectFromBus clears connection", () => {
      const sub = new SubBoard("sub-1", "Test");
      sub.connectToBus("I2C_0", ["sda"]);
      sub.disconnectFromBus();
      expect(sub.getConnectedBusId()).toBeNull();
      expect(sub.getConnectedPinIds()).toEqual([]);
    });

    it("getConnectedPinIds returns a copy", () => {
      const sub = new SubBoard("sub-1", "Test");
      sub.connectToBus("I2C_0", ["sda"]);
      const ids = sub.getConnectedPinIds();
      ids.push("extra");
      expect(sub.getConnectedPinIds()).toEqual(["sda"]);
    });
  });

  describe("signal propagation between boards", () => {
    it("external pin value change reflects state", () => {
      const sub = new SubBoard("sub-1", "Test");
      const pin = new Pin("out", "component", "sub-1", "OUT", [PinCapability.DIGITAL_WRITE]);
      sub.addExternalPin(pin);

      pin.setValue({ type: "digital", high: true });
      expect(sub.externalPins[0].getValue()).toEqual({ type: "digital", high: true });
    });

    it("reset clears external pins and disconnects bus", () => {
      const sub = new SubBoard("sub-1", "Test");
      const pin = new Pin("out", "component", "sub-1", "OUT", [PinCapability.DIGITAL_WRITE]);
      pin.setValue({ type: "digital", high: true });
      sub.addExternalPin(pin);
      sub.connectToBus("I2C_0", ["out"]);

      sub.reset();
      expect(sub.externalPins[0].getValue()).toEqual({ type: "floating" });
      expect(sub.getConnectedBusId()).toBeNull();
    });
  });
});
