export class SPIPeripheral {
  private spcr: number = 0;
  private spsr: number = 0;
  private spdr: number = 0;

  private interruptCallback: ((vector: number) => void) | null = null;
  private exchangeCallback: ((mosi: number) => number) | null = null;

  static readonly SPCR_ADDR = 0x4C;
  static readonly SPSR_ADDR = 0x4D;
  static readonly SPDR_ADDR = 0x4E;

  static readonly SPIE = 7;
  static readonly SPE = 6;
  static readonly DORD = 5;
  static readonly MSTR = 4;
  static readonly CPOL = 3;
  static readonly CPHA = 2;
  static readonly SPR1 = 1;
  static readonly SPR0 = 0;

  static readonly SPI2X = 0;
  static readonly WCOL = 6;
  static readonly SPIF = 7;

  onInterrupt(callback: (vector: number) => void): void {
    this.interruptCallback = callback;
  }

  onExchange(callback: (mosi: number) => number): void {
    this.exchangeCallback = callback;
  }

  readRegister(address: number): number {
    switch (address) {
      case SPIPeripheral.SPCR_ADDR: return this.spcr;
      case SPIPeripheral.SPSR_ADDR: return this.spsr;
      case SPIPeripheral.SPDR_ADDR: return this.spdr;
      default: return 0;
    }
  }

  writeRegister(address: number, value: number): void {
    const v = value & 0xFF;
    switch (address) {
      case SPIPeripheral.SPCR_ADDR:
        this.spcr = v;
        break;
      case SPIPeripheral.SPSR_ADDR:
        this.spsr = v;
        break;
      case SPIPeripheral.SPDR_ADDR:
        this.spdr = v;
        this.handleDataWrite(v);
        break;
    }
  }

  private handleDataWrite(value: number): void {
    const enabled = (this.spcr >> SPIPeripheral.SPE) & 1;
    if (!enabled) return;

    const isMaster = (this.spcr >> SPIPeripheral.MSTR) & 1;
    if (isMaster) {
      if (this.exchangeCallback) {
        this.spdr = this.exchangeCallback(value);
      }
      this.spsr |= (1 << SPIPeripheral.SPIF);
      this.triggerInterrupt();
    }
  }

  private triggerInterrupt(): void {
    if (this.spcr & (1 << SPIPeripheral.SPIE)) {
      this.interruptCallback?.(0x1C);
    }
  }

  isMaster(): boolean {
    return ((this.spcr >> SPIPeripheral.MSTR) & 1) === 1;
  }

  getClockPolarity(): number {
    return (this.spcr >> SPIPeripheral.CPOL) & 1;
  }

  getClockPhase(): number {
    return (this.spcr >> SPIPeripheral.CPHA) & 1;
  }

  getDataOrder(): number {
    return (this.spcr >> SPIPeripheral.DORD) & 1;
  }

  getClockRate(): number {
    const spr = this.spcr & 0x03;
    const spi2x = (this.spsr >> SPIPeripheral.SPI2X) & 1;
    const divider = spr | (spi2x << 2);
    const rates = [4, 16, 64, 128, 2, 8, 32, 64];
    return 16000000 / (rates[divider] ?? 4);
  }

  getDataRegister(): number {
    return this.spdr;
  }

  reset(): void {
    this.spcr = 0;
    this.spsr = 0;
    this.spdr = 0;
    this.interruptCallback = null;
    this.exchangeCallback = null;
  }
}
