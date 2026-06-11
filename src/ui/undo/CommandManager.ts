import type { Command, CommandManagerState } from "./types";

const MAX_DEPTH = 50;

/**
 * Stack-based undo/redo manager for workspace mutations.
 * Maintains separate undo and redo stacks with a maximum depth of 50.
 * When the undo stack exceeds MAX_DEPTH, the oldest entry is evicted (FIFO).
 */
export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoStackSize(): number {
    return this.undoStack.length;
  }

  get redoStackSize(): number {
    return this.redoStack.length;
  }

  /**
   * Execute a command: run its execute(), push to undo stack, clear redo stack.
   * If the undo stack exceeds MAX_DEPTH, the oldest entry is evicted.
   */
  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack = [];

    // FIFO eviction
    if (this.undoStack.length > MAX_DEPTH) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the last command: pop from undo stack, call undo(), push to redo stack.
   * Returns the undone command, or null if the undo stack is empty.
   */
  undo(): Command | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const command = this.undoStack.pop()!;
    command.undo();
    this.redoStack.push(command);
    return command;
  }

  /**
   * Redo the last undone command: pop from redo stack, call execute(), push to undo stack.
   * Returns the redone command, or null if the redo stack is empty.
   */
  redo(): Command | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const command = this.redoStack.pop()!;
    command.execute();
    this.undoStack.push(command);
    return command;
  }

  /**
   * Clear both undo and redo stacks.
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get a snapshot of the current state for UI binding.
   */
  getState(): CommandManagerState {
    return {
      undoStack: [...this.undoStack],
      redoStack: [...this.redoStack],
      canUndo: this.canUndo,
      canRedo: this.canRedo,
    };
  }
}
