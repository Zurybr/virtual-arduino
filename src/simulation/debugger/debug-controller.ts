import { SimulationStatus } from "../../types";

type StatusChangeCallback = (from: SimulationStatus, to: SimulationStatus) => void;

const VALID_TRANSITIONS: Record<SimulationStatus, SimulationStatus[]> = {
  STOPPED: ["UPLOADING", "RUNNING"],
  UPLOADING: ["RUNNING", "STOPPED"],
  RUNNING: ["PAUSED", "STOPPED"],
  PAUSED: ["RUNNING", "STOPPED"],
  STEPPING: ["RUNNING", "PAUSED", "STOPPED"],
};

export class DebugController {
  private _status: SimulationStatus = "STOPPED";
  private _listeners: Set<StatusChangeCallback> = new Set();

  get status(): SimulationStatus {
    return this._status;
  }

  transition(to: SimulationStatus): void {
    if (!this.canTransition(to)) {
      throw new Error(
        `Invalid transition: ${this._status} → ${to}`
      );
    }
    const from = this._status;
    this._status = to;
    this._notify(from, to);
  }

  canTransition(to: SimulationStatus): boolean {
    const allowed = VALID_TRANSITIONS[this._status];
    return allowed !== undefined && allowed.includes(to);
  }

  isRunning(): boolean {
    return this._status === "RUNNING";
  }

  isPaused(): boolean {
    return this._status === "PAUSED";
  }

  isStopped(): boolean {
    return this._status === "STOPPED";
  }

  reset(): void {
    const from = this._status;
    this._status = "STOPPED";
    if (from !== "STOPPED") {
      this._notify(from, "STOPPED");
    }
  }

  onChange(callback: StatusChangeCallback): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }

  private _notify(from: SimulationStatus, to: SimulationStatus): void {
    for (const cb of this._listeners) {
      cb(from, to);
    }
  }
}
