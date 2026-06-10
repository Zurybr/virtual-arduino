import { describe, it, expect } from "vitest";

interface CPUState {
  pc: number;
  registers: Uint8Array;
  sreg: number;
  cycles: number;
  halted: boolean;
}

const SREG_C = 0;
const SREG_Z = 1;
const SREG_N = 2;
const SREG_V = 3;
const SREG_S = 4;
const SREG_H = 5;

class ATmega328PSimulator {
  pc: number = 0;
  registers: Uint8Array = new Uint8Array(32);
  sreg: number = 0;
  cycles: number = 0;
  halted: boolean = false;
  flash: Uint16Array;

  constructor(flashSize: number = 16384) {
    this.flash = new Uint16Array(flashSize);
  }

  loadProgram(instructions: number[]): void {
    for (let i = 0; i < instructions.length; i++) {
      this.flash[i] = instructions[i];
    }
  }

  getFlag(bit: number): boolean {
    return (this.sreg & (1 << bit)) !== 0;
  }

  setFlag(bit: number, value: boolean): void {
    if (value) {
      this.sreg |= (1 << bit);
    } else {
      this.sreg &= ~(1 << bit);
    }
  }

  updateFlagsZNSForResult(result: number): void {
    this.setFlag(SREG_Z, (result & 0xff) === 0);
    this.setFlag(SREG_N, (result & 0x80) !== 0);
    const n = (result & 0x80) !== 0;
    const v = this.getFlag(SREG_V);
    this.setFlag(SREG_S, n !== v);
  }

  executeNOP(): void {
    this.pc++;
    this.cycles++;
  }

  executeLDI(rd: number, imm: number): void {
    if (rd < 16 || rd > 31) {
      throw new Error("LDI: register must be R16-R31");
    }
    this.registers[rd] = imm & 0xff;
    this.pc++;
    this.cycles++;
  }

  executeADD(rd: number, rr: number): void {
    const a = this.registers[rd];
    const b = this.registers[rr];
    const result = a + b;

    this.setFlag(SREG_H, ((a & 0x0f) + (b & 0x0f)) > 0x0f);
    this.setFlag(SREG_V, (~(a ^ b) & (a ^ result) & 0x80) !== 0);
    this.setFlag(SREG_C, result > 0xff);

    this.registers[rd] = result & 0xff;
    this.updateFlagsZNSForResult(result);
    this.pc++;
    this.cycles++;
  }

  executeSUB(rd: number, rr: number): void {
    const a = this.registers[rd];
    const b = this.registers[rr];
    const result = a - b;

    this.setFlag(SREG_H, ((~a & b) | ((~a | b) & result) & 0x08) !== 0);
    this.setFlag(SREG_V, ((a ^ b) & (a ^ result) & 0x80) !== 0);
    this.setFlag(SREG_C, a < b);

    this.registers[rd] = result & 0xff;
    this.updateFlagsZNSForResult(result);
    this.pc++;
    this.cycles++;
  }

  executeMOV(rd: number, rr: number): void {
    this.registers[rd] = this.registers[rr];
    this.pc++;
    this.cycles++;
  }

  getState(): CPUState {
    return {
      pc: this.pc,
      registers: new Uint8Array(this.registers),
      sreg: this.sreg,
      cycles: this.cycles,
      halted: this.halted,
    };
  }
}

