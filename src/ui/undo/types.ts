/**
 * Command interface for the undo/redo system.
 * Each command captures all data needed to both perform and reverse its operation.
 */
export interface Command {
  readonly id: string;
  readonly type: CommandType;
  readonly description: string;
  execute(): void;
  undo(): void;
}

/**
 * Supported command types for workspace mutations.
 */
export type CommandType =
  | "ADD_COMPONENT"
  | "REMOVE_COMPONENT"
  | "MOVE_COMPONENT"
  | "ROTATE_COMPONENT"
  | "ADD_WIRE"
  | "REMOVE_WIRE"
  | "CHANGE_PROPERTY";

/**
 * Snapshot of the CommandManager's current state for UI binding.
 */
export interface CommandManagerState {
  undoStack: Command[];
  redoStack: Command[];
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Value exposed by the UndoContext React context.
 */
export interface UndoContextValue {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}
