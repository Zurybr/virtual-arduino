export class Timer1 {
  private tccr1a: number = 0;
  private tccr1b: number = 0;
  private tcnt1: number = 0;
  private icr1: number = 0;
  private ocr1a: number = 0;
  private ocr1b: number = 0;
  private timsk1: number = 0;
  private tifr1: number = 0;

  private pwmCallbackA: ((dutyCycle: number) => void) | null = null;
  private pwmCallbackB: ((dutyCycle: number) => void) | null = null;
  private interruptCallback: ((vector: number) => void) | null = null;

  static readonly TCCR1A_ADDR = 0x80;
  static readonly TCCR1B_ADDR = 0x81;
  static readonly TCNT1_ADDR = 0x84;
  static readonly ICR1_ADDR = 0x86;
  static readonly OCR1A_ADDR = 0x88;
  static readonly OCR1B_ADDR = 0x8A;
  static readonly TIMSK1_ADDR = 0x6F;
  static readonly TIFR1_ADDR = 0x36;

  static readonly TOIE1 = 0;
  static readonly OCIE1A = 1;
  static readonly OCIE1B = 2;

  static readonly TOV1 = 0;
  static readonly OCF1A = 1;
  static readonly OCF1B = 2;

  onPWM(channel: "A" | "B", callback: (dutyCycle: number) => void): void {
    if (channel === "A") {
      this.pwmCallbackA = callback;
    } else {
      this.pwmCallbackB = callback;
    }
  }

  onInterrupt(callback: (vector: number) => void): void {
    this.interruptCallback = callback;
  }

  readRegister(address: number): number {
    switch (address) {
      case Timer1.TCCR1A_ADDR: return this.tccr1a;
      case Timer1.TCCR1B_ADDR: return this.tccr1b;
      case Timer1.TCNT1_ADDR: return this.tcnt1 & 0xFFFF;
      case Timer1.ICR1_ADDR: return this.icr1;
      case Timer1.OCR1A_ADDR: return this.ocr1a;
      case Timer1.OCR1B_ADDR: return this.ocr1b;
      case Timer1.TIMSK1_ADDR: return this.timsk1;
      case Timer1.TIFR1_ADDR: return this.tifr1;
      default: return 0;
    }
  }

  writeRegister(address: number, value: number): void {
    switch (address) {
      case Timer1.TCCR1A_ADDR:
        this.tccr1a = value & 0xFF;
        break;
      case Timer1.TCCR1B_ADDR:
        this.tccr1b = value & 0xFF;
        break;
      case Timer1.TCNT1_ADDR:
        this.tcnt1 = value & 0xFFFF;
        break;
      case Timer1.ICR1_ADDR:
        this.icr1 = value & 0xFFFF;
        break;
      case Timer1.OCR1A_ADDR:
        this.ocr1a = value & 0xFFFF;
        break;
      case Timer1.OCR1B_ADDR:
        this.ocr1b = value & 0xFFFF;
        break;
      case Timer1.TIMSK1_ADDR:
        this.timsk1 = value & 0xFF;
        break;
      case Timer1.TIFR1_ADDR:
        this.tifr1 &= ~(value & 0xFF);
        break;
    }
  }

  private getMode(): number {
    const wgm10 = (this.tccr1a >> 0) & 1;
    const wgm11 = (this.tccr1a >> 1) & 1;
    const wgm12 = (this.tccr1b >> 3) & 1;
    const wgm13 = (this.tccr1b >> 4) & 1;
    return (wgm13 << 3) | (wgm12 << 2) | (wgm11 << 1) | wgm10;
  }

  private getPrescaler(): number {
    const cs = this.tccr1b & 0x07;
    switch (cs) {
      case 0: return 0;
      case 1: return 1;
      case 2: return 8;
      case 3: return 64;
      case 4: return 256;
      case 5: return 1024;
      case 6: return 0;
      case 7: return 0;
      default: return 0;
    }
  }

  private getTop(): number {
    const mode = this.getMode();
    switch (mode) {
      case 0: return 0xFFFF;
      case 5: return 0x00FF;
      case 6: return 0x01FF;
      case 7: return 0x03FF;
      case 4: return this.icr1;
      case 8: return this.icr1;
      case 9: return this.ocr1a;
      case 14: return this.icr1;
      case 15: return this.ocr1a;
      default: return 0xFFFF;
    }
  }

  private isFastPWM(): boolean {
    const mode = this.getMode();
    return mode === 5 || mode === 6 || mode === 7 || mode === 14 || mode === 15;
  }

  tick(cycles: number): void {
    const prescaler = this.getPrescaler();
    if (prescaler === 0) return;

    const top = this.getTop();
    const ticks = Math.floor(cycles / prescaler);
    if (ticks === 0) return;

    for (let i = 0; i < ticks; i++) {
      this.tcnt1++;

      if (this.tcnt1 > top) {
        this.tcnt1 = 0;
        this.handleOverflow();
      }

      if (this.tcnt1 === this.ocr1a) {
        this.handleCompareMatchA();
      }

      if (this.tcnt1 === this.ocr1b) {
        this.handleCompareMatchB();
      }

      if (this.tcnt1 === 0) {
        this.updatePWM();
      }
    }
  }

  private handleOverflow(): void {
    this.tifr1 |= (1 << Timer1.TOV1);
    if (this.timsk1 & (1 << Timer1.TOIE1)) {
      this.interruptCallback?.(1);
    }
  }

  private handleCompareMatchA(): void {
    this.tifr1 |= (1 << Timer1.OCF1A);
    if (this.timsk1 & (1 << Timer1.OCIE1A)) {
      this.interruptCallback?.(2);
    }
  }

  private handleCompareMatchB(): void {
    this.tifr1 |= (1 << Timer1.OCF1B);
    if (this.timsk1 & (1 << Timer1.OCIE1B)) {
      this.interruptCallback?.(3);
    }
  }

  private updatePWM(): void {
    if (!this.isFastPWM()) return;
    const top = this.getTop();
    if (top === 0) return;

    const dutyA = Math.round((this.ocr1a / top) * 255);
    this.pwmCallbackA?.(dutyA);

    const dutyB = Math.round((this.ocr1b / top) * 255);
    this.pwmCallbackB?.(dutyB);
  }

  reset(): void {
    this.tccr1a = 0;
    this.tccr1b = 0;
    this.tcnt1 = 0;
    this.icr1 = 0;
    this.ocr1a = 0;
    this.ocr1b = 0;
    this.timsk1 = 0;
    this.tifr1 = 0;
    this.pwmCallbackA = null;
    this.pwmCallbackB = null;
    this.interruptCallback = null;
  }
}
