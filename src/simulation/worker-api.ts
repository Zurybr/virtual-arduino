import type { PinValue, SourceLocation, SimulationError } from "../types";

export interface LoadHexMessage {
  type: "load-hex";
  hex: string;
  sourceMap?: Record<number, SourceLocation>;
}

export interface StartMessage {
  type: "start";
  instructionsPerTick: number;
}

export interface StopMessage {
  type: "stop";
}

export interface PauseMessage {
  type: "pause";
}

export interface ResumeMessage {
  type: "resume";
}

export interface StepMessage {
  type: "step";
  mode: "instruction" | "source-line";
}

export interface SetBreakpointMessage {
  type: "set-breakpoint";
  address: number;
}

export interface RemoveBreakpointMessage {
  type: "remove-breakpoint";
  address: number;
}

export interface SerialInputMessage {
  type: "serial-input";
  data: Uint8Array;
}

export interface SetPinExternalMessage {
  type: "set-pin-external";
  pinId: string;
  value: PinValue;
}

export interface RegisterComponentMessage {
  type: "register-component";
  componentId: string;
  pluginName: string;
  pinMapping: Record<string, string>;
}

export interface UnregisterComponentMessage {
  type: "unregister-component";
  componentId: string;
}

export interface InspectStateMessage {
  type: "inspect-state";
  includeMemory: boolean;
  includeFlash: boolean;
}

export type MainToWorkerMessage =
  | LoadHexMessage
  | StartMessage
  | StopMessage
  | PauseMessage
  | ResumeMessage
  | StepMessage
  | SetBreakpointMessage
  | RemoveBreakpointMessage
  | SerialInputMessage
  | SetPinExternalMessage
  | RegisterComponentMessage
  | UnregisterComponentMessage
  | InspectStateMessage;

export interface PinUpdateMessage {
  type: "pin-update";
  changes: Array<{ pinId: string; value: PinValue; timestamp: number }>;
}

export interface SerialOutputMessage {
  type: "serial-output";
  data: Uint8Array;
}

export interface PausedMessage {
  type: "paused";
  reason: "user" | "breakpoint" | "step" | "error";
  pc: number;
  cycleCount: number;
  sourceLocation?: SourceLocation;
  error?: string;
}

export interface SimulationErrorMessage {
  type: "simulation-error";
  error: SimulationError;
}

export interface PluginErrorMessage {
  type: "plugin-error";
  componentId: string;
  pluginName: string;
  error: string;
  state: "unhealthy";
}

export interface HexLoadedMessage {
  type: "hex-loaded";
  flashSize: number;
}

export interface StoppedMessage {
  type: "stopped";
  cycleCount: number;
}

export interface BreakpointSetMessage {
  type: "breakpoint-set";
  address: number;
}

export interface BreakpointRemovedMessage {
  type: "breakpoint-removed";
  address: number;
}

export interface StateDumpMessage {
  type: "state-dump";
  registers: number[];
  sreg: number;
  sp: number;
  pc: number;
  sram?: number[];
  flash?: number[];
}

export type WorkerToMainMessage =
  | PinUpdateMessage
  | SerialOutputMessage
  | PausedMessage
  | SimulationErrorMessage
  | PluginErrorMessage
  | HexLoadedMessage
  | StoppedMessage
  | BreakpointSetMessage
  | BreakpointRemovedMessage
  | StateDumpMessage;
