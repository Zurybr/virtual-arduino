import { PinRef, PinValue } from "../../types";
import { Board } from "./board";
import { Wire } from "./wire";
import { Bus } from "./bus";

export class Circuit {
  readonly board: Board;
  readonly components: Map<string, unknown> = new Map();
  readonly wires: Map<string, Wire> = new Map();
  readonly buses: Map<string, Bus> = new Map();

  private breadboardId: string | null = null;

  constructor(board: Board) {
    this.board = board;
    for (const [id, bus] of board.buses) {
      this.buses.set(id, bus);
    }
  }

  setBreadboardId(id: string): void {
    this.breadboardId = id;
  }

  addComponent(id: string, component: unknown): void {
    this.components.set(id, component);
  }

  removeComponent(id: string): boolean {
    return this.components.delete(id);
  }

  addWire(wire: Wire): void {
    wire.validate();
    this.wires.set(wire.id, wire);
  }

  removeWire(id: string): boolean {
    return this.wires.delete(id);
  }

  resolveNet(pinRef: PinRef): Set<PinRef> {
    const visited = new Set<string>();
    const result = new Set<PinRef>();
    const queue: PinRef[] = [pinRef];

    const toKey = (ref: PinRef) => `${ref.parentType}:${ref.parentId}:${ref.pinId}`;

    while (queue.length > 0) {
      const current = queue.pop()!;
      const key = toKey(current);

      if (visited.has(key)) continue;
      visited.add(key);
      result.add(current);

      const connected = this.findConnectedPins(current);
      for (const ref of connected) {
        if (!visited.has(toKey(ref))) {
          queue.push(ref);
        }
      }
    }

    return result;
  }

  propagate(pinRef: PinRef, value: PinValue): void {
    const net = this.resolveNet(pinRef);

    for (const ref of net) {
      if (ref.parentType === "board") {
        const pin = this.board.getPin(ref.pinId);
        if (pin) {
          pin.setValue(value);
          if (pin.busId) {
            const bus = this.buses.get(pin.busId);
            if (bus) {
              bus.propagate(pin.id, value);
            }
          }
        }
      }
    }
  }

  private findConnectedPins(pinRef: PinRef): PinRef[] {
    const connected: PinRef[] = [];

    for (const wire of this.wires.values()) {
      if (this.refMatches(wire.startPin, pinRef)) {
        connected.push({ ...wire.endPin });
      } else if (this.refMatches(wire.endPin, pinRef)) {
        connected.push({ ...wire.startPin });
      }
    }

    if (pinRef.parentType === "component" && pinRef.parentId === this.breadboardId) {
      const breadboardConnected = this.getBreadboardConnections(pinRef.pinId);
      for (const pinId of breadboardConnected) {
        connected.push({
          parentId: pinRef.parentId,
          pinId,
          parentType: "component",
        });
      }
    }

    return connected;
  }

  private refMatches(a: PinRef, b: PinRef): boolean {
    return a.parentId === b.parentId && a.pinId === b.pinId && a.parentType === b.parentType;
  }

  private getBreadboardConnections(pinId: string): string[] {
    const match = pinId.match(/^([a-j])(\d+)$/);
    if (!match) return [];

    const row = match[1];
    const col = match[2];
    const connections: string[] = [];

    const group = "abcde".includes(row)
      ? ["a", "b", "c", "d", "e"]
      : ["f", "g", "h", "i", "j"];

    for (const r of group) {
      if (r !== row) {
        connections.push(`${r}${col}`);
      }
    }

    return connections;
  }
}
