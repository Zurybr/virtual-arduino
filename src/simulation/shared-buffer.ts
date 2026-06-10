export const BUFFER_SIZE = 256;

export const FRAME_ID_OFFSET = 0;
export const BUFFER_INDEX_OFFSET = 4;
export const BUFFER_A_OFFSET = 8;
export const REGISTERS_OFFSET = 0;
export const SREG_OFFSET = 32;
export const SP_OFFSET = 34;
export const PC_OFFSET = 36;
export const SIM_STATE_OFFSET = 40;
export const DIGITAL_PINS_OFFSET = 41;
export const ANALOG_PINS_OFFSET = 71;
export const BUFFER_SIZE_EACH = 120;
export const BUFFER_B_OFFSET = BUFFER_A_OFFSET + BUFFER_SIZE_EACH;

export function createSharedBuffer(): SharedArrayBuffer {
  return new SharedArrayBuffer(BUFFER_SIZE);
}

export function getFrameId(sab: SharedArrayBuffer): number {
  return Atomics.load(new Int32Array(sab), FRAME_ID_OFFSET / 4);
}

function getReadBase(sab: SharedArrayBuffer): number {
  const bufferIndex = Atomics.load(new Int32Array(sab), BUFFER_INDEX_OFFSET / 4);
  return bufferIndex === 0 ? BUFFER_A_OFFSET : BUFFER_B_OFFSET;
}

function getWriteBase(sab: SharedArrayBuffer): number {
  const bufferIndex = Atomics.load(new Int32Array(sab), BUFFER_INDEX_OFFSET / 4);
  return bufferIndex === 0 ? BUFFER_B_OFFSET : BUFFER_A_OFFSET;
}

export function swapBuffer(sab: SharedArrayBuffer): void {
  const view = new Int32Array(sab);
  const currentBufferIndex = Atomics.load(view, BUFFER_INDEX_OFFSET / 4);
  Atomics.store(view, BUFFER_INDEX_OFFSET / 4, currentBufferIndex === 0 ? 1 : 0);
  const currentFrameId = Atomics.load(view, FRAME_ID_OFFSET / 4);
  Atomics.store(view, FRAME_ID_OFFSET / 4, currentFrameId + 1);
}

export function writeRegisters(sab: SharedArrayBuffer, regs: Uint8Array): void {
  const base = getWriteBase(sab);
  new Uint8Array(sab).set(regs, base + REGISTERS_OFFSET);
}

export function writeSimState(sab: SharedArrayBuffer, state: number): void {
  const base = getWriteBase(sab);
  new Uint8Array(sab)[base + SIM_STATE_OFFSET] = state;
}

export function writePC(sab: SharedArrayBuffer, pc: number): void {
  const base = getWriteBase(sab);
  new DataView(sab).setUint32(base + PC_OFFSET, pc, true);
}

export function readSimState(sab: SharedArrayBuffer): number {
  const base = getReadBase(sab);
  return new Uint8Array(sab)[base + SIM_STATE_OFFSET];
}

export function readPC(sab: SharedArrayBuffer): number {
  const base = getReadBase(sab);
  return new DataView(sab).getUint32(base + PC_OFFSET, true);
}

export function readRegisters(sab: SharedArrayBuffer): Uint8Array {
  const base = getReadBase(sab);
  return new Uint8Array(sab).slice(base + REGISTERS_OFFSET, base + REGISTERS_OFFSET + 32);
}

export function writeDigitalPin(sab: SharedArrayBuffer, pinIndex: number, value: number): void {
  const base = getWriteBase(sab);
  new Uint8Array(sab)[base + DIGITAL_PINS_OFFSET + pinIndex] = value;
}

export function readDigitalPin(sab: SharedArrayBuffer, pinIndex: number): number {
  const base = getReadBase(sab);
  return new Uint8Array(sab)[base + DIGITAL_PINS_OFFSET + pinIndex];
}
