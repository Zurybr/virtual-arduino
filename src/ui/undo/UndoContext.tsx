import { createContext, useContext, useRef, useCallback, useState, useEffect } from "react";
import { CommandManager } from "./CommandManager";
import type { Command, UndoContextValue, CommandManagerState } from "./types";

interface ExtendedUndoContextValue extends UndoContextValue {
  execute: (command: Command) => void;
  getState: () => CommandManagerState;
}

const UndoContext = createContext<ExtendedUndoContextValue | null>(null);

/**
 * React context provider that wraps a CommandManager instance.
 * Handles keyboard shortcuts for undo (Ctrl+Z) and redo (Ctrl+Shift+Z / Ctrl+Y).
 * Keyboard shortcuts are DISABLED when focus is on text inputs or textareas.
 */
export function UndoProvider({ children }: { children: React.ReactNode }) {
  const managerRef = useRef<CommandManager>(new CommandManager());
  const [, forceUpdate] = useState(0);

  const triggerUpdate = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  const execute = useCallback(
    (command: Command) => {
      managerRef.current.execute(command);
      triggerUpdate();
    },
    [triggerUpdate],
  );

  const undo = useCallback(() => {
    managerRef.current.undo();
    triggerUpdate();
  }, [triggerUpdate]);

  const redo = useCallback(() => {
    managerRef.current.redo();
    triggerUpdate();
  }, [triggerUpdate]);

  const getState = useCallback(() => {
    return managerRef.current.getState();
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if focus is on a text input or textarea
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl+Z = undo (no Shift)
      if (e.key === "z" && e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y = redo
      if ((e.key === "z" && e.ctrlKey && e.shiftKey) || (e.key === "y" && e.ctrlKey)) {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const value: ExtendedUndoContextValue = {
    canUndo: managerRef.current.canUndo,
    canRedo: managerRef.current.canRedo,
    undo,
    redo,
    execute,
    getState,
  };

  return (
    <UndoContext.Provider value={value}>
      {children}
    </UndoContext.Provider>
  );
}

/**
 * Hook to access the undo/redo context.
 * Must be used within an UndoProvider.
 */
export function useUndo(): ExtendedUndoContextValue {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error("useUndo must be used within an UndoProvider");
  }
  return context;
}
