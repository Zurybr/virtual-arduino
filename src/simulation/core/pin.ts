import { PinMode, PinValue, PinCapability, GridCoord } from "../../types";

export type PinChangeCallback = (pin: Pin, oldValue: PinValue, newValue: PinValue) => void;

const MODE_CAPABILITY_MAP: Record<PinMode, PinCapability[]> = {
  [PinMode.INPUT]: [PinCapability.DIGITAL_READ],
  [PinMode.OUTPUT]: [PinCapability.DIGITAL_WRITE],
  [PinMode.INPUT_PULLUP]: [PinCapability.DIGITAL_READ],
  [PinMode.PWM]: [PinCapability.PWM_WRITE],
  [PinMode.I2C_SDA]: [PinCapability.I2C],
  [PinMode.I2C_SCL]: [PinCapability.I2C],
  [PinMode.SPI_MOSI]: [PinCapability.SPI],
  [PinMode.SPI_MISO]: [PinCapability.SPI],
  [PinMode.SPI_SCK]: [PinCapability.SPI],
  [PinMode.SPI_SS]: [PinCapability.SPI],
  [PinMode.UART_RX]: [PinCapability.UART],
  [PinMode.UART_TX]: [PinCapability.UART],
  [PinMode.ANALOG]: [PinCapability.ANALOG_READ],
  [PinMode.POWER]: [PinCapability.DIGITAL_WRITE],
  [PinMode.GROUND]: [PinCapability.DIGITAL_READ],
};

export class Pin {
  readonly id: string;
  readonly parentType: "board" | "component";
  readonly parentId: string;
  readonly label: string;
  readonly capabilities: PinCapability[];
  readonly gridPosition?: GridCoord;

  mode: PinMode = PinMode.INPUT;
  value: PinValue = { type: "floating" };
  busId: string | null = null;

  private onChangeCallbacks: PinChangeCallback[] = [];

  constructor(
    id: string,
    parentType: "board" | "component",
    parentId: string,
    label: string,
    capabilities: PinCapability[],
    gridPosition?: GridCoord,
  ) {
    this.id = id;
    this.parentType = parentType;
    this.parentId = parentId;
    this.label = label;
    this.capabilities = capabilities;
    this.gridPosition = gridPosition;
  }

  setMode(mode: PinMode): void {
    const required = MODE_CAPABILITY_MAP[mode];
    const supported = required.some((cap) => this.hasCapability(cap));
    if (!supported) {
      throw new Error(`Pin ${this.id} does not support mode ${mode}`);
    }
    this.mode = mode;
  }

  setValue(value: PinValue): void {
    const oldValue = this.value;
    this.value = value;
    for (const cb of this.onChangeCallbacks) {
      cb(this, oldValue, value);
    }
  }

  getValue(): PinValue {
    return this.value;
  }

  hasCapability(cap: PinCapability): boolean {
    return this.capabilities.includes(cap);
  }

  reset(): void {
    this.mode = PinMode.INPUT;
    this.value = { type: "floating" };
    this.busId = null;
  }

  subscribe(callback: PinChangeCallback): () => void {
    this.onChangeCallbacks.push(callback);
    return () => {
      this.onChangeCallbacks = this.onChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  unsubscribe(callback: PinChangeCallback): void {
    this.onChangeCallbacks = this.onChangeCallbacks.filter((cb) => cb !== callback);
  }
}
