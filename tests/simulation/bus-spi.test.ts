import { describe, it, expect, vi } from "vitest";
import { SPIBus } from "../../src/simulation/core/bus";

describe("SPIBus", () => {
  describe("MOSI/MISO/SCK/SS signal propagation", () => {
    it("propagates MOSI signal and notifies", () => {
      const bus = new SPIBus("SPI_0");
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.propagate("MOSI", { type: "digital", high: true });
      expect(callback).toHaveBeenCalledOnce();
    });

    it("propagates MISO signal and notifies", () => {
      const bus = new SPIBus("SPI_0");
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.propagate("MISO", { type: "digital", high: false });
      expect(callback).toHaveBeenCalledOnce();
    });

    it("propagates SCK signal and notifies", () => {
      const bus = new SPIBus("SPI_0");
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.propagate("SCK", { type: "digital", high: true });
      expect(callback).toHaveBeenCalledOnce();
    });

    it("propagates SS signal and notifies", () => {
      const bus = new SPIBus("SPI_0");
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.propagate("SS", { type: "digital", high: false });
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe("clock rate setting", () => {
    it("default clock rate is 1MHz", () => {
      const bus = new SPIBus("SPI_0");
      expect(bus.clockRate).toBe(1000000);
    });

    it("setClockRate changes clock rate", () => {
      const bus = new SPIBus("SPI_0");
      bus.setClockRate(4000000);
      expect(bus.clockRate).toBe(4000000);
    });

    it("clock rate is reflected in getState", () => {
      const bus = new SPIBus("SPI_0");
      bus.setClockRate(2000000);
      expect(bus.getState().clockRate).toBe(2000000);
    });
  });

  describe("master-slave data exchange", () => {
    it("exchange with registered slave returns response", () => {
      const bus = new SPIBus("SPI_0");
      bus.registerSlave(0, {
        exchange: (mosi) => mosi.map((b) => b ^ 0xFF),
      });
      bus.selectSlave(0);
      const miso = bus.exchange([0x0F, 0xF0]);
      expect(miso).toEqual([0xF0, 0x0F]);
    });

    it("exchange without selected slave returns empty", () => {
      const bus = new SPIBus("SPI_0");
      const miso = bus.exchange([0x01]);
      expect(miso).toEqual([]);
    });

    it("exchange with unregistered slave returns empty", () => {
      const bus = new SPIBus("SPI_0");
      bus.selectSlave(5);
      const miso = bus.exchange([0x01]);
      expect(miso).toEqual([]);
    });

    it("exchange updates mosiData and misoData", () => {
      const bus = new SPIBus("SPI_0");
      bus.registerSlave(0, {
        exchange: (mosi) => [mosi[0] + 1],
      });
      bus.selectSlave(0);
      bus.exchange([0x09]);
      expect(bus.mosiData).toEqual([0x09]);
      expect(bus.misoData).toEqual([0x0A]);
    });

    it("mosiData and misoData return copies", () => {
      const bus = new SPIBus("SPI_0");
      bus.registerSlave(0, {
        exchange: () => [0x42],
      });
      bus.selectSlave(0);
      bus.exchange([0x01]);
      const m = bus.mosiData;
      m.push(0xFF);
      expect(bus.mosiData).toEqual([0x01]);
    });
  });

  describe("chip select addressing", () => {
    it("selectSlave sets selectedSlave", () => {
      const bus = new SPIBus("SPI_0");
      bus.selectSlave(2);
      expect(bus.selectedSlave).toBe(2);
    });

    it("deselectSlave clears selectedSlave", () => {
      const bus = new SPIBus("SPI_0");
      bus.selectSlave(2);
      bus.deselectSlave();
      expect(bus.selectedSlave).toBeNull();
    });

    it("selectSlave notifies SS LOW", () => {
      const bus = new SPIBus("SPI_0");
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.selectSlave(0);
      expect(callback).toHaveBeenCalledWith(bus, "SS", { type: "digital", high: false });
    });

    it("deselectSlave notifies SS HIGH", () => {
      const bus = new SPIBus("SPI_0");
      bus.selectSlave(0);
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.deselectSlave();
      expect(callback).toHaveBeenCalledWith(bus, "SS", { type: "digital", high: true });
    });

    it("can register and unregister slave", () => {
      const bus = new SPIBus("SPI_0");
      bus.registerSlave(0, { exchange: (m) => m });
      bus.selectSlave(0);
      expect(bus.exchange([0x01])).toEqual([0x01]);
      bus.unregisterSlave(0);
      expect(bus.exchange([0x01])).toEqual([]);
    });
  });

  describe("observable bus state", () => {
    it("getState returns full SPI state", () => {
      const bus = new SPIBus("SPI_0");
      bus.setClockRate(4000000);
      bus.registerSlave(0, { exchange: () => [0xAA] });
      bus.selectSlave(0);
      bus.exchange([0x55]);
      const state = bus.getState();
      expect(state).toEqual({
        clockRate: 4000000,
        mosiData: [0x55],
        misoData: [0xAA],
        selectedSlave: 0,
      });
    });

    it("subscribe fires on exchange", () => {
      const bus = new SPIBus("SPI_0");
      bus.registerSlave(0, { exchange: (m) => m });
      bus.selectSlave(0);
      const callback = vi.fn();
      bus.subscribe(callback);
      bus.exchange([0x01]);
      expect(callback).toHaveBeenCalled();
    });

    it("unsubscribe stops notifications", () => {
      const bus = new SPIBus("SPI_0");
      let count = 0;
      const unsub = bus.subscribe(() => { count++; });
      bus.propagate("MOSI", { type: "digital", high: true });
      unsub();
      bus.propagate("MOSI", { type: "digital", high: false });
      expect(count).toBe(1);
    });

    it("pin registration works", () => {
      const bus = new SPIBus("SPI_0");
      bus.registerPin("D11");
      expect(bus.hasPin("D11")).toBe(true);
      expect(bus.hasPin("D12")).toBe(false);
    });
  });
});
