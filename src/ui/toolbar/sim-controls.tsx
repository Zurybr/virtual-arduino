import { useEffect, useCallback } from "react";
import type { SimulationStatus } from "../../types";

interface SimControlsProps {
  status: SimulationStatus;
  onRun: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onReset: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    backgroundColor: "#2d2d2d",
    borderBottom: "1px solid #444",
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
    transition: "background-color 0.15s",
  },
  buttonHover: {
    backgroundColor: "#505050",
  },
  buttonDisabled: {
    opacity: 0.35,
    cursor: "not-allowed",
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
  status: {
    marginLeft: "12px",
    fontSize: "12px",
    color: "#888",
    fontFamily: "monospace",
  },
  statusDot: {
    display: "inline-block",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginRight: "6px",
    verticalAlign: "middle",
  },
  separator: {
    width: "1px",
    height: "20px",
    backgroundColor: "#555",
    margin: "0 4px",
  },
};

function getDisabledState(status: SimulationStatus) {
  return {
    run: status !== "STOPPED",
    stop: status === "STOPPED",
    pause: status !== "RUNNING",
    resume: status !== "PAUSED",
    step: status !== "PAUSED",
    reset: status === "STOPPED",
  };
}

function getStatusColor(status: SimulationStatus): string {
  switch (status) {
    case "RUNNING":
      return "#4caf50";
    case "PAUSED":
      return "#ff9800";
    case "STOPPED":
      return "#888";
    case "STEPPING":
      return "#2196f3";
    case "UPLOADING":
      return "#9c27b0";
    default:
      return "#888";
  }
}

export function SimControls({
  status,
  onRun,
  onStop,
  onPause,
  onResume,
  onStep,
  onReset,
}: SimControlsProps) {
  const disabled = getDisabledState(status);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "F5" && !e.shiftKey) {
        e.preventDefault();
        if (!disabled.run) onRun();
      } else if (e.key === "F5" && e.shiftKey) {
        e.preventDefault();
        if (!disabled.stop) onStop();
      } else if (e.key === "F9") {
        e.preventDefault();
      }
    },
    [disabled, onRun, onStop],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const makeStyle = (
    base: React.CSSProperties,
    isDisabled: boolean,
  ): React.CSSProperties => ({
    ...base,
    ...(isDisabled ? styles.buttonDisabled : {}),
  });

  return (
    <div style={styles.toolbar}>
      <button
        style={makeStyle({ ...styles.button, ...styles.buttonRun }, disabled.run)}
        onClick={onRun}
        disabled={disabled.run}
        title="Run (F5)"
      >
        ▶ Run
      </button>
      <button
        style={makeStyle({ ...styles.button, ...styles.buttonStop }, disabled.stop)}
        onClick={onStop}
        disabled={disabled.stop}
        title="Stop (Shift+F5)"
      >
        ⬛ Stop
      </button>
      <div style={styles.separator} />
      <button
        style={makeStyle(styles.button, disabled.pause)}
        onClick={onPause}
        disabled={disabled.pause}
        title="Pause"
      >
        ⏸ Pause
      </button>
      <button
        style={makeStyle(styles.button, disabled.resume)}
        onClick={onResume}
        disabled={disabled.resume}
        title="Resume"
      >
        ▶ Resume
      </button>
      <button
        style={makeStyle(styles.button, disabled.step)}
        onClick={onStep}
        disabled={disabled.step}
        title="Step"
      >
        ⏭ Step
      </button>
      <div style={styles.separator} />
      <button
        style={makeStyle(styles.button, disabled.reset)}
        onClick={onReset}
        disabled={disabled.reset}
        title="Reset"
      >
        ↺ Reset
      </button>
      <span style={styles.status}>
        <span
          style={{
            ...styles.statusDot,
            backgroundColor: getStatusColor(status),
          }}
        />
        {status}
      </span>
    </div>
  );
}
