import { describe, it, expect } from "vitest";

const FLASH_SIZE = 16384;
const DATA_MEM_SIZE = 0x900;
const EEPROM_SIZE = 1024;

const REGISTERS_START = 0x00;
const REGISTERS_END = 0x1f;
const IO_START = 0x20;
const IO_END = 0xff;
const SRAM_START = 0x100;
const SRAM_END = 0x8ff;

class MemoryModel {
  flash: Uint16Array;
  dataMem: Uint8Array;
  eeprom: Uint8Array;

  constructor() {
    this.flash = new Uint16Array(FLASH_SIZE);
    this.dataMem = new Uint8Array(DATA_MEM_SIZE);
    this.eeprom = new Uint8Array(EEPROM_SIZE);
  }

  writeFlash(address: number, value: number): void {
    if (address < 0 || address >= FLASH_SIZE) {
      throw new Error(`Flash address out of bounds: ${address}`);
    }
    this.flash[address] = value;
  }

  readFlash(address: number): number {
    if (address < 0 || address >= FLASH_SIZE) {
      throw new Error(`Flash address out of bounds: ${address}`);
    }
    return this.flash[address];
  }

  writeSRAM(address: number, value: number): void {
    if (address < 0 || address >= DATA_MEM_SIZE) {
      throw new Error(`SRAM address out of bounds: ${address}`);
    }
    this.dataMem[address] = value;
  }

  readSRAM(address: number): number {
    if (address < 0 || address >= DATA_MEM_SIZE) {
      throw new Error(`SRAM address out of bounds: ${address}`);
    }
    return this.dataMem[address];
  }

  writeEEPROM(address: number, value: number): void {
    if (address < 0 || address >= EEPROM_SIZE) {
      throw new Error(`EEPROM address out of bounds: ${address}`);
    }
    this.eeprom[address] = value;
  }

  readEEPROM(address: number): number {
    if (address < 0 || address >= EEPROM_SIZE) {
      throw new Error(`EEPROM address out of bounds: ${address}`);
    }
    return this.eeprom[address];
  }
}

