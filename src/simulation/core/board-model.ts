import { PinCapability } from "../../types";

export interface PinDefinition {
  arduinoPin: number;
  port: string;
  portBit: number;
  capabilities: PinCapability[];
  label: string;
  analogChannel?: number;
}

export interface BoardModelDefinition {
  name: string;
  flashSize: number;
  sramSize: number;
  eepromSize: number;
  clockSpeed: number;
  signature: number[];
  pinDefinitions: PinDefinition[];
}

export const ATMEGA328P: BoardModelDefinition = {
  name: "ATMEGA328P",
  flashSize: 32768,
  sramSize: 2048,
  eepromSize: 1024,
  clockSpeed: 16000000,
  signature: [0x1e, 0x95, 0x0f],
  pinDefinitions: [
    { arduinoPin: 0, port: "D", portBit: 0, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.UART], label: "D0" },
    { arduinoPin: 1, port: "D", portBit: 1, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.UART], label: "D1" },
    { arduinoPin: 2, port: "D", portBit: 2, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.EXTERNAL_INTERRUPT], label: "D2" },
    { arduinoPin: 3, port: "D", portBit: 3, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.PWM_WRITE, PinCapability.EXTERNAL_INTERRUPT], label: "D3" },
    { arduinoPin: 4, port: "D", portBit: 4, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE], label: "D4" },
    { arduinoPin: 5, port: "D", portBit: 5, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.PWM_WRITE], label: "D5" },
    { arduinoPin: 6, port: "D", portBit: 6, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.PWM_WRITE], label: "D6" },
    { arduinoPin: 7, port: "D", portBit: 7, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE], label: "D7" },
    { arduinoPin: 8, port: "B", portBit: 0, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE], label: "D8" },
    { arduinoPin: 9, port: "B", portBit: 1, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.PWM_WRITE], label: "D9" },
    { arduinoPin: 10, port: "B", portBit: 2, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.PWM_WRITE, PinCapability.SPI], label: "D10" },
    { arduinoPin: 11, port: "B", portBit: 3, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.PWM_WRITE, PinCapability.SPI], label: "D11" },
    { arduinoPin: 12, port: "B", portBit: 4, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.SPI], label: "D12" },
    { arduinoPin: 13, port: "B", portBit: 5, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.SPI], label: "D13" },
    { arduinoPin: 14, port: "C", portBit: 0, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.ANALOG_READ], label: "A0", analogChannel: 0 },
    { arduinoPin: 15, port: "C", portBit: 1, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.ANALOG_READ], label: "A1", analogChannel: 1 },
    { arduinoPin: 16, port: "C", portBit: 2, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.ANALOG_READ], label: "A2", analogChannel: 2 },
    { arduinoPin: 17, port: "C", portBit: 3, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.ANALOG_READ], label: "A3", analogChannel: 3 },
    { arduinoPin: 18, port: "C", portBit: 4, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.ANALOG_READ, PinCapability.I2C], label: "A4", analogChannel: 4 },
    { arduinoPin: 19, port: "C", portBit: 5, capabilities: [PinCapability.DIGITAL_READ, PinCapability.DIGITAL_WRITE, PinCapability.ANALOG_READ, PinCapability.I2C], label: "A5", analogChannel: 5 },
  ],
};
