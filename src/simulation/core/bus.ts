import { BusType, PinValue } from "../../types";
import { Pin } from "./pin";

export type BusChangeCallback = (bus: Bus, pinId: string, value: PinValue) => void;

export abstract class Bus {
  readonly id: string;
  readonly type: BusType;
  readonly pinIds: Set<string> = new Set();

  private onChangeCallbacks: BusChangeCallback[] = [];

  constructor(id: string, type: BusType) {
    this.id = id;
    this.type = type;
  }

  abstract propagate(pinId: string, value: PinValue): void;

  registerPin(pinId: string): void {
    this.pinIds.add(pinId);
  }

  unregisterPin(pinId: string): void {
    this.pinIds.delete(pinId);
  }

  hasPin(pinId: string): boolean {
    return this.pinIds.has(pinId);
  }

  subscribe(callback: BusChangeCallback): () => void {
    this.onChangeCallbacks.push(callback);
    return () => {
      this.onChangeCallbacks = this.onChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  unsubscribe(callback: BusChangeCallback): void {
    this.onChangeCallbacks = this.onChangeCallbacks.filter((cb) => cb !== callback);
  }

  protected notifyChange(pinId: string, value: PinValue): void {
    for (const cb of this.onChangeCallbacks) {
      cb(this, pinId, value);
    }
  }
}

export class GPIOBus extends Bus {
  private pinStates: Map<string, PinValue> = new Map();
  private pins: Map<string, Pin> = new Map();

  constructor(id: string) {
    super(id, BusType.GPIO);
  }

  registerPinRef(pinId: string, pin: Pin): void {
    this.pinIds.add(pinId);
    this.pins.set(pinId, pin);
    this.pinStates.set(pinId, pin.getValue());
    pin.busId = this.id;
  }

  override registerPin(pinId: string): void {
    this.pinIds.add(pinId);
  }

  propagate(pinId: string, value: PinValue): void {
    if (value.type !== "digital" && value.type !== "floating") {
      return;
    }

    this.pinStates.set(pinId, value);

    const propagatedValue: PinValue = value.type === "digital"
      ? { type: "digital", high: value.high }
      : { type: "floating" };

    for (const [id, pin] of this.pins) {
      if (id !== pinId) {
        pin.setValue(propagatedValue);
        this.pinStates.set(id, propagatedValue);
      }
    }

    this.notifyChange(pinId, value);
  }

  getState(): Map<string, PinValue> {
    return new Map(this.pinStates);
  }
}

export class PWMBus extends Bus {
  private dutyCycle: number = 0;
  private frequency: number = 490;

  constructor(id: string) {
    super(id, BusType.PWM);
  }

  propagate(pinId: string, value: PinValue): void {
    if (value.type === "pwm") {
      this.dutyCycle = Math.max(0, Math.min(255, value.dutyCycle));
      this.frequency = value.frequency;
    } else if (value.type === "digital") {
      this.dutyCycle = value.high ? 255 : 0;
    }
    this.notifyChange(pinId, value);
  }

  setDutyCycle(dc: number): void {
    this.dutyCycle = Math.max(0, Math.min(255, dc));
  }

  setFrequency(hz: number): void {
    this.frequency = hz;
  }

  getDutyCycle(): number {
    return this.dutyCycle;
  }

  getFrequency(): number {
    return this.frequency;
  }

  getState(): { dutyCycle: number; frequency: number; pinIds: string[] } {
    return {
      dutyCycle: this.dutyCycle,
      frequency: this.frequency,
      pinIds: Array.from(this.pinIds),
    };
  }
}

export class I2CBus extends Bus {
  private _address: number = 0;
  private _sdaState: boolean = false;
  private _sclState: boolean = false;
  private _dataBuffer: number[] = [];
  private deviceAddresses: Map<number, { transmit: (data: number[]) => void; receive: () => number[] }> = new Map();

  constructor(id: string) {
    super(id, BusType.I2C);
  }

  get address(): number {
    return this._address;
  }

  get sdaState(): boolean {
    return this._sdaState;
  }

  get sclState(): boolean {
    return this._sclState;
  }

  get dataBuffer(): number[] {
    return [...this._dataBuffer];
  }

  setAddress(addr: number): void {
    if (addr < 0 || addr > 0x7F) {
      throw new Error(`Invalid I2C address: 0x${addr.toString(16)}. Must be 7-bit (0x00-0x7F)`);
    }
    this._address = addr;
  }

  registerDevice(addr: number, handlers: { transmit: (data: number[]) => void; receive: () => number[] }): void {
    this.deviceAddresses.set(addr, handlers);
  }

  unregisterDevice(addr: number): void {
    this.deviceAddresses.delete(addr);
  }

  transmit(address: number, data: number[]): void {
    if (address < 0 || address > 0x7F) {
      throw new Error(`Invalid I2C target address: 0x${address.toString(16)}`);
    }
    this.setAddress(address);
    this._dataBuffer = [...data];
    this._sdaState = true;
    this._sclState = true;
    const device = this.deviceAddresses.get(address);
    if (device) {
      device.transmit(data);
    }
    this.notifyChange("SDA", { type: "digital", high: this._sdaState });
  }

  receive(address: number): number[] {
    if (address < 0 || address > 0x7F) {
      throw new Error(`Invalid I2C target address: 0x${address.toString(16)}`);
    }
    this.setAddress(address);
    const device = this.deviceAddresses.get(address);
    if (device) {
      this._dataBuffer = device.receive();
    }
    this._sdaState = true;
    this._sclState = true;
    this.notifyChange("SDA", { type: "digital", high: this._sdaState });
    return [...this._dataBuffer];
  }

  propagate(pinId: string, value: PinValue): void {
    if (pinId === "SDA" && value.type === "digital") {
      this._sdaState = value.high;
    } else if (pinId === "SCL" && value.type === "digital") {
      this._sclState = value.high;
    }
    this.notifyChange(pinId, value);
  }

  getState(): { address: number; sdaState: boolean; sclState: boolean; dataBuffer: number[] } {
    return {
      address: this._address,
      sdaState: this._sdaState,
      sclState: this._sclState,
      dataBuffer: [...this._dataBuffer],
    };
  }
}

export class SPIBus extends Bus {
  private _clockRate: number = 1000000;
  private _mosiData: number[] = [];
  private _misoData: number[] = [];
  private _selectedSlave: number | null = null;
  private slaves: Map<number, { exchange: (mosi: number[]) => number[] }> = new Map();

  constructor(id: string) {
    super(id, BusType.SPI);
  }

  get clockRate(): number {
    return this._clockRate;
  }

  get mosiData(): number[] {
    return [...this._mosiData];
  }

  get misoData(): number[] {
    return [...this._misoData];
  }

  get selectedSlave(): number | null {
    return this._selectedSlave;
  }

  setClockRate(rate: number): void {
    this._clockRate = rate;
  }

  registerSlave(ss: number, handler: { exchange: (mosi: number[]) => number[] }): void {
    this.slaves.set(ss, handler);
  }

  unregisterSlave(ss: number): void {
    this.slaves.delete(ss);
  }

  selectSlave(ss: number): void {
    this._selectedSlave = ss;
    this.notifyChange("SS", { type: "digital", high: false });
  }

  deselectSlave(): void {
    this._selectedSlave = null;
    this.notifyChange("SS", { type: "digital", high: true });
  }

  exchange(mosi: number[]): number[] {
    this._mosiData = [...mosi];
    if (this._selectedSlave !== null) {
      const slave = this.slaves.get(this._selectedSlave);
      if (slave) {
        this._misoData = slave.exchange(mosi);
      } else {
        this._misoData = [];
      }
    } else {
      this._misoData = [];
    }
    this.notifyChange("MOSI", { type: "digital", high: true });
    return [...this._misoData];
  }

  propagate(pinId: string, value: PinValue): void {
    if (value.type === "digital") {
      switch (pinId) {
        case "MOSI":
          break;
        case "MISO":
          break;
        case "SCK":
          break;
        case "SS":
          if (!value.high && this._selectedSlave === null) {
            break;
          }
          break;
      }
    }
    this.notifyChange(pinId, value);
  }

  getState(): { clockRate: number; mosiData: number[]; misoData: number[]; selectedSlave: number | null } {
    return {
      clockRate: this._clockRate,
      mosiData: [...this._mosiData],
      misoData: [...this._misoData],
      selectedSlave: this._selectedSlave,
    };
  }
}
