import type { SimulationStatus } from "../../types";

export interface TopBarProps {
  circuitName: string;
  onCircuitNameChange: (name: string) => void;
  status: SimulationStatus;
  onRun: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onReset: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    alignItems: "center",
    height: "48px",
    backgroundColor: "#1a1a2e",
    borderBottom: "1px solid #333",
    padding: "0 12px",
    gap: "8px",
    flexShrink: 0,
    color: "#e0e0e0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    zIndex: 100,
  },
  nameSection: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flex: "0 0 auto",
  },
  nameInput: {
    background: "transparent",
    border: "1px solid transparent",
    color: "#e0e0e0",
    fontSize: "14px",
    fontWeight: 600,
    padding: "4px 8px",
    borderRadius: "3px",
    outline: "none",
    minWidth: "120px",
    maxWidth: "240px",
  },
  pencilIcon: {
    color: "#888",
    fontSize: "12px",
    cursor: "pointer",
  },
  centerSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    gap: "4px",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flex: "0 0 auto",
  },
  button: {
    padding: "4px 10px",
    border: "1px solid #555",
    borderRadius: "3px",
    backgroundColor: "#3c3c3c",
    color: "#ccc",
    cursor: "pointer",
    fontSize: "13px",
    lineHeight: 1,
  },
  buttonRun: {
    backgroundColor: "#2a6e2a",
    borderColor: "#3a8e3a",
    color: "#fff",
  },
  buttonStop: {
    backgroundColor: "#6e2a2a",
    borderColor: "#8e3a3a",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
  },
  separator: {
    width: "1px",
    height: "20px",
    backgroundColor: "#555",
    margin: "0 4px",
  },
  iconButton: {
    padding: "4px 8px",
    border: "none",
    borderRadius: "3px",
    backgroundColor: "transparent",
    color: "#aaa",
    cursor: "pointer",
    fontSize: "14px",
    lineHeight: 1,
  },
  exportButton: {
    padding: "4px 10px",
    border: "1px solid #555",
    borderRadius: "3px",
    backgroundColor: "#3c3c3c",
    color: "#ccc",
    cursor: "pointer",
    fontSize: "13px",
  },
};

export function TopBar({
  circuitName,
  onCircuitNameChange,
  status,
  onRun,
  onStop,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: TopBarProps) {
  const disabled = {
    run: status !== "STOPPED",
    stop: status === "STOPPED",
  };

  return (
    <div data-testid="top-bar" style={styles.root}>
      {/* Left: Circuit name */}
      <div style={styles.nameSection}>
        <input
          type="text"
          value={circuitName}
          onChange={(e) => onCircuitNameChange(e.target.value)}
          style={styles.nameInput}
          aria-label="Edit circuit name"
        />
        <span style={styles.pencilIcon}>&#9998;</span>
      </div>

      {/* Center: Simulation controls */}
      <div style={styles.centerSection}>
        <button
          style={{
            ...styles.button,
            ...styles.buttonRun,
            ...(disabled.run ? styles.buttonDisabled : {}),
          }}
          onClick={onRun}
          disabled={disabled.run}
          title="Run simulation"
        >
          ▶
        </button>
        <button
          style={{
            ...styles.button,
            ...styles.buttonStop,
            ...(disabled.stop ? styles.buttonDisabled : {}),
          }}
          onClick={onStop}
          disabled={disabled.stop}
          title="Stop simulation"
        >
          ⬛
        </button>
        <div style={styles.separator} />
        <button
          style={{
            ...styles.iconButton,
            ...(!canUndo ? styles.buttonDisabled : {}),
          }}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          style={{
            ...styles.iconButton,
            ...(!canRedo ? styles.buttonDisabled : {}),
          }}
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷
        </button>
      </div>

      {/* Right: Export/Share */}
      <div style={styles.rightSection}>
        <button style={styles.exportButton}>Export</button>
      </div>
    </div>
  );
}
