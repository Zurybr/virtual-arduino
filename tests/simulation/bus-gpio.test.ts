import { describe, it, expect } from "vitest";
import { GPIOBus } from "../../src/simulation/core/bus";
import { Pin } from "../../src/simulation/core/pin";
import { PinCapability, PinValue } from "../../src/types";

describe("GPIOBus", () => {
  function makePin(id: string): Pin {
    return new Pin(id, "board", "arduino-uno", id, [
      PinCapability.DIGITAL_READ,
      PinCapability.DIGITAL_WRITE,
    ]);
  }

  describe("pin registration", () => {
    it("registerPin adds pin, hasPin returns true", () => {
      const bus = new GPIOBus("PORT_D");
      bus.registerPin("D0");
      expect(bus.hasPin("D0")).toBe(true);
    });

    it("hasPin returns false for unregistered pin", () => {
      const bus = new GPIOBus("PORT_D");
      expect(bus.hasPin("D0")).toBe(false);
    });

    it("registerPinRef adds pin and sets busId on pin", () => {
      const bus = new GPIOBus("PORT_D");
      const pin = makePin("D0");
      bus.registerPinRef("D0", pin);
      expect(bus.hasPin("D0")).toBe(true);
      expect(pin.busId).toBe("PORT_D");
    });

    it("registerPinRef tracks initial pin state", () => {
      const bus = new GPIOBus("PORT_D");
      const pin = makePin("D0");
      pin.setValue({ type: "digital", high: true });
      bus.registerPinRef("D0", pin);
      const state = bus.getState();
      expect(state.get("D0")).toEqual({ type: "digital", high: true });
    });
  });

  describe("HIGH/LOW signal propagation", () => {
    it("when one pin sets HIGH, connected pins get updated", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      const pin1 = makePin("D1");
      bus.registerPinRef("D0", pin0);
      bus.registerPinRef("D1", pin1);

      bus.propagate("D0", { type: "digital", high: true });

      expect(pin1.getValue()).toEqual({ type: "digital", high: true });
    });

    it("when one pin sets LOW, connected pins get updated", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      const pin1 = makePin("D1");
      bus.registerPinRef("D0", pin0);
      bus.registerPinRef("D1", pin1);

      bus.propagate("D0", { type: "digital", high: false });

      expect(pin1.getValue()).toEqual({ type: "digital", high: false });
    });

    it("source pin does not update itself via propagation", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      bus.registerPinRef("D0", pin0);

      const values: PinValue[] = [];
      pin0.subscribe((_p, _old, newVal) => {
        values.push(newVal);
      });

      bus.propagate("D0", { type: "digital", high: true });
      expect(values).toHaveLength(0);
    });

    it("propagates to multiple pins", () => {
      const bus = new GPIOBus("PORT_D");
      const pins = [makePin("D0"), makePin("D1"), makePin("D2")];
      for (const pin of pins) {
        bus.registerPinRef(pin.id, pin);
      }

      bus.propagate("D0", { type: "digital", high: true });

      expect(pins[1].getValue()).toEqual({ type: "digital", high: true });
      expect(pins[2].getValue()).toEqual({ type: "digital", high: true });
    });

    it("ignores non-digital and non-floating values", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      const pin1 = makePin("D1");
      bus.registerPinRef("D0", pin0);
      bus.registerPinRef("D1", pin1);

      bus.propagate("D0", { type: "analog", value: 500 });
      expect(pin1.getValue()).toEqual({ type: "floating" });

      bus.propagate("D0", { type: "pwm", dutyCycle: 128, frequency: 490 });
      expect(pin1.getValue()).toEqual({ type: "floating" });
    });

    it("propagates floating value", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      const pin1 = makePin("D1");
      bus.registerPinRef("D0", pin0);
      bus.registerPinRef("D1", pin1);

      pin1.setValue({ type: "digital", high: true });
      bus.propagate("D0", { type: "floating" });

      expect(pin1.getValue()).toEqual({ type: "floating" });
    });
  });

  describe("multi-pin state observation", () => {
    it("observe changes via callback", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      bus.registerPinRef("D0", pin0);

      const changes: Array<{ pinId: string; value: PinValue }> = [];
      bus.subscribe((_bus, pinId, value) => {
        changes.push({ pinId, value });
      });

      bus.propagate("D0", { type: "digital", high: true });
      expect(changes).toHaveLength(1);
      expect(changes[0].pinId).toBe("D0");
      expect(changes[0].value).toEqual({ type: "digital", high: true });
    });

    it("unsubscribe stops notifications", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      bus.registerPinRef("D0", pin0);

      let count = 0;
      const unsub = bus.subscribe(() => {
        count++;
      });

      bus.propagate("D0", { type: "digital", high: true });
      unsub();
      bus.propagate("D0", { type: "digital", high: false });
      expect(count).toBe(1);
    });
  });

  describe("bus state snapshot", () => {
    it("getState returns current pin states", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      const pin1 = makePin("D1");
      bus.registerPinRef("D0", pin0);
      bus.registerPinRef("D1", pin1);

      bus.propagate("D0", { type: "digital", high: true });

      const state = bus.getState();
      expect(state.get("D0")).toEqual({ type: "digital", high: true });
      expect(state.get("D1")).toEqual({ type: "digital", high: true });
    });

    it("getState returns a copy (immutable snapshot)", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      bus.registerPinRef("D0", pin0);

      const state1 = bus.getState();
      const state2 = bus.getState();
      expect(state1).not.toBe(state2);
    });
  });

  describe("unregisterPin", () => {
    it("removes pin from bus", () => {
      const bus = new GPIOBus("PORT_D");
      bus.registerPin("D0");
      expect(bus.hasPin("D0")).toBe(true);

      bus.unregisterPin("D0");
      expect(bus.hasPin("D0")).toBe(false);
    });

    it("unregisterPin removes from pinIds but pin ref may remain for propagation", () => {
      const bus = new GPIOBus("PORT_D");
      const pin0 = makePin("D0");
      const pin1 = makePin("D1");
      bus.registerPinRef("D0", pin0);
      bus.registerPinRef("D1", pin1);

      bus.unregisterPin("D1");
      expect(bus.hasPin("D1")).toBe(false);
    });
  });
});
