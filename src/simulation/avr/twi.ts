export class TWI {
  private twbr: number = 0;
  private twcr: number = 0;
  private twsr: number = 0xF8;
  private twdr: number = 0;
  private twar: number = 0;
  private twamr: number = 0;

  private interruptCallback: ((vector: number) => void) | null = null;
  private masterMode: boolean = false;
  private currentAddress: number = 0;
  private txBuffer: number[] = [];
  private rxBuffer: number[] = [];

  static readonly TWBR_ADDR = 0xB8;
  static readonly TWCR_ADDR = 0xBC;
  static readonly TWSR_ADDR = 0xB9;
  static readonly TWDR_ADDR = 0xBB;
  static readonly TWAR_ADDR = 0xBA;
  static readonly TWAMR_ADDR = 0xBD;

  static readonly TWINT = 7;
  static readonly TWEA = 6;
  static readonly TWSTA = 5;
  static readonly TWSTO = 4;
  static readonly TWWC = 3;
  static readonly TWEN = 2;
  static readonly TWIE = 0;

  static readonly STATUS_BUS_ERROR = 0x00;
  static readonly STATUS_START = 0x08;
  static readonly STATUS_REP_START = 0x10;
  static readonly STATUS_MT_SLA_ACK = 0x18;
  static readonly STATUS_MT_SLA_NACK = 0x20;
  static readonly STATUS_MT_DATA_ACK = 0x28;
  static readonly STATUS_MT_DATA_NACK = 0x30;
  static readonly STATUS_MR_SLA_ACK = 0x40;
  static readonly STATUS_MR_SLA_NACK = 0x48;
  static readonly STATUS_MR_DATA_ACK = 0x50;
  static readonly STATUS_MR_DATA_NACK = 0x58;

  onInterrupt(callback: (vector: number) => void): void {
    this.interruptCallback = callback;
  }

  readRegister(address: number): number {
    switch (address) {
      case TWI.TWBR_ADDR: return this.twbr;
      case TWI.TWCR_ADDR: return this.twcr;
      case TWI.TWSR_ADDR: return this.twsr;
      case TWI.TWDR_ADDR: return this.twdr;
      case TWI.TWAR_ADDR: return this.twar;
      case TWI.TWAMR_ADDR: return this.twamr;
      default: return 0;
    }
  }

  writeRegister(address: number, value: number): void {
    const v = value & 0xFF;
    switch (address) {
      case TWI.TWBR_ADDR:
        this.twbr = v;
        break;
      case TWI.TWCR_ADDR: {
        const prevTwint = (this.twcr >> TWI.TWINT) & 1;
        const newTwint = (v >> TWI.TWINT) & 1;
        this.twcr = v;
        if (prevTwint === 1 && newTwint === 0) {
          this.handleTwintClear();
        }
        break;
      }
      case TWI.TWSR_ADDR:
        this.twsr = (this.twsr & 0xFC) | (v & 0x03);
        break;
      case TWI.TWDR_ADDR:
        this.twdr = v;
        break;
      case TWI.TWAR_ADDR:
        this.twar = v;
        break;
      case TWI.TWAMR_ADDR:
        this.twamr = v;
        break;
    }
  }

  private handleTwintClear(): void {
    const twsta = (this.twcr >> TWI.TWSTA) & 1;
    const twsto = (this.twcr >> TWI.TWSTO) & 1;

    if (twsta) {
      this.masterMode = true;
      this.twsr = (this.twsr & 0x07) | TWI.STATUS_START;
      this.twcr |= (1 << TWI.TWINT);
      this.triggerInterrupt();
      return;
    }

    if (twsto) {
      this.masterMode = false;
      this.currentAddress = 0;
      this.txBuffer = [];
      this.rxBuffer = [];
      this.twsr = (this.twsr & 0x07);
      this.twcr |= (1 << TWI.TWINT);
      this.twcr &= ~(1 << TWI.TWSTO);
      return;
    }

    const upperStatus = this.twsr & 0xF8;
    switch (upperStatus) {
      case TWI.STATUS_START:
      case TWI.STATUS_REP_START: {
        const sla = this.twdr;
        this.currentAddress = sla >> 1;
        const isRead = sla & 1;
        if (isRead) {
          this.twsr = (this.twsr & 0x07) | TWI.STATUS_MR_SLA_ACK;
          this.rxBuffer = [];
        } else {
          this.twsr = (this.twsr & 0x07) | TWI.STATUS_MT_SLA_ACK;
          this.txBuffer = [];
        }
        break;
      }
      case TWI.STATUS_MT_SLA_ACK:
      case TWI.STATUS_MT_DATA_ACK: {
        this.txBuffer.push(this.twdr);
        this.twsr = (this.twsr & 0x07) | TWI.STATUS_MT_DATA_ACK;
        break;
      }
      case TWI.STATUS_MR_SLA_ACK: {
        this.twsr = (this.twsr & 0x07) | TWI.STATUS_MR_DATA_ACK;
        break;
      }
      case TWI.STATUS_MR_DATA_ACK: {
        this.rxBuffer.push(this.twdr);
        this.twsr = (this.twsr & 0x07) | TWI.STATUS_MR_DATA_ACK;
        break;
      }
    }

    this.twcr |= (1 << TWI.TWINT);
    this.triggerInterrupt();
  }

  private triggerInterrupt(): void {
    if (this.twcr & (1 << TWI.TWIE)) {
      this.interruptCallback?.(0x24);
    }
  }

  getTxBuffer(): number[] {
    return [...this.txBuffer];
  }

  getRxBuffer(): number[] {
    return [...this.rxBuffer];
  }

  isMasterMode(): boolean {
    return this.masterMode;
  }

  getCurrentAddress(): number {
    return this.currentAddress;
  }

  reset(): void {
    this.twbr = 0;
    this.twcr = 0;
    this.twsr = 0xF8;
    this.twdr = 0;
    this.twar = 0;
    this.twamr = 0;
    this.masterMode = false;
    this.currentAddress = 0;
    this.txBuffer = [];
    this.rxBuffer = [];
    this.interruptCallback = null;
  }
}
