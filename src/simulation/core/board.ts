import { PinMode, BusType } from "../../types";
import { Pin } from "./pin";
import { BoardModelDefinition } from "./board-model";
import { Bus, GPIOBus } from "./bus";

export class Board {
  readonly model: BoardModelDefinition;
  readonly pins: Map<string, Pin> = new Map();
  readonly buses: Map<string, Bus> = new Map();
  readonly flash: Uint16Array;
  readonly sram: Uint8Array;
  readonly eeprom: Uint8Array;

  private parentId: string;

  constructor(boardModel: BoardModelDefinition, parentId: string = "arduino-uno") {
    this.model = boardModel;
    this.parentId = parentId;
    this.flash = new Uint16Array(boardModel.flashSize / 2);
    this.sram = new Uint8Array(boardModel.sramSize);
    this.eeprom = new Uint8Array(boardModel.eepromSize);
    this.createPins();
    this.createBuses();
    this.createPowerPins();
  }

  private createPins(): void {
    for (const def of this.model.pinDefinitions) {
      const pin = new Pin(
        def.label,
        "board",
        this.parentId,
        def.label,
        def.capabilities,
      );
      this.pins.set(def.label, pin);
    }
  }

  private createBuses(): void {
    const portMap = new Map<string, Pin[]>();

    for (const def of this.model.pinDefinitions) {
      const pin = this.pins.get(def.label);
      if (!pin) continue;

      if (!portMap.has(def.port)) {
        portMap.set(def.port, []);
      }
      portMap.get(def.port)!.push(pin);
    }

    for (const [port, portPins] of portMap) {
      const busId = `PORT_${port}`;
      const bus = new GPIOBus(busId);
      for (const pin of portPins) {
        bus.registerPinRef(pin.id, pin);
      }
      this.buses.set(busId, bus);
    }
  }

  private createPowerPins(): void {
    const vcc = new Pin("5V", "board", this.parentId, "5V", []);
    vcc.mode = PinMode.POWER;
    vcc.value = { type: "analog", value: 5000 };
    this.pins.set("5V", vcc);

    const gnd = new Pin("GND", "board", this.parentId, "GND", []);
    gnd.mode = PinMode.GROUND;
    gnd.value = { type: "analog", value: 0 };
    this.pins.set("GND", gnd);
  }

  getPin(pinId: string): Pin | undefined {
    return this.pins.get(pinId);
  }

  getBus(busId: string): Bus | undefined {
    return this.buses.get(busId);
  }

  getBusesByType(type: BusType): Bus[] {
    const result: Bus[] = [];
    for (const bus of this.buses.values()) {
      if (bus.type === type) {
        result.push(bus);
      }
    }
    return result;
  }

  reset(): void {
    for (const pin of this.pins.values()) {
      pin.mode = PinMode.INPUT;
      pin.value = { type: "floating" };
    }

    const vcc = this.pins.get("5V");
    if (vcc) {
      vcc.mode = PinMode.POWER;
      vcc.value = { type: "analog", value: 5000 };
    }

    const gnd = this.pins.get("GND");
    if (gnd) {
      gnd.mode = PinMode.GROUND;
      gnd.value = { type: "analog", value: 0 };
    }

    this.flash.fill(0);
    this.sram.fill(0);
    this.eeprom.fill(0);
  }
}
