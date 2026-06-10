import { describe, it, expect, vi } from "vitest";
import { I2CBus } from "../../src/simulation/core/bus";

describe("I2CBus", () => {
  describe("address-based routing", () => {
    it("sets address with setAddress", () => {
      const bus = new I2CBus("I2C_0");
      bus.setAddress(0x50);
      expect(bus.address).toBe(0x50);
    });

    it("rejects address > 0x7F", () => {
      const bus = new I2CBus("I2C_0");
      expect(() => bus.setAddress(0x80)).toThrow();
    });

    it("rejects negative address", () => {
      const bus = new I2CBus("I2C_0");
      expect(() => bus.setAddress(-1)).toThrow();
    });

    it("accepts address 0x00", () => {
      const bus = new I2CBus("I2C_0");
      bus.setAddress(0x00);
      expect(bus.address).toBe(0x00);
    });

    it("accepts address 0x7F (max 7-bit)", () => {
      const bus = new I2CBus("I2C_0");
      bus.setAddress(0x7F);
      expect(bus.address).toBe(0x7F);
    });
  });

  describe("SDA/SCL signal propagation", () => {
    it("propagates SDA digital value", () => {
      const bus = new I2CBus("I2C_0");
      bus.propagate("SDA", { type: "digital", high: true });
      expect(bus.sdaState).toBe(true);
    });

    it("propagates SCL digital value", () => {
      const bus = new I2CBus("I2C_0");
      bus.propagate("SCL", { type: "digital", high: true });
      expect(bus.sclState).toBe(true);
    });

    it("SDA LOW propagation", () => {
      const bus = new I2CBus("I2C_0");
      bus.propagate("SDA", { type: "digital", high: true });
      bus.propagate("SDA", { type: "digital", high: false });
      expect(bus.sdaState).toBe(false);
    });

    it("SCL LOW propagation", () => {
      const bus = new I2CBus("I2C_0");
      bus.propagate("SCL", { type: "digital", high: true });
      bus.propagate("SCL", { type: "digital", high: false });
      expect(bus.sclState).toBe(false);
    });
  });

  describe("master transmit to specific address", () => {
    it("transmits data to registered device", () => {
      const bus = new I2CBus("I2C_0");
      const received: number[][] = [];
      bus.registerDevice(0x50, {
        transmit: (data) => { received.push(data); },
        receive: () => [],
      });
      bus.transmit(0x50, [0x01, 0x02, 0x03]);
      expect(received).toHaveLength(1);
      expect(received[0]).toEqual([0x01, 0x02, 0x03]);
    });

    it("updates dataBuffer on transmit", () => {
      const bus = new I2CBus("I2C_0");
      bus.transmit(0x50, [0xAA, 0xBB]);
      expect(bus.dataBuffer).toEqual([0xAA, 0xBB]);
    });

    it("updates address on transmit", () => {
      const bus = new I2CBus("I2C_0");
      bus.transmit(0x50, [0x01]);
      expect(bus.address).toBe(0x50);
    });

    it("transmit to unregistered address does not throw", () => {
      const bus = new I2CBus("I2C_0");
      expect(() => bus.transmit(0x30, [0x01])).not.toThrow();
    });

    it("rejects transmit to invalid address", () => {
      const bus = new I2CBus("I2C_0");
      expect(() => bus.transmit(0x80, [0x01])).toThrow();
    });
  });

  describe("master receive from specific address", () => {
    it("receives data from registered device", () => {
      const bus = new I2CBus("I2C_0");
      bus.registerDevice(0x50, {
        transmit: () => {},
        receive: () => [0xDE, 0xAD],
      });
      const data = bus.receive(0x50);
      expect(data).toEqual([0xDE, 0xAD]);
    });

    it("returns empty array for unregistered device", () => {
      const bus = new I2CBus("I2C_0");
      const data = bus.receive(0x30);
      expect(data).toEqual([]);
    });

    it("updates address on receive", () => {
      const bus = new I2CBus("I2C_0");
      bus.registerDevice(0x50, {
        transmit: () => {},
        receive: () => [0x01],
      });
      bus.receive(0x50);
      expect(bus.address).toBe(0x50);
    });

    it("rejects receive from invalid address", () => {
      const bus = new I2CBus("I2C_0");
      expect(() => bus.receive(-1)).toThrow();
    });
  });

  describe("device addressing (7-bit, 0x00-0x7F)", () => {
    it("can register and unregister device", () => {
      const bus = new I2CBus("I2C_0");
      bus.registerDevice(0x10, {
        transmit: () => {},
        receive: () => [],
      });
      bus.unregisterDevice(0x10);
      const data = bus.receive(0x10);
      expect(data).toEqual([]);
    });
  });

  describe("ACK/NACK response", () => {
    it("transmit to registered device is ACK (no error)", () => {
      const bus = new I2CBus("I2C_0");
      bus.registerDevice(0x50, {
        transmit: () => {},
        receive: () => [],
      });
      expect(() => bus.transmit(0x50, [0x01])).not.toThrow();
    });

    it("transmit to unregistered device still completes (NACK handled gracefully)", () => {
      const bus = new I2CBus("I2C_0");
      bus.transmit(0x60, [0x01]);
      expect(bus.dataBuffer).toEqual([0x01]);
    });
  });

  describe("observable bus state", () => {
    it("getState returns full I2C state", () => {
      const bus = new I2CBus("I2C_0");
      bus.transmit(0x50, [0x01, 0x02]);
      const state = bus.getState();
      expect(state.address).toBe(0x50);
      expect(state.dataBuffer).toEqual([0x01, 0x02]);
      expect(typeof state.sdaState).toBe("boolean");
      expect(typeof state.sclState).toBe("boolean");
    });

    it("subscribe fires on propagate", () => {
      const bus = new I2CBus("I2C_0");
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.propagate("SDA", { type: "digital", high: true });
      expect(callback).toHaveBeenCalledOnce();
    });

    it("subscribe fires on transmit", () => {
      const bus = new I2CBus("I2C_0");
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.transmit(0x50, [0x01]);
      expect(callback).toHaveBeenCalled();
    });

    it("subscribe fires on receive", () => {
      const bus = new I2CBus("I2C_0");
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.receive(0x50);
      expect(callback).toHaveBeenCalled();
    });

    it("dataBuffer returns a copy", () => {
      const bus = new I2CBus("I2C_0");
      bus.transmit(0x50, [0x01]);
      const buf = bus.dataBuffer;
      buf.push(0xFF);
      expect(bus.dataBuffer).toEqual([0x01]);
    });
  });
});
