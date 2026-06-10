export class BreakpointManager {
  private _breakpoints: Set<number> = new Set();
  private _conditional: Map<number, (regs: Uint8Array) => boolean> = new Map();

  add(address: number): void {
    this._breakpoints.add(address);
  }

  remove(address: number): void {
    this._breakpoints.delete(address);
    this._conditional.delete(address);
  }

  has(address: number): boolean {
    return this._breakpoints.has(address);
  }

  clear(): void {
    this._breakpoints.clear();
    this._conditional.clear();
  }

  getAll(): number[] {
    return Array.from(this._breakpoints).sort((a, b) => a - b);
  }

  addConditional(address: number, condition: (regs: Uint8Array) => boolean): void {
    this._breakpoints.add(address);
    this._conditional.set(address, condition);
  }

  shouldBreak(address: number, regs: Uint8Array): boolean {
    if (this._breakpoints.has(address)) {
      const cond = this._conditional.get(address);
      if (cond !== undefined) {
        return cond(regs);
      }
      return true;
    }
    return false;
  }
}
