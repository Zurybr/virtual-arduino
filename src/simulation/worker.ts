import type { MainToWorkerMessage, WorkerToMainMessage } from "./worker-api";
import {
  createSharedBuffer,
  writeSimState,
  writePC,
  writeRegisters,
  swapBuffer,
} from "./shared-buffer";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
export {};

type SimState = "stopped" | "running" | "paused";

const sharedBuffer = createSharedBuffer();
let simState: SimState = "stopped";
let instructionsPerTick = 1000;
let cycleCount = 0;
let tickTimeout: ReturnType<typeof setTimeout> | null = null;
let pc = 0;
const registers = new Uint8Array(32);

function postToMain(msg: WorkerToMainMessage): void {
  ctx.postMessage(msg);
}

function handleLoadHex(): void {
  registers.fill(0);
  pc = 0;
  cycleCount = 0;
  writeSimState(sharedBuffer, 0);
  writePC(sharedBuffer, 0);
  writeRegisters(sharedBuffer, registers);
  swapBuffer(sharedBuffer);
  postToMain({ type: "hex-loaded", flashSize: 32768 });
}

function handleStart(msg: Extract<MainToWorkerMessage, { type: "start" }>): void {
  instructionsPerTick = msg.instructionsPerTick;
  simState = "running";
  writeSimState(sharedBuffer, 1);
  swapBuffer(sharedBuffer);
  runSimulation();
}

function handleStop(): void {
  simState = "stopped";
  if (tickTimeout !== null) {
    clearTimeout(tickTimeout);
    tickTimeout = null;
  }
  writeSimState(sharedBuffer, 0);
  swapBuffer(sharedBuffer);
  postToMain({ type: "stopped", cycleCount });
}

function handlePause(): void {
  if (simState !== "running") return;
  simState = "paused";
  if (tickTimeout !== null) {
    clearTimeout(tickTimeout);
    tickTimeout = null;
  }
  writeSimState(sharedBuffer, 2);
  writePC(sharedBuffer, pc);
  swapBuffer(sharedBuffer);
  postToMain({ type: "paused", reason: "user", pc, cycleCount });
}

function handleResume(): void {
  if (simState !== "paused") return;
  simState = "running";
  writeSimState(sharedBuffer, 1);
  swapBuffer(sharedBuffer);
  runSimulation();
}

function handleStep(): void {
  pc += 2;
  cycleCount++;
  writeSimState(sharedBuffer, 2);
  writePC(sharedBuffer, pc);
  writeRegisters(sharedBuffer, registers);
  swapBuffer(sharedBuffer);
  postToMain({ type: "paused", reason: "step", pc, cycleCount });
}

function handleSetBreakpoint(msg: Extract<MainToWorkerMessage, { type: "set-breakpoint" }>): void {
  postToMain({ type: "breakpoint-set", address: msg.address });
}

function handleRemoveBreakpoint(msg: Extract<MainToWorkerMessage, { type: "remove-breakpoint" }>): void {
  postToMain({ type: "breakpoint-removed", address: msg.address });
}

function handleSerialInput(): void {
  // stub
}

function handleSetPinExternal(): void {
  // stub
}

function handleRegisterComponent(): void {
  // stub
}

function handleUnregisterComponent(): void {
  // stub
}

function handleInspectState(msg: Extract<MainToWorkerMessage, { type: "inspect-state" }>): void {
  postToMain({
    type: "state-dump",
    registers: Array.from(registers),
    sreg: 0,
    sp: 0,
    pc,
    sram: msg.includeMemory ? [] : undefined,
    flash: msg.includeFlash ? [] : undefined,
  });
}

function runSimulation(): void {
  if (simState !== "running") return;

  for (let i = 0; i < instructionsPerTick; i++) {
    pc += 2;
    cycleCount++;
  }

  writePC(sharedBuffer, pc);
  writeRegisters(sharedBuffer, registers);
  swapBuffer(sharedBuffer);

  tickTimeout = setTimeout(runSimulation, 0);
}

function dispatchMessage(msg: MainToWorkerMessage): void {
  switch (msg.type) {
    case "load-hex":
      handleLoadHex();
      break;
    case "start":
      handleStart(msg);
      break;
    case "stop":
      handleStop();
      break;
    case "pause":
      handlePause();
      break;
    case "resume":
      handleResume();
      break;
    case "step":
      handleStep();
      break;
    case "set-breakpoint":
      handleSetBreakpoint(msg);
      break;
    case "remove-breakpoint":
      handleRemoveBreakpoint(msg);
      break;
    case "serial-input":
      handleSerialInput();
      break;
    case "set-pin-external":
      handleSetPinExternal();
      break;
    case "register-component":
      handleRegisterComponent();
      break;
    case "unregister-component":
      handleUnregisterComponent();
      break;
    case "inspect-state":
      handleInspectState(msg);
      break;
  }
}

ctx.postMessage({ type: "shared-buffer-init", sab: sharedBuffer });

ctx.onmessage = (e: MessageEvent): void => {
  dispatchMessage(e.data as MainToWorkerMessage);
};
