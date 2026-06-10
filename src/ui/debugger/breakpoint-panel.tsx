import { useState, useCallback } from "react";

interface Breakpoint {
  address: number;
  sourceLocation?: string;
  enabled: boolean;
}

interface BreakpointPanelProps {
  breakpoints: Breakpoint[];
  onToggle: (address: number) => void;
  onRemove: (address: number) => void;
  onAdd: (address: number) => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#1e1e1e",
    fontFamily: "'Consolas', 'Monaco', monospace",
    fontSize: "12px",
  },
  header: {
    padding: "8px 12px",
    backgroundColor: "#2d2d2d",
    borderBottom: "1px solid #444",
    color: "#ccc",
    fontWeight: "bold",
    fontSize: "12px",
  },
  addRow: {
    display: "flex",
    padding: "6px 8px",
    borderBottom: "1px solid #333",
    gap: "4px",
  },
  input: {
    flex: 1,
    backgroundColor: "#3c3c3c",
    border: "1px solid #3e3e3e",
    color: "#d4d4d4",
    padding: "4px 8px",
    fontSize: "11px",
    fontFamily: "monospace",
    borderRadius: "2px",
    outline: "none",
  },
  addButton: {
    backgroundColor: "#0e639c",
    color: "white",
    border: "none",
    padding: "4px 10px",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "11px",
  },
  list: {
    flex: 1,
    overflowY: "auto",
  },
  row: {
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    borderBottom: "1px solid #333",
    cursor: "pointer",
  },
  rowDisabled: {
    opacity: 0.5,
  },
  address: {
    fontFamily: "monospace",
    color: "#569cd6",
    minWidth: "60px",
  },
  source: {
    color: "#6a9955",
    flex: 1,
    marginLeft: "8px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  toggleButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 6px",
    fontSize: "11px",
    borderRadius: "2px",
  },
  removeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#f44747",
    padding: "2px 6px",
    fontSize: "11px",
    borderRadius: "2px",
  },
  emptyState: {
    padding: "20px",
    textAlign: "center" as const,
    color: "#666",
  },
};

export function BreakpointPanel({
  breakpoints,
  onToggle,
  onRemove,
  onAdd,
}: BreakpointPanelProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const address = trimmed.startsWith("0x") || trimmed.startsWith("0X")
      ? parseInt(trimmed, 16)
      : parseInt(trimmed, 10);

    if (!isNaN(address) && address >= 0) {
      onAdd(address);
      setInputValue("");
    }
  }, [inputValue, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleAdd();
    },
    [handleAdd],
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>Breakpoints</div>
      <div style={styles.addRow}>
        <input
          style={styles.input}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0x0000"
        />
        <button style={styles.addButton} onClick={handleAdd}>
          Add
        </button>
      </div>
      <div style={styles.list}>
        {breakpoints.length === 0 ? (
          <div style={styles.emptyState}>No breakpoints set</div>
        ) : (
          breakpoints.map((bp) => (
            <div
              key={bp.address}
              style={{
                ...styles.row,
                ...(!bp.enabled ? styles.rowDisabled : {}),
              }}
            >
              <span style={styles.address}>
                0x{bp.address.toString(16).toUpperCase().padStart(4, "0")}
              </span>
              {bp.sourceLocation && (
                <span style={styles.source}>{bp.sourceLocation}</span>
              )}
              <button
                style={{
                  ...styles.toggleButton,
                  color: bp.enabled ? "#4caf50" : "#666",
                  backgroundColor: bp.enabled ? "#4caf5022" : "transparent",
                }}
                onClick={() => onToggle(bp.address)}
              >
                {bp.enabled ? "ON" : "OFF"}
              </button>
              <button
                style={styles.removeButton}
                onClick={() => onRemove(bp.address)}
              >
                x
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
