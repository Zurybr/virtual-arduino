export class Timer2 {
  private tccr2a: number = 0;
  private tccr2b: number = 0;
  private tcnt2: number = 0;
  private ocr2a: number = 0;
  private ocr2b: number = 0;
  private timsk2: number = 0;
  private tifr2: number = 0;
  private assr: number = 0;

  private pwmCallbackA: ((dutyCycle: number) => void) | null = null;
  private pwmCallbackB: ((dutyCycle: number) => void) | null = null;
  private interruptCallback: ((vector: number) => void) | null = null;

  static readonly TCCR2A_ADDR = 0xB0;
  static readonly TCCR2B_ADDR = 0xB1;
  static readonly TCNT2_ADDR = 0xB2;
  static readonly OCR2A_ADDR = 0xB3;
  static readonly OCR2B_ADDR = 0xB4;
  static readonly TIMSK2_ADDR = 0x70;
  static readonly TIFR2_ADDR = 0x37;
  static readonly ASSR_ADDR = 0xB6;

  static readonly TOIE2 = 0;
  static readonly OCIE2A = 1;
  static readonly OCIE2B = 2;

  static readonly TOV2 = 0;
  static readonly OCF2A = 1;
  static readonly OCF2B = 2;

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
      case Timer2.TCCR2A_ADDR: return this.tccr2a;
      case Timer2.TCCR2B_ADDR: return this.tccr2b;
      case Timer2.TCNT2_ADDR: return this.tcnt2 & 0xFF;
      case Timer2.OCR2A_ADDR: return this.ocr2a;
      case Timer2.OCR2B_ADDR: return this.ocr2b;
      case Timer2.TIMSK2_ADDR: return this.timsk2;
      case Timer2.TIFR2_ADDR: return this.tifr2;
      case Timer2.ASSR_ADDR: return this.assr;
      default: return 0;
    }
  }

  writeRegister(address: number, value: number): void {
    switch (address) {
      case Timer2.TCCR2A_ADDR:
        this.tccr2a = value & 0xFF;
        break;
      case Timer2.TCCR2B_ADDR:
        this.tccr2b = value & 0xFF;
        break;
      case Timer2.TCNT2_ADDR:
        this.tcnt2 = value & 0xFF;
        break;
      case Timer2.OCR2A_ADDR:
        this.ocr2a = value & 0xFF;
        break;
      case Timer2.OCR2B_ADDR:
        this.ocr2b = value & 0xFF;
        break;
      case Timer2.TIMSK2_ADDR:
        this.timsk2 = value & 0xFF;
        break;
      case Timer2.TIFR2_ADDR:
        this.tifr2 &= ~(value & 0xFF);
        break;
      case Timer2.ASSR_ADDR:
        this.assr = value & 0xFF;
        break;
    }
  }

  private getMode(): number {
    const wgm20 = (this.tccr2a >> 0) & 1;
    const wgm21 = (this.tccr2a >> 1) & 1;
    const wgm22 = (this.tccr2b >> 3) & 1;
    return (wgm22 << 2) | (wgm21 << 1) | wgm20;
  }

  private getPrescaler(): number {
    const cs = this.tccr2b & 0x07;
    switch (cs) {
      case 0: return 0;
      case 1: return 1;
      case 2: return 8;
      case 3: return 32;
      case 4: return 64;
      case 5: return 128;
      case 6: return 256;
      case 7: return 1024;
      default: return 0;
    }
  }

  private getTop(): number {
    const mode = this.getMode();
    switch (mode) {
      case 0: return 0xFF;
      case 1: return 0xFF;
      case 2: return this.ocr2a;
      case 3: return 0xFF;
      case 7: return this.ocr2a;
      default: return 0xFF;
    }
  }

  private isFastPWM(): boolean {
    const mode = this.getMode();
    return mode === 3 || mode === 7;
  }

  tick(cycles: number): void {
    const prescaler = this.getPrescaler();
    if (prescaler === 0) return;

    const top = this.getTop();
    const ticks = Math.floor(cycles / prescaler);
    if (ticks === 0) return;

    for (let i = 0; i < ticks; i++) {
      this.tcnt2++;

      if (this.tcnt2 > top) {
        this.tcnt2 = 0;
        this.handleOverflow();
      }

      if (this.tcnt2 === this.ocr2a) {
        this.handleCompareMatchA();
      }

      if (this.tcnt2 === this.ocr2b) {
        this.handleCompareMatchB();
      }

      if (this.tcnt2 === 0) {
        this.updatePWM();
      }
    }
  }

  private handleOverflow(): void {
    this.tifr2 |= (1 << Timer2.TOV2);
    if (this.timsk2 & (1 << Timer2.TOIE2)) {
      this.interruptCallback?.(1);
    }
  }

  private handleCompareMatchA(): void {
    this.tifr2 |= (1 << Timer2.OCF2A);
    if (this.timsk2 & (1 << Timer2.OCIE2A)) {
      this.interruptCallback?.(2);
    }
  }

  private handleCompareMatchB(): void {
    this.tifr2 |= (1 << Timer2.OCF2B);
    if (this.timsk2 & (1 << Timer2.OCIE2B)) {
      this.interruptCallback?.(3);
    }
  }

  private updatePWM(): void {
    if (!this.isFastPWM()) return;
    const top = this.getTop();
    if (top === 0) return;

    const dutyA = Math.round((this.ocr2a / top) * 255);
    this.pwmCallbackA?.(dutyA);

    const dutyB = Math.round((this.ocr2b / top) * 255);
    this.pwmCallbackB?.(dutyB);
  }

  reset(): void {
    this.tccr2a = 0;
    this.tccr2b = 0;
    this.tcnt2 = 0;
    this.ocr2a = 0;
    this.ocr2b = 0;
    this.timsk2 = 0;
    this.tifr2 = 0;
    this.assr = 0;
    this.pwmCallbackA = null;
    this.pwmCallbackB = null;
    this.interruptCallback = null;
  }
}
