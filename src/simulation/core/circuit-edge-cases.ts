import { BusType, PinMode, PinValue } from "../../types";
import { Circuit } from "./circuit";

interface ShortCircuitResult {
  detected: boolean;
  pins: string[];
  warning: string;
}

interface OvercurrentResult {
  detected: boolean;
  components: string[];
  warning: string;
}

interface ProtocolMismatchResult {
  detected: boolean;
  warning: string;
}

export function detectShortCircuit(circuit: Circuit): ShortCircuitResult {
  const visited = new Set<string>();
  const conflictPins: string[] = [];

  for (const wire of circuit.wires.values()) {
    const startKey = `${wire.startPin.parentId}:${wire.startPin.pinId}`;
    const endKey = `${wire.endPin.parentId}:${wire.endPin.pinId}`;

    if (visited.has(startKey) || visited.has(endKey)) continue;
    visited.add(startKey);
    visited.add(endKey);

    const startPin = circuit.board.getPin(wire.startPin.pinId);
    const endPin = circuit.board.getPin(wire.endPin.pinId);

    if (!startPin || !endPin) continue;
    if (startPin.mode !== PinMode.OUTPUT || endPin.mode !== PinMode.OUTPUT) continue;

    if (areConflictingValues(startPin.value, endPin.value)) {
      conflictPins.push(startPin.id, endPin.id);
    }
  }

  return {
    detected: conflictPins.length > 0,
    pins: conflictPins,
    warning: conflictPins.length > 0
      ? `Short circuit detected: conflicting OUTPUT pins connected (${conflictPins.join(", ")})`
      : "",
  };
}

export function detectOvercurrent(circuit: Circuit): OvercurrentResult {
  const vccPin = circuit.board.getPin("5V");
  if (!vccPin) {
    return { detected: false, components: [], warning: "" };
  }

  const supplyVoltage = vccPin.value.type === "analog" ? vccPin.value.value : 5000;
  const maxSupplyCurrent = 500;

  let totalCurrent = 0;
  const overComponents: string[] = [];

  for (const [id, component] of circuit.components) {
    const comp = component as Record<string, unknown>;
    const current = typeof comp.currentDraw === "number" ? comp.currentDraw : 0;
    totalCurrent += current;

    if (current > 0) {
      overComponents.push(id);
    }
  }

  const detected = totalCurrent > maxSupplyCurrent;

  return {
    detected,
    components: overComponents,
    warning: detected
      ? `Overcurrent: ${totalCurrent}mA exceeds supply limit of ${maxSupplyCurrent}mA at ${supplyVoltage}mV`
      : "",
  };
}

export function detectProtocolMismatch(
  wire: { startBus: BusType; endBus: BusType },
): ProtocolMismatchResult {
  if (wire.startBus === wire.endBus) {
    return { detected: false, warning: "" };
  }

  return {
    detected: true,
    warning: `Protocol mismatch: cannot connect ${wire.startBus} bus to ${wire.endBus} bus`,
  };
}

function areConflictingValues(a: PinValue, b: PinValue): boolean {
  if (a.type === "digital" && b.type === "digital") {
    return a.high !== b.high;
  }
  if (a.type === "analog" && b.type === "analog") {
    return Math.abs(a.value - b.value) > 100;
  }
  return false;
}