describe("ATmega328P CPU", () => {
  describe("basic instruction execution", () => {
    it("executes NOP and advances PC by 1", () => {
      const cpu = new ATmega328PSimulator();
      expect(cpu.pc).toBe(0);
      cpu.executeNOP();
      expect(cpu.pc).toBe(1);
      expect(cpu.cycles).toBe(1);
    });

    it("executes multiple NOPs advancing PC each time", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeNOP();
      cpu.executeNOP();
      cpu.executeNOP();
      expect(cpu.pc).toBe(3);
      expect(cpu.cycles).toBe(3);
    });
  });

  describe("register file", () => {
    it("has 32 registers R0-R31", () => {
      const cpu = new ATmega328PSimulator();
      expect(cpu.registers.length).toBe(32);
    });

    it("all registers initialized to zero", () => {
      const cpu = new ATmega328PSimulator();
      for (let i = 0; i < 32; i++) {
        expect(cpu.registers[i]).toBe(0);
      }
    });
  });

  describe("LDI instruction", () => {
    it("loads immediate value to register R16-R31", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeLDI(16, 0x42);
      expect(cpu.registers[16]).toBe(0x42);
      expect(cpu.pc).toBe(1);
    });

    it("loads zero to register", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeLDI(20, 0x00);
      expect(cpu.registers[20]).toBe(0x00);
    });

    it("loads 0xFF to register", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeLDI(31, 0xff);
      expect(cpu.registers[31]).toBe(0xff);
    });

    it("throws for register below R16", () => {
      const cpu = new ATmega328PSimulator();
      expect(() => cpu.executeLDI(15, 0x42)).toThrow();
      expect(() => cpu.executeLDI(0, 0x42)).toThrow();
    });

    it("masks value to 8 bits", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeLDI(16, 0x1ff);
      expect(cpu.registers[16]).toBe(0xff);
    });
  });

  describe("ADD instruction", () => {
    it("adds two registers and stores in destination", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 10;
      cpu.registers[17] = 20;
      cpu.executeADD(16, 17);
      expect(cpu.registers[16]).toBe(30);
    });

    it("addition wraps at 255", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 200;
      cpu.registers[17] = 100;
      cpu.executeADD(16, 17);
      expect(cpu.registers[16]).toBe((300) & 0xff);
    });

    it("sets zero flag when result is zero", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 5;
      cpu.registers[17] = (256 - 5) & 0xff;
      cpu.executeADD(16, 17);
      expect(cpu.getFlag(SREG_Z)).toBe(true);
    });

    it("sets carry flag on overflow", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 200;
      cpu.registers[17] = 100;
      cpu.executeADD(16, 17);
      expect(cpu.getFlag(SREG_C)).toBe(true);
    });

    it("sets negative flag for bit 7 set", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 0x70;
      cpu.registers[17] = 0x10;
      cpu.executeADD(16, 17);
      expect(cpu.registers[16]).toBe(0x80);
      expect(cpu.getFlag(SREG_N)).toBe(true);
    });

    it("sets half-carry flag on lower nibble overflow", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 0x0f;
      cpu.registers[17] = 0x01;
      cpu.executeADD(16, 17);
      expect(cpu.getFlag(SREG_H)).toBe(true);
    });
  });

  describe("SUB instruction", () => {
    it("subtracts two registers", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 30;
      cpu.registers[17] = 10;
      cpu.executeSUB(16, 17);
      expect(cpu.registers[16]).toBe(20);
    });

    it("sets zero flag when result is zero", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 42;
      cpu.registers[17] = 42;
      cpu.executeSUB(16, 17);
      expect(cpu.getFlag(SREG_Z)).toBe(true);
      expect(cpu.registers[16]).toBe(0);
    });

    it("sets carry flag on borrow", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 5;
      cpu.registers[17] = 10;
      cpu.executeSUB(16, 17);
      expect(cpu.getFlag(SREG_C)).toBe(true);
    });

    it("sets negative flag for negative result", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 1;
      cpu.registers[17] = 2;
      cpu.executeSUB(16, 17);
      expect(cpu.getFlag(SREG_N)).toBe(true);
      expect(cpu.registers[16]).toBe(0xff);
    });
  });

  describe("MOV instruction", () => {
    it("copies register value", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[0] = 0x42;
      cpu.executeMOV(1, 0);
      expect(cpu.registers[1]).toBe(0x42);
      expect(cpu.registers[0]).toBe(0x42);
    });

    it("advances PC by 1", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeMOV(0, 1);
      expect(cpu.pc).toBe(1);
      expect(cpu.cycles).toBe(1);
    });

    it("does not affect SREG flags", () => {
      const cpu = new ATmega328PSimulator();
      cpu.sreg = 0;
      cpu.registers[5] = 0xff;
      cpu.executeMOV(6, 5);
      expect(cpu.sreg).toBe(0);
    });
  });

  describe("SREG flags", () => {
    it("Z flag set on zero result", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 5;
      cpu.registers[17] = 5;
      cpu.executeSUB(16, 17);
      expect(cpu.getFlag(SREG_Z)).toBe(true);
    });

    it("C flag set on carry", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 0xff;
      cpu.registers[17] = 0x01;
      cpu.executeADD(16, 17);
      expect(cpu.getFlag(SREG_C)).toBe(true);
    });

    it("N flag set on negative bit", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeLDI(16, 0x80);
      cpu.registers[17] = 0;
      cpu.executeADD(16, 17);
      expect(cpu.getFlag(SREG_N)).toBe(true);
    });

    it("V flag set on signed overflow", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 0x7f;
      cpu.registers[17] = 0x01;
      cpu.executeADD(16, 17);
      expect(cpu.getFlag(SREG_V)).toBe(true);
      expect(cpu.registers[16]).toBe(0x80);
    });

    it("H flag set on half-carry (BCD)", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 0x0f;
      cpu.registers[17] = 0x01;
      cpu.executeADD(16, 17);
      expect(cpu.getFlag(SREG_H)).toBe(true);
    });

    it("S flag is N XOR V", () => {
      const cpu = new ATmega328PSimulator();
      cpu.registers[16] = 0x7f;
      cpu.registers[17] = 0x01;
      cpu.executeADD(16, 17);
      const n = cpu.getFlag(SREG_N);
      const v = cpu.getFlag(SREG_V);
      expect(cpu.getFlag(SREG_S)).toBe(n !== v);
    });
  });

  describe("PC advancement", () => {
    it("PC starts at 0", () => {
      const cpu = new ATmega328PSimulator();
      expect(cpu.pc).toBe(0);
    });

    it("each instruction advances PC by 1 (single-word)", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeNOP();
      cpu.executeLDI(16, 0);
      cpu.executeMOV(0, 16);
      expect(cpu.pc).toBe(3);
    });
  });

  describe("cycle counting", () => {
    it("NOP takes 1 cycle", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeNOP();
      expect(cpu.cycles).toBe(1);
    });

    it("LDI takes 1 cycle", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeLDI(16, 0x42);
      expect(cpu.cycles).toBe(1);
    });

    it("ADD takes 1 cycle", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeADD(16, 17);
      expect(cpu.cycles).toBe(1);
    });

    it("accumulates cycles across instructions", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeNOP();
      cpu.executeNOP();
      cpu.executeLDI(16, 0);
      cpu.executeADD(16, 16);
      expect(cpu.cycles).toBe(4);
    });
  });

  describe("getState", () => {
    it("returns full CPU state snapshot", () => {
      const cpu = new ATmega328PSimulator();
      cpu.executeLDI(16, 0x42);
      const state = cpu.getState();
      expect(state.pc).toBe(1);
      expect(state.registers[16]).toBe(0x42);
      expect(state.cycles).toBe(1);
      expect(state.halted).toBe(false);
    });

    it("returned registers are a copy", () => {
      const cpu = new ATmega328PSimulator();
      const state = cpu.getState();
      state.registers[0] = 0xff;
      expect(cpu.registers[0]).toBe(0);
    });
  });
});
