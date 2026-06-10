import type { PinValue } from "../types";
import type {
  WorkerToMainMessage,
  PausedMessage,
  SimulationErrorMessage,
  PluginErrorMessage,
} from "./worker-api";
import { getFrameId, readDigitalPin } from "./shared-buffer";

type PinChange = { pinId: string; value: PinValue; timestamp: number };

type ErrorMessage = SimulationErrorMessage | PluginErrorMessage;

export class SimulationBridge {
  private worker: Worker;
  private sharedBuffer: SharedArrayBuffer | null = null;
  private rafId: number | null = null;
  private previousDigitalPins: number[] = new Array(20).fill(0);
  private lastFrameId = -1;

  private pinUpdateCallbacks: Array<(changes: PinChange[]) => void> = [];
  private serialOutputCallbacks: Array<(data: Uint8Array) => void> = [];
  private pausedCallbacks: Array<(msg: PausedMessage) => void> = [];
  private errorCallbacks: Array<(error: ErrorMessage) => void> = [];

  constructor() {
    this.worker = new Worker(
      new URL("./worker.ts", import.meta.url),
      { type: "module" },
    );
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.startRAFLoop();
  }

  start(hex: string): void {
    this.worker.postMessage({ type: "load-hex", hex });
    this.worker.postMessage({ type: "start", instructionsPerTick: 1000 });
  }

  stop(): void {
    this.worker.postMessage({ type: "stop" });
  }

  pause(): void {
    this.worker.postMessage({ type: "pause" });
  }

  resume(): void {
    this.worker.postMessage({ type: "resume" });
  }

  step(): void {
    this.worker.postMessage({ type: "step", mode: "instruction" });
  }

  setBreakpoint(address: number): void {
    this.worker.postMessage({ type: "set-breakpoint", address });
  }

  removeBreakpoint(address: number): void {
    this.worker.postMessage({ type: "remove-breakpoint", address });
  }

  sendSerialData(data: Uint8Array): void {
    this.worker.postMessage({ type: "serial-input", data });
  }

  setPinExternal(pinId: string, value: PinValue): void {
    this.worker.postMessage({ type: "set-pin-external", pinId, value });
  }

  onPinUpdate(callback: (changes: PinChange[]) => void): () => void {
    this.pinUpdateCallbacks.push(callback);
    return () => {
      this.pinUpdateCallbacks = this.pinUpdateCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onSerialOutput(callback: (data: Uint8Array) => void): () => void {
    this.serialOutputCallbacks.push(callback);
    return () => {
      this.serialOutputCallbacks = this.serialOutputCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onPaused(callback: (msg: PausedMessage) => void): () => void {
    this.pausedCallbacks.push(callback);
    return () => {
      this.pausedCallbacks = this.pausedCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onError(callback: (error: ErrorMessage) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.worker.terminate();
    this.pinUpdateCallbacks = [];
    this.serialOutputCallbacks = [];
    this.pausedCallbacks = [];
    this.errorCallbacks = [];
  }

  private handleWorkerMessage(e: MessageEvent): void {
    const data = e.data;

    if (data.type === "shared-buffer-init" && data.sab) {
      this.sharedBuffer = data.sab;
      return;
    }

    const msg = data as WorkerToMainMessage;

    switch (msg.type) {
      case "pin-update":
        for (const cb of this.pinUpdateCallbacks) {
          cb(msg.changes);
        }
        break;
      case "serial-output":
        for (const cb of this.serialOutputCallbacks) {
          cb(msg.data);
        }
        break;
      case "paused":
        for (const cb of this.pausedCallbacks) {
          cb(msg);
        }
        break;
      case "simulation-error":
        for (const cb of this.errorCallbacks) {
          cb(msg);
        }
        break;
      case "plugin-error":
        for (const cb of this.errorCallbacks) {
          cb(msg);
        }
        break;
      default:
        break;
    }
  }

  private startRAFLoop(): void {
    const loop = (): void => {
      this.pollSharedBuffer();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private pollSharedBuffer(): void {
    if (!this.sharedBuffer) return;

    const frameId = getFrameId(this.sharedBuffer);
    if (frameId === this.lastFrameId) return;
    this.lastFrameId = frameId;

    const changes: PinChange[] = [];
    for (let i = 0; i < 20; i++) {
      const value = readDigitalPin(this.sharedBuffer, i);
      if (value !== this.previousDigitalPins[i]) {
        this.previousDigitalPins[i] = value;
        changes.push({
          pinId: `D${i}`,
          value: { type: "digital", high: value === 1 },
          timestamp: performance.now(),
        });
      }
    }

    if (changes.length > 0) {
      for (const cb of this.pinUpdateCallbacks) {
        cb(changes);
      }
    }
  }
}