describe("ATmega328P Memory Model", () => {
  describe("Flash", () => {
    it("has 16384 Uint16 entries (32KB)", () => {
      const mem = new MemoryModel();
      expect(mem.flash.length).toBe(FLASH_SIZE);
    });

    it("is initialized to zeros", () => {
      const mem = new MemoryModel();
      expect(mem.readFlash(0)).toBe(0);
      expect(mem.readFlash(FLASH_SIZE - 1)).toBe(0);
    });

    it("write and readback values match", () => {
      const mem = new MemoryModel();
      mem.writeFlash(0, 0x0000);
      mem.writeFlash(1, 0xffff);
      mem.writeFlash(100, 0x1234);
      mem.writeFlash(FLASH_SIZE - 1, 0xabcd);

      expect(mem.readFlash(0)).toBe(0x0000);
      expect(mem.readFlash(1)).toBe(0xffff);
      expect(mem.readFlash(100)).toBe(0x1234);
      expect(mem.readFlash(FLASH_SIZE - 1)).toBe(0xabcd);
    });

    it("write beyond flash size should throw", () => {
      const mem = new MemoryModel();
      expect(() => mem.writeFlash(FLASH_SIZE, 0x1234)).toThrow();
      expect(() => mem.writeFlash(FLASH_SIZE + 100, 0x1234)).toThrow();
    });

    it("read beyond flash size should throw", () => {
      const mem = new MemoryModel();
      expect(() => mem.readFlash(FLASH_SIZE)).toThrow();
      expect(() => mem.readFlash(-1)).toThrow();
    });

    it("negative address throws", () => {
      const mem = new MemoryModel();
      expect(() => mem.writeFlash(-1, 0)).toThrow();
    });
  });

  describe("SRAM layout", () => {
    it("data memory covers full address space (2304 bytes = 0x900)", () => {
      const mem = new MemoryModel();
      expect(mem.dataMem.length).toBe(DATA_MEM_SIZE);
    });

    it("registers region 0x00-0x1F is accessible", () => {
      const mem = new MemoryModel();
      mem.writeSRAM(REGISTERS_START, 0xff);
      mem.writeSRAM(REGISTERS_END, 0xaa);
      expect(mem.readSRAM(REGISTERS_START)).toBe(0xff);
      expect(mem.readSRAM(REGISTERS_END)).toBe(0xaa);
    });

    it("I/O region 0x20-0xFF is accessible", () => {
      const mem = new MemoryModel();
      mem.writeSRAM(IO_START, 0x55);
      mem.writeSRAM(IO_END, 0x77);
      expect(mem.readSRAM(IO_START)).toBe(0x55);
      expect(mem.readSRAM(IO_END)).toBe(0x77);
    });

    it("internal SRAM region 0x100-0x8FF is accessible", () => {
      const mem = new MemoryModel();
      mem.writeSRAM(SRAM_START, 0x11);
      mem.writeSRAM(0x200, 0x22);
      mem.writeSRAM(SRAM_END, 0x33);
      expect(mem.readSRAM(SRAM_START)).toBe(0x11);
      expect(mem.readSRAM(0x200)).toBe(0x22);
      expect(mem.readSRAM(SRAM_END)).toBe(0x33);
    });

    it("SRAM_START (0x100) maps to dataMem array index 0x100", () => {
      const mem = new MemoryModel();
      mem.writeSRAM(0x100, 0x42);
      expect(mem.dataMem[0x100]).toBe(0x42);
    });

    it("write beyond data memory size should throw", () => {
      const mem = new MemoryModel();
      expect(() => mem.writeSRAM(DATA_MEM_SIZE, 0xff)).toThrow();
    });

    it("read beyond data memory size should throw", () => {
      const mem = new MemoryModel();
      expect(() => mem.readSRAM(DATA_MEM_SIZE)).toThrow();
    });

    it("negative SRAM address throws", () => {
      const mem = new MemoryModel();
      expect(() => mem.writeSRAM(-1, 0)).toThrow();
      expect(() => mem.readSRAM(-1)).toThrow();
    });
  });

  describe("EEPROM", () => {
    it("has 1024 bytes", () => {
      const mem = new MemoryModel();
      expect(mem.eeprom.length).toBe(EEPROM_SIZE);
    });

    it("write and readback values match", () => {
      const mem = new MemoryModel();
      mem.writeEEPROM(0, 0xab);
      mem.writeEEPROM(EEPROM_SIZE - 1, 0xcd);
      expect(mem.readEEPROM(0)).toBe(0xab);
      expect(mem.readEEPROM(EEPROM_SIZE - 1)).toBe(0xcd);
    });

    it("persists values across reads", () => {
      const mem = new MemoryModel();
      mem.writeEEPROM(42, 0x55);
      expect(mem.readEEPROM(42)).toBe(0x55);
      expect(mem.readEEPROM(42)).toBe(0x55);
    });

    it("write beyond EEPROM size should throw", () => {
      const mem = new MemoryModel();
      expect(() => mem.writeEEPROM(EEPROM_SIZE, 0xff)).toThrow();
    });

    it("read beyond EEPROM size should throw", () => {
      const mem = new MemoryModel();
      expect(() => mem.readEEPROM(EEPROM_SIZE)).toThrow();
    });

    it("negative EEPROM address throws", () => {
      const mem = new MemoryModel();
      expect(() => mem.writeEEPROM(-1, 0)).toThrow();
      expect(() => mem.readEEPROM(-1)).toThrow();
    });

    it("EEPROM survives simulated power cycle (reset flash/sram only)", () => {
      const mem = new MemoryModel();
      mem.writeEEPROM(0, 0x42);
      mem.flash.fill(0);
      mem.dataMem.fill(0);
      expect(mem.readEEPROM(0)).toBe(0x42);
    });
  });
});
