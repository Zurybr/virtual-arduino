import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UndoProvider, useUndo } from "../../../src/ui/undo/UndoContext";
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

/** Test component that uses the useUndo hook */
function TestConsumer() {
  const { execute, undo, redo, canUndo, canRedo, getState } = useUndo();
  return (
    <div>
      <span data-testid="can-undo">{canUndo ? "yes" : "no"}</span>
      <span data-testid="can-redo">{canRedo ? "yes" : "no"}</span>
      <button
        data-testid="btn-execute"
        onClick={() => execute(createCommand("ADD_COMPONENT", "cmd-1"))}
      >
        Execute
      </button>
      <button data-testid="btn-undo" onClick={undo}>
        Undo
      </button>
      <button data-testid="btn-redo" onClick={redo}>
        Redo
      </button>
      <span data-testid="stack-size">{getState().undoStack.length}</span>
    </div>
  );
}

describe("UndoContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides initial state with canUndo=false and canRedo=false", () => {
    render(
      <UndoProvider>
        <TestConsumer />
      </UndoProvider>,
    );

    expect(screen.getByTestId("can-undo")).toHaveTextContent("no");
    expect(screen.getByTestId("can-redo")).toHaveTextContent("no");
  });

  it("executes a command via execute and updates canUndo", () => {
    render(
      <UndoProvider>
        <TestConsumer />
      </UndoProvider>,
    );

    fireEvent.click(screen.getByTestId("btn-execute"));

    expect(screen.getByTestId("can-undo")).toHaveTextContent("yes");
    expect(screen.getByTestId("can-redo")).toHaveTextContent("no");
    expect(screen.getByTestId("stack-size")).toHaveTextContent("1");
  });

  it("undoes a command via undo and updates canRedo", () => {
    render(
      <UndoProvider>
        <TestConsumer />
      </UndoProvider>,
    );

    fireEvent.click(screen.getByTestId("btn-execute"));
    fireEvent.click(screen.getByTestId("btn-undo"));

    expect(screen.getByTestId("can-undo")).toHaveTextContent("no");
    expect(screen.getByTestId("can-redo")).toHaveTextContent("yes");
  });

  it("redoes a command via redo and updates canUndo", () => {
    render(
      <UndoProvider>
        <TestConsumer />
      </UndoProvider>,
    );

    fireEvent.click(screen.getByTestId("btn-execute"));
    fireEvent.click(screen.getByTestId("btn-undo"));
    fireEvent.click(screen.getByTestId("btn-redo"));

    expect(screen.getByTestId("can-undo")).toHaveTextContent("yes");
    expect(screen.getByTestId("can-redo")).toHaveTextContent("no");
    expect(screen.getByTestId("stack-size")).toHaveTextContent("1");
  });

  it("responds to Ctrl+Z keyboard shortcut for undo", () => {
    render(
      <UndoProvider>
        <TestConsumer />
      </UndoProvider>,
    );

    fireEvent.click(screen.getByTestId("btn-execute"));

    // Dispatch Ctrl+Z
    fireEvent.keyDown(document, { key: "z", ctrlKey: true });

    expect(screen.getByTestId("can-undo")).toHaveTextContent("no");
    expect(screen.getByTestId("can-redo")).toHaveTextContent("yes");
  });

  it("responds to Ctrl+Shift+Z keyboard shortcut for redo", () => {
    render(
      <UndoProvider>
        <TestConsumer />
      </UndoProvider>,
    );

    fireEvent.click(screen.getByTestId("btn-execute"));

    fireEvent.keyDown(document, { key: "z", ctrlKey: true });

    // Dispatch Ctrl+Shift+Z
    fireEvent.keyDown(document, { key: "z", ctrlKey: true, shiftKey: true });

    expect(screen.getByTestId("can-undo")).toHaveTextContent("yes");
    expect(screen.getByTestId("can-redo")).toHaveTextContent("no");
  });

  it("responds to Ctrl+Y keyboard shortcut for redo", () => {
    render(
      <UndoProvider>
        <TestConsumer />
      </UndoProvider>,
    );

    fireEvent.click(screen.getByTestId("btn-execute"));

    fireEvent.keyDown(document, { key: "z", ctrlKey: true });

    // Dispatch Ctrl+Y
    fireEvent.keyDown(document, { key: "y", ctrlKey: true });

    expect(screen.getByTestId("can-undo")).toHaveTextContent("yes");
    expect(screen.getByTestId("can-redo")).toHaveTextContent("no");
  });

  it("does NOT trigger undo when focus is on a text input", () => {
    render(
      <UndoProvider>
        <TestConsumer />
        <input data-testid="text-input" type="text" />
      </UndoProvider>,
    );

    fireEvent.click(screen.getByTestId("btn-execute"));

    const input = screen.getByTestId("text-input");
    input.focus();

    fireEvent.keyDown(input, { key: "z", ctrlKey: true });

    // Undo should NOT have happened — canUndo should still be "yes"
    expect(screen.getByTestId("can-undo")).toHaveTextContent("yes");
  });

  it("does NOT trigger undo when focus is on a textarea", () => {
    render(
      <UndoProvider>
        <TestConsumer />
        <textarea data-testid="textarea" />
      </UndoProvider>,
    );

    fireEvent.click(screen.getByTestId("btn-execute"));

    const textarea = screen.getByTestId("textarea");
    textarea.focus();

    fireEvent.keyDown(textarea, { key: "z", ctrlKey: true });

    // Undo should NOT have happened
    expect(screen.getByTestId("can-undo")).toHaveTextContent("yes");
  });

  it("throws error when useUndo is used outside UndoProvider", () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow();

    spy.mockRestore();
  });
});
