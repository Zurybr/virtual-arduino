import { describe, it, expect } from "vitest";
import { CommandManager } from "../../../src/ui/undo/CommandManager";
import type { Command } from "../../../src/ui/undo/types";

/** Helper: creates a simple command that records execute/undo calls */
function createCommand(type: string, id: string): Command & {
  executeCalls: number;
  undoCalls: number;
} {
  return {
    id,
    type: type as Command["type"],
    description: `Command ${id}`,
    executeCalls: 0,
    undoCalls: 0,
    execute() {
      this.executeCalls++;
    },
    undo() {
      this.undoCalls++;
    },
  };
}

describe("CommandManager", () => {
  it("executes a command and pushes it to the undo stack", () => {
    const manager = new CommandManager();
    const cmd = createCommand("ADD_COMPONENT", "cmd-1");

    manager.execute(cmd);

    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
    expect(manager.undoStackSize).toBe(1);
    expect(cmd.executeCalls).toBe(1);
  });

  it("clears redo stack when a new command is executed after undo", () => {
    const manager = new CommandManager();
    const cmd1 = createCommand("ADD_COMPONENT", "cmd-1");
    const cmd2 = createCommand("MOVE_COMPONENT", "cmd-2");

    manager.execute(cmd1);
    manager.undo();

    expect(manager.redoStackSize).toBe(1);

    manager.execute(cmd2);

    expect(manager.redoStackSize).toBe(0);
    expect(manager.canRedo).toBe(false);
  });

  it("undoes the last command and pushes it to the redo stack", () => {
    const manager = new CommandManager();
    const cmd = createCommand("ADD_COMPONENT", "cmd-1");

    manager.execute(cmd);
    const undone = manager.undo();

    expect(undone).toBe(cmd);
    expect(cmd.undoCalls).toBe(1);
    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(true);
    expect(manager.undoStackSize).toBe(0);
    expect(manager.redoStackSize).toBe(1);
  });

  it("redoes a previously undone command", () => {
    const manager = new CommandManager();
    const cmd = createCommand("ADD_COMPONENT", "cmd-1");

    manager.execute(cmd);
    manager.undo();
    const redone = manager.redo();

    expect(redone).toBe(cmd);
    expect(cmd.executeCalls).toBe(2); // original execute + redo
    expect(manager.canUndo).toBe(true);
    expect(manager.canRedo).toBe(false);
    expect(manager.undoStackSize).toBe(1);
    expect(manager.redoStackSize).toBe(0);
  });

  it("returns null when undoing with an empty undo stack", () => {
    const manager = new CommandManager();

    const result = manager.undo();

    expect(result).toBeNull();
    expect(manager.canUndo).toBe(false);
  });

  it("returns null when redoing with an empty redo stack", () => {
    const manager = new CommandManager();

    const result = manager.redo();

    expect(result).toBeNull();
    expect(manager.canRedo).toBe(false);
  });

  it("maintains correct state after multiple execute/undo/redo cycles", () => {
    const manager = new CommandManager();
    const cmd1 = createCommand("ADD_COMPONENT", "cmd-1");
    const cmd2 = createCommand("MOVE_COMPONENT", "cmd-2");
    const cmd3 = createCommand("ROTATE_COMPONENT", "cmd-3");

    manager.execute(cmd1);
    manager.execute(cmd2);
    manager.execute(cmd3);

    expect(manager.undoStackSize).toBe(3);

    manager.undo(); // undo cmd3
    manager.undo(); // undo cmd2

    expect(manager.undoStackSize).toBe(1);
    expect(manager.redoStackSize).toBe(2);

    manager.redo(); // redo cmd2

    expect(manager.undoStackSize).toBe(2);
    expect(manager.redoStackSize).toBe(1);

    manager.undo(); // undo cmd2 again
    manager.undo(); // undo cmd1

    expect(manager.canUndo).toBe(false);
    expect(manager.redoStackSize).toBe(3);
  });

  it("enforces max depth of 50 with FIFO eviction", () => {
    const manager = new CommandManager();
    const commands: Array<ReturnType<typeof createCommand>> = [];

    // Execute 51 commands
    for (let i = 0; i < 51; i++) {
      const cmd = createCommand("ADD_COMPONENT", `cmd-${i}`);
      commands.push(cmd);
      manager.execute(cmd);
    }

    // Stack should only hold 50
    expect(manager.undoStackSize).toBe(50);

    // The first command (cmd-0) should have been evicted
    // Undoing 50 times should give us cmd-50 (newest) down to cmd-1
    const firstUndo = manager.undo();
    expect(firstUndo!.id).toBe("cmd-50");

    // Undo all the way down — the last one should be cmd-1, not cmd-0
    for (let i = 0; i < 49; i++) {
      manager.undo();
    }

    const lastUndo = manager.undo();
    expect(lastUndo).toBeNull(); // already undone all 50

    // The oldest command in the stack was cmd-1 (cmd-0 was evicted)
    // After undoing 50, redo should have 50 entries
    expect(manager.redoStackSize).toBe(50);
  });

  it("clears both stacks on clear()", () => {
    const manager = new CommandManager();
    const cmd1 = createCommand("ADD_COMPONENT", "cmd-1");
    const cmd2 = createCommand("MOVE_COMPONENT", "cmd-2");

    manager.execute(cmd1);
    manager.execute(cmd2);
    manager.undo();

    manager.clear();

    expect(manager.canUndo).toBe(false);
    expect(manager.canRedo).toBe(false);
    expect(manager.undoStackSize).toBe(0);
    expect(manager.redoStackSize).toBe(0);
  });

  it("handles undo/redo correctly when redo stack is cleared by new execute", () => {
    const manager = new CommandManager();
    const cmd1 = createCommand("ADD_COMPONENT", "cmd-1");
    const cmd2 = createCommand("MOVE_COMPONENT", "cmd-2");
    const cmd3 = createCommand("ROTATE_COMPONENT", "cmd-3");

    manager.execute(cmd1);
    manager.execute(cmd2);
    manager.undo(); // undo cmd2 → redo has [cmd2]

    // New action clears redo
    manager.execute(cmd3);

    expect(manager.redoStackSize).toBe(0);

    // Redo should do nothing now
    const redone = manager.redo();
    expect(redone).toBeNull();

    // Undo should undo cmd3
    const undone = manager.undo();
    expect(undone!.id).toBe("cmd-3");
  });

  it("exposes getState for UI binding", () => {
    const manager = new CommandManager();
    const cmd = createCommand("ADD_COMPONENT", "cmd-1");

    manager.execute(cmd);

    const state = manager.getState();
    expect(state.canUndo).toBe(true);
    expect(state.canRedo).toBe(false);
    expect(state.undoStack).toHaveLength(1);
    expect(state.undoStack[0].id).toBe("cmd-1");
    expect(state.redoStack).toHaveLength(0);
  });
});
