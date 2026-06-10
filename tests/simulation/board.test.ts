import { describe, it, expect } from "vitest";
import { Board } from "../../src/simulation/core/board";
import { ATMEGA328P } from "../../src/simulation/core/board-model";
import { PinMode, BusType } from "../../src/types";

describe("Board", () => {
  function makeBoard(): Board {
    return new Board(ATMEGA328P);
  }

  describe("pin creation", () => {
    it("creates 20 pins matching ATmega328P model", () => {
      const board = makeBoard();
      const modelPins = ATMEGA328P.pinDefinitions.length;
      expect(modelPins).toBe(20);
      let signalPinCount = 0;
      for (const [id] of board.pins) {
        if (id !== "5V" && id !== "GND") signalPinCount++;
      }
      expect(signalPinCount).toBe(20);
    });

    it("total pin count includes 5V and GND", () => {
      const board = makeBoard();
      expect(board.pins.size).toBe(22);
    });

    it("all model pins are accessible by label", () => {
      const board = makeBoard();
      for (const def of ATMEGA328P.pinDefinitions) {
        const pin = board.pins.get(def.label);
        expect(pin).toBeDefined();
        expect(pin!.id).toBe(def.label);
      }
    });
  });

  describe("GPIO buses", () => {
    it("creates GPIO buses for ports B, C, D", () => {
      const board = makeBoard();
      expect(board.getBus("PORT_B")).toBeDefined();
      expect(board.getBus("PORT_C")).toBeDefined();
      expect(board.getBus("PORT_D")).toBeDefined();
    });

    it("all GPIO buses have type GPIO", () => {
      const board = makeBoard();
      const gpioBuses = board.getBusesByType(BusType.GPIO);
      expect(gpioBuses.length).toBe(3);
      for (const bus of gpioBuses) {
        expect(bus.type).toBe(BusType.GPIO);
      }
    });

    it("PORT_B contains pins D8-D13", () => {
      const board = makeBoard();
      const bus = board.getBus("PORT_B")!;
      expect(bus.hasPin("D8")).toBe(true);
      expect(bus.hasPin("D9")).toBe(true);
      expect(bus.hasPin("D10")).toBe(true);
      expect(bus.hasPin("D11")).toBe(true);
      expect(bus.hasPin("D12")).toBe(true);
      expect(bus.hasPin("D13")).toBe(true);
    });

    it("PORT_C contains pins A0-A5", () => {
      const board = makeBoard();
      const bus = board.getBus("PORT_C")!;
      expect(bus.hasPin("A0")).toBe(true);
      expect(bus.hasPin("A1")).toBe(true);
      expect(bus.hasPin("A2")).toBe(true);
      expect(bus.hasPin("A3")).toBe(true);
      expect(bus.hasPin("A4")).toBe(true);
      expect(bus.hasPin("A5")).toBe(true);
    });

    it("PORT_D contains pins D0-D7", () => {
      const board = makeBoard();
      const bus = board.getBus("PORT_D")!;
      for (let i = 0; i <= 7; i++) {
        expect(bus.hasPin(`D${i}`)).toBe(true);
      }
    });

    it("PORT_B has exactly 6 pins", () => {
      const board = makeBoard();
      const bus = board.getBus("PORT_B")!;
      expect(bus.pinIds.size).toBe(6);
    });

    it("PORT_C has exactly 6 pins", () => {
      const board = makeBoard();
      const bus = board.getBus("PORT_C")!;
      expect(bus.pinIds.size).toBe(6);
    });

    it("PORT_D has exactly 8 pins", () => {
      const board = makeBoard();
      const bus = board.getBus("PORT_D")!;
      expect(bus.pinIds.size).toBe(8);
    });
  });

  describe("flash memory", () => {
    it("has correct size: 16384 Uint16 entries = 32KB", () => {
      const board = makeBoard();
      expect(board.flash.length).toBe(16384);
    });

    it("is initialized to zeros", () => {
      const board = makeBoard();
      for (let i = 0; i < board.flash.length; i++) {
        expect(board.flash[i]).toBe(0);
      }
    });

    it("can write and read values", () => {
      const board = makeBoard();
      board.flash[0] = 0xffff;
      board.flash[16383] = 0x1234;
      expect(board.flash[0]).toBe(0xffff);
      expect(board.flash[16383]).toBe(0x1234);
    });
  });

  describe("SRAM", () => {
    it("has correct size: 2048 bytes", () => {
      const board = makeBoard();
      expect(board.sram.length).toBe(2048);
    });

    it("is initialized to zeros", () => {
      const board = makeBoard();
      for (let i = 0; i < board.sram.length; i++) {
        expect(board.sram[i]).toBe(0);
      }
    });
  });

  describe("EEPROM", () => {
    it("has correct size: 1024 bytes", () => {
      const board = makeBoard();
      expect(board.eeprom.length).toBe(1024);
    });

    it("is initialized to zeros", () => {
      const board = makeBoard();
      for (let i = 0; i < board.eeprom.length; i++) {
        expect(board.eeprom[i]).toBe(0);
      }
    });
  });

  describe("power rails", () => {
    it("5V pin is initialized", () => {
      const board = makeBoard();
      const vcc = board.getPin("5V");
      expect(vcc).toBeDefined();
      expect(vcc!.mode).toBe(PinMode.POWER);
      expect(vcc!.value).toEqual({ type: "analog", value: 5000 });
    });

    it("GND pin is initialized", () => {
      const board = makeBoard();
      const gnd = board.getPin("GND");
      expect(gnd).toBeDefined();
      expect(gnd!.mode).toBe(PinMode.GROUND);
      expect(gnd!.value).toEqual({ type: "analog", value: 0 });
    });
  });

  describe("pin mode configuration", () => {
    it("can set pin 13 to OUTPUT", () => {
      const board = makeBoard();
      const pin13 = board.getPin("D13")!;
      pin13.setMode(PinMode.OUTPUT);
      expect(pin13.mode).toBe(PinMode.OUTPUT);
    });

    it("can set pin 3 to PWM", () => {
      const board = makeBoard();
      const pin3 = board.getPin("D3")!;
      pin3.setMode(PinMode.PWM);
      expect(pin3.mode).toBe(PinMode.PWM);
    });

    it("can set A0 to ANALOG mode", () => {
      const board = makeBoard();
      const a0 = board.getPin("A0")!;
      a0.setMode(PinMode.ANALOG);
      expect(a0.mode).toBe(PinMode.ANALOG);
    });
  });

  describe("getPin", () => {
    it("returns correct pin for valid id", () => {
      const board = makeBoard();
      const pin = board.getPin("D13");
      expect(pin).toBeDefined();
      expect(pin!.label).toBe("D13");
    });

    it("returns undefined for invalid id", () => {
      const board = makeBoard();
      expect(board.getPin("NONEXISTENT")).toBeUndefined();
    });
  });

  describe("getBusesByType", () => {
    it("returns all GPIO buses", () => {
      const board = makeBoard();
      const gpioBuses = board.getBusesByType(BusType.GPIO);
      expect(gpioBuses.length).toBe(3);
    });

    it("returns empty array for type with no buses", () => {
      const board = makeBoard();
      const uartBuses = board.getBusesByType(BusType.UART);
      expect(uartBuses).toEqual([]);
    });
  });

  describe("reset", () => {
    it("clears all signal pins to INPUT/floating", () => {
      const board = makeBoard();
      const pin13 = board.getPin("D13")!;
      pin13.setMode(PinMode.OUTPUT);
      pin13.setValue({ type: "digital", high: true });

      const a0 = board.getPin("A0")!;
      a0.setValue({ type: "analog", value: 512 });

      board.reset();

      expect(pin13.mode).toBe(PinMode.INPUT);
      expect(pin13.value).toEqual({ type: "floating" });
      expect(a0.mode).toBe(PinMode.INPUT);
      expect(a0.value).toEqual({ type: "floating" });
    });

    it("preserves power rails after reset", () => {
      const board = makeBoard();
      board.reset();
      const vcc = board.getPin("5V")!;
      const gnd = board.getPin("GND")!;
      expect(vcc.mode).toBe(PinMode.POWER);
      expect(vcc.value).toEqual({ type: "analog", value: 5000 });
      expect(gnd.mode).toBe(PinMode.GROUND);
      expect(gnd.value).toEqual({ type: "analog", value: 0 });
    });

    it("clears flash memory", () => {
      const board = makeBoard();
      board.flash[0] = 0xffff;
      board.flash[100] = 0x1234;
      board.reset();
      expect(board.flash[0]).toBe(0);
      expect(board.flash[100]).toBe(0);
    });

    it("clears SRAM", () => {
      const board = makeBoard();
      board.sram[0] = 0xff;
      board.sram[100] = 0xab;
      board.reset();
      expect(board.sram[0]).toBe(0);
      expect(board.sram[100]).toBe(0);
    });

    it("clears EEPROM", () => {
      const board = makeBoard();
      board.eeprom[0] = 0xff;
      board.eeprom[500] = 0xcd;
      board.reset();
      expect(board.eeprom[0]).toBe(0);
      expect(board.eeprom[500]).toBe(0);
    });
  });
});
