import { describe, it, expect } from "vitest";

const SREG_I = 7;

const INTERRUPT_VECTORS: Record<string, number> = {
  RESET: 0x0000,
  INT0: 0x0001,
  INT1: 0x0002,
  TIMER0_OVF: 0x0012,
  UART_RX: 0x0018,
  TIMER1_OVF: 0x0013,
  TIMER2_OVF: 0x0015,
};

interface ISRRecord {
  vector: string;
  address: number;
  handler?: () => void;
}

class InterruptController {
  enabled: boolean = false;
  pendingInterrupts: string[] = [];
  isrTable: Map<string, ISRRecord> = new Map();
  pc: number = 0;
  savedPc: number = -1;
  stack: number[] = [];
  sreg: number = 0;
  inISR: boolean = false;

  constructor() {
    for (const [name, addr] of Object.entries(INTERRUPT_VECTORS)) {
      this.isrTable.set(name, { vector: name, address: addr });
    }
  }

  enableGlobalInterrupts(): void {
    this.enabled = true;
    this.sreg |= (1 << SREG_I);
  }

  disableGlobalInterrupts(): void {
    this.enabled = false;
    this.sreg &= ~(1 << SREG_I);
  }

  requestInterrupt(vector: string): void {
    if (!this.pendingInterrupts.includes(vector)) {
      this.pendingInterrupts.push(vector);
    }
  }

  dispatch(): boolean {
    if (!this.enabled) return false;
    if (this.inISR) return false;
    if (this.pendingInterrupts.length === 0) return false;

    const vector = this.pendingInterrupts.shift()!;
    const isr = this.isrTable.get(vector);
    if (!isr) return false;

    this.savedPc = this.pc;
    this.stack.push(this.pc);
    this.inISR = true;
    this.pc = isr.address;
    this.disableGlobalInterrupts();

    if (isr.handler) {
      isr.handler();
    }

    return true;
  }

  returnFromISR(): void {
    if (this.stack.length > 0) {
      this.pc = this.stack.pop()!;
    }
    this.inISR = false;
    this.enableGlobalInterrupts();
  }

  registerISRHandler(vector: string, handler: () => void): void {
    const isr = this.isrTable.get(vector);
    if (isr) {
      isr.handler = handler;
    }
  }
}

describe("Interrupt Controller", () => {
  describe("interrupt enable/disable", () => {
    it("global interrupt disable prevents ISR dispatch", () => {
      const ic = new InterruptController();
      ic.requestInterrupt("TIMER0_OVF");
      const dispatched = ic.dispatch();
      expect(dispatched).toBe(false);
    });

    it("global interrupt enable allows ISR dispatch", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("TIMER0_OVF");
      const dispatched = ic.dispatch();
      expect(dispatched).toBe(true);
    });

    it("enableGlobalInterrupts sets SREG I-flag", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      expect(ic.sreg & (1 << SREG_I)).toBeTruthy();
    });

    it("disableGlobalInterrupts clears SREG I-flag", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.disableGlobalInterrupts();
      expect(ic.sreg & (1 << SREG_I)).toBeFalsy();
    });

    it("interrupt enable/disable via SREG I-flag", () => {
      const ic = new InterruptController();
      expect(ic.enabled).toBe(false);

      ic.enableGlobalInterrupts();
      expect(ic.enabled).toBe(true);

      ic.disableGlobalInterrupts();
      expect(ic.enabled).toBe(false);
    });
  });

  describe("Timer0 overflow ISR", () => {
    it("fires at correct vector address", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("TIMER0_OVF");
      ic.dispatch();
      expect(ic.pc).toBe(INTERRUPT_VECTORS.TIMER0_OVF);
    });

    it("executes registered handler", () => {
      const ic = new InterruptController();
      let handlerCalled = false;
      ic.registerISRHandler("TIMER0_OVF", () => {
        handlerCalled = true;
      });
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("TIMER0_OVF");
      ic.dispatch();
      expect(handlerCalled).toBe(true);
    });
  });

  describe("UART RX ISR", () => {
    it("fires at correct vector address", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("UART_RX");
      ic.dispatch();
      expect(ic.pc).toBe(INTERRUPT_VECTORS.UART_RX);
    });
  });

  describe("external interrupt triggers", () => {
    it("INT0 fires at correct vector", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("INT0");
      ic.dispatch();
      expect(ic.pc).toBe(INTERRUPT_VECTORS.INT0);
    });

    it("INT1 fires at correct vector", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("INT1");
      ic.dispatch();
      expect(ic.pc).toBe(INTERRUPT_VECTORS.INT1);
    });
  });

  describe("ISR return restores PC from stack", () => {
    it("returnFromISR restores saved PC", () => {
      const ic = new InterruptController();
      ic.pc = 0x0050;
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("TIMER0_OVF");
      ic.dispatch();
      expect(ic.pc).toBe(INTERRUPT_VECTORS.TIMER0_OVF);

      ic.returnFromISR();
      expect(ic.pc).toBe(0x0050);
    });

    it("returnFromISR re-enables global interrupts", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("TIMER0_OVF");
      ic.dispatch();
      expect(ic.enabled).toBe(false);

      ic.returnFromISR();
      expect(ic.enabled).toBe(true);
    });

    it("returnFromISR clears inISR flag", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("TIMER0_OVF");
      ic.dispatch();
      expect(ic.inISR).toBe(true);

      ic.returnFromISR();
      expect(ic.inISR).toBe(false);
    });

    it("nested interrupts blocked while in ISR", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("TIMER0_OVF");
      ic.dispatch();

      ic.requestInterrupt("UART_RX");
      const dispatched = ic.dispatch();
      expect(dispatched).toBe(false);
    });
  });

  describe("pending interrupt queue", () => {
    it("multiple interrupts queued", () => {
      const ic = new InterruptController();
      ic.requestInterrupt("INT0");
      ic.requestInterrupt("TIMER0_OVF");
      expect(ic.pendingInterrupts.length).toBe(2);
    });

    it("interrupts dispatched in FIFO order", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      ic.requestInterrupt("INT0");
      ic.requestInterrupt("TIMER0_OVF");

      ic.dispatch();
      expect(ic.pc).toBe(INTERRUPT_VECTORS.INT0);

      ic.returnFromISR();
      ic.dispatch();
      expect(ic.pc).toBe(INTERRUPT_VECTORS.TIMER0_OVF);
    });

    it("duplicate interrupt request not queued twice", () => {
      const ic = new InterruptController();
      ic.requestInterrupt("INT0");
      ic.requestInterrupt("INT0");
      expect(ic.pendingInterrupts.length).toBe(1);
    });

    it("no dispatch when queue is empty", () => {
      const ic = new InterruptController();
      ic.enableGlobalInterrupts();
      const dispatched = ic.dispatch();
      expect(dispatched).toBe(false);
    });
  });
});
