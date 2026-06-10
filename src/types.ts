export enum PinMode {
  INPUT = "INPUT",
  OUTPUT = "OUTPUT",
  INPUT_PULLUP = "INPUT_PULLUP",
  PWM = "PWM",
  I2C_SDA = "I2C_SDA",
  I2C_SCL = "I2C_SCL",
  SPI_MOSI = "SPI_MOSI",
  SPI_MISO = "SPI_MISO",
  SPI_SCK = "SPI_SCK",
  SPI_SS = "SPI_SS",
  UART_RX = "UART_RX",
  UART_TX = "UART_TX",
  ANALOG = "ANALOG",
  POWER = "POWER",
  GROUND = "GROUND",
}

export type PinValue =
  | { type: "digital"; high: boolean }
  | { type: "analog"; value: number }
  | { type: "pwm"; dutyCycle: number; frequency: number }
  | { type: "floating" };

export enum PinCapability {
  DIGITAL_READ = "DIGITAL_READ",
  DIGITAL_WRITE = "DIGITAL_WRITE",
  ANALOG_READ = "ANALOG_READ",
  PWM_WRITE = "PWM_WRITE",
  I2C = "I2C",
  SPI = "SPI",
  UART = "UART",
  EXTERNAL_INTERRUPT = "EXTERNAL_INTERRUPT",
}

export interface PinRef {
  parentId: string;
  pinId: string;
  parentType: "board" | "component";
}

export interface GridCoord {
  row: number;
  col: number;
}

export enum BusType {
  GPIO = "GPIO",
  PWM = "PWM",
  UART = "UART",
  I2C = "I2C",
  SPI = "SPI",
}

export type SimulationStatus =
  | "STOPPED"
  | "RUNNING"
  | "PAUSED"
  | "STEPPING"
  | "UPLOADING";

export interface SourceLocation {
  file: string;
  line: number;
  column?: number;
  isUserCode: boolean;
}

export interface SimulationError {
  type: "memory" | "power" | "short-circuit" | "protocol-mismatch" | "plugin-crash" | "upload-replace";
  message: string;
  affectedPins?: string[];
  severity: "warning" | "error";
}

export type PluginCategory =
  | "basic"
  | "sensor"
  | "actuator"
  | "display"
  | "ic"
  | "communication"
  | "power";

export type PinType =
  | "power"
  | "ground"
  | "digital-input"
  | "digital-output"
  | "analog-input"
  | "analog-output"
  | "pwm"
  | "i2c-sda"
  | "i2c-scl"
  | "spi-mosi"
  | "spi-miso"
  | "spi-sck"
  | "spi-ss"
  | "uart-rx"
  | "uart-tx";

export type ProtocolType = "gpio" | "i2c" | "spi" | "uart" | "pwm";

export interface HardwareSpec {
  pins: Array<{
    id: string;
    type: PinType;
    label: string;
    voltage?: number;
  }>;
  power: {
    minVoltage: number;
    maxVoltage: number;
    typicalCurrent: string;
  };
  protocols: ProtocolType[];
}

export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  license: string;
  engines: {
    simulator: string;
    pluginApi: string;
  };
  hardware: HardwareSpec;
  assets: {
    icon: string;
    schematic?: string;
  };
  main: string;
  permissions: string[];
  category: PluginCategory;
  tags: string[];
  checksum?: string;
}

export interface ComponentPlugin {
  readonly id: string;
  init(context: PluginContext): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
  onPinChange(pinId: string, value: PinValue): void;
  onSerialData?(data: Uint8Array): void;
  render?(): PluginUIResult;
}

export interface PluginContext {
  pluginId: string;
  manifest: PluginManifest;
  logger: PluginLogger;
  emit(event: string, data: unknown): void;
  on(event: string, handler: (data: unknown) => void): () => void;
  requestPinAccess(pins: PinRequest[]): Promise<PinAccess>;
}

export interface PluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface PinRequest {
  pinId: string;
  mode: "read" | "write";
}

export interface PinAccess {
  pins: Record<
    string,
    {
      read(): PinValue;
      write(value: PinValue): void;
      onChange(callback: (value: PinValue) => void): () => void;
    }
  >;
}

export interface PluginUIResult {
  element: string;
  style?: string;
}

export interface GridSection {
  section: "terminal-left" | "terminal-right" | "power-top" | "power-bottom";
}

export type PinTypeString =
  | "power"
  | "ground"
  | "digital-input"
  | "digital-output"
  | "analog-input"
  | "analog-output"
  | "pwm"
  | "i2c-sda"
  | "i2c-scl"
  | "spi-mosi"
  | "spi-miso"
  | "spi-sck"
  | "spi-ss"
  | "uart-rx"
  | "uart-tx";
