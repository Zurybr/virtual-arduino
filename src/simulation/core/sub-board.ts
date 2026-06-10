import { Pin } from "./pin";
import { Wire } from "./wire";
import { PinCapability } from "../../types";

export class SubBoard {
  readonly id: string;
  name: string;
  board: import("./board").Board | null = null;
  readonly components: Map<string, unknown> = new Map();
  readonly wires: Map<string, Wire> = new Map();
  readonly externalPins: Pin[] = [];
  virtualSerialPort: string | null = null;

  private connectedBusId: string | null = null;
  private connectedPinIds: string[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  addComponent(id: string, component: unknown): void {
    this.components.set(id, component);
  }

  removeComponent(id: string): boolean {
    return this.components.delete(id);
  }

  addWire(wire: Wire): void {
    this.wires.set(wire.id, wire);
  }

  removeWire(id: string): boolean {
    return this.wires.delete(id);
  }

  addExternalPin(pin: Pin): void {
    const exists = this.externalPins.some((p) => p.id === pin.id);
    if (!exists) {
      this.externalPins.push(pin);
    }
  }

  removeExternalPin(pinId: string): void {
    const idx = this.externalPins.findIndex((p) => p.id === pinId);
    if (idx >= 0) {
      this.externalPins.splice(idx, 1);
    }
  }

  connectToBus(busId: string, externalPinIds: string[]): void {
    this.connectedBusId = busId;
    this.connectedPinIds = [...externalPinIds];
  }

  disconnectFromBus(): void {
    this.connectedBusId = null;
    this.connectedPinIds = [];
  }

  getConnectedBusId(): string | null {
    return this.connectedBusId;
  }

  getConnectedPinIds(): string[] {
    return [...this.connectedPinIds];
  }

  serialize(): object {
    return {
      id: this.id,
      name: this.name,
      components: Array.from(this.components.entries()).map(([key, val]) => ({
        id: key,
        data: val,
      })),
      wires: Array.from(this.wires.entries()).map(([key, val]) => ({
        id: key,
        data: {
          id: val.id,
          startPin: val.startPin,
          endPin: val.endPin,
          path: val.path,
          color: val.color,
        },
      })),
      externalPins: this.externalPins.map((p) => ({
        id: p.id,
        parentType: p.parentType,
        parentId: p.parentId,
        label: p.label,
        capabilities: p.capabilities,
      })),
      virtualSerialPort: this.virtualSerialPort,
      connectedBusId: this.connectedBusId,
      connectedPinIds: [...this.connectedPinIds],
    };
  }

  static deserialize(data: Record<string, unknown>): SubBoard {
    const sub = new SubBoard(data.id as string, data.name as string);

    const components = data.components as Array<{ id: string; data: unknown }>;
    if (components) {
      for (const comp of components) {
        sub.components.set(comp.id, comp.data);
      }
    }

    const wires = data.wires as Array<{
      id: string;
      data: {
        id: string;
        startPin: import("../../types").PinRef;
        endPin: import("../../types").PinRef;
        path: import("../../types").GridCoord[];
        color: string;
      };
    }>;
    if (wires) {
      for (const w of wires) {
        sub.wires.set(w.id, new Wire(w.data.id, w.data.startPin, w.data.endPin, w.data.path, w.data.color));
      }
    }

    const extPins = data.externalPins as Array<{
      id: string;
      parentType: "board" | "component";
      parentId: string;
      label: string;
      capabilities: PinCapability[];
    }>;
    if (extPins) {
      for (const ep of extPins) {
        sub.externalPins.push(new Pin(ep.id, ep.parentType, ep.parentId, ep.label, ep.capabilities));
      }
    }

    sub.virtualSerialPort = (data.virtualSerialPort as string) ?? null;
    sub.connectToBus(
      (data.connectedBusId as string) ?? "",
      (data.connectedPinIds as string[]) ?? [],
    );

    return sub;
  }

  reset(): void {
    for (const pin of this.externalPins) {
      pin.reset();
    }
    this.disconnectFromBus();
  }
}
