import { PinMode, PinValue } from "../../types";

const SREG_BITS = ["I", "T", "H", "S", "V", "N", "Z", "C"] as const;

type SREGFlags = Record<(typeof SREG_BITS)[number], boolean>;

interface PinSnapshot {
  mode: string;
  value: string;
}

interface FullDump {
  registers: number[];
  sreg: SREGFlags;
  sp: number;
  pc: number;
}

enum SharedBufferOffset {
  REGISTERS = 0,
  REGISTERS_SIZE = 32,
  PC = 32,
  SP = 36,
  SREG = 40,
}

export class StateInspector {
  snapshotRegisters(regs: Uint8Array): number[] {
    return Array.from(regs);
  }

  snapshotSREG(sreg: number): SREGFlags {
    const flags: Partial<SREGFlags> = {};
    for (let i = 0; i < SREG_BITS.length; i++) {
      flags[SREG_BITS[i]] = ((sreg >> i) & 1) === 1;
    }
    return flags as SREGFlags;
  }

  snapshotSP(sp: number): number {
    return sp;
  }

  snapshotPC(pc: number): number {
    return pc;
  }

  snapshotPinStates(
    pins: Map<string, { mode: PinMode; value: PinValue }>
  ): Map<string, PinSnapshot> {
    const result = new Map<string, PinSnapshot>();
    for (const [id, state] of pins) {
      result.set(id, {
        mode: state.mode,
        value: this.formatPinValue(state.value),
      });
    }
    return result;
  }

  formatPinValue(value: PinValue): string {
    switch (value.type) {
      case "digital":
        return value.high ? "HIGH" : "LOW";
      case "analog":
        return String(value.value);
      case "pwm":
        return `duty=${value.dutyCycle} freq=${value.frequency}`;
      case "floating":
        return "FLOATING";
    }
  }

  fullDump(
    regs: Uint8Array,
    pc: number,
    sp: number,
    sreg: number
  ): FullDump {
    return {
      registers: this.snapshotRegisters(regs),
      sreg: this.snapshotSREG(sreg),
      sp: this.snapshotSP(sp),
      pc: this.snapshotPC(pc),
    };
  }

  writeToSharedBuffer(
    sab: SharedArrayBuffer,
    regs: Uint8Array,
    pc: number,
    sp: number,
    sreg: number
  ): void {
    const view = new DataView(sab);
    const bytes = new Uint8Array(sab);

    for (let i = 0; i < regs.length && i < SharedBufferOffset.REGISTERS_SIZE; i++) {
      bytes[SharedBufferOffset.REGISTERS + i] = regs[i];
    }

    view.setUint32(SharedBufferOffset.PC, pc, true);
    view.setUint32(SharedBufferOffset.SP, sp, true);
    view.setUint8(SharedBufferOffset.SREG, sreg);
  }
}
