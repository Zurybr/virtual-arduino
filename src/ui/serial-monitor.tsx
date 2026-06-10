import { useEffect, useRef, useState } from "react";

interface SerialMonitorProps {
  output: string[];
  onSend: (data: string) => void;
  baudRate: number;
  onClear: () => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#1a1a2e",
    borderTop: "1px solid #444",
    fontFamily: "'Consolas', 'Monaco', monospace",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 12px",
    backgroundColor: "#2d2d2d",
    borderBottom: "1px solid #444",
  },
  headerTitle: {
    color: "#ccc",
    fontSize: "12px",
    fontWeight: "bold",
  },
  baudRate: {
    color: "#888",
    fontSize: "11px",
    fontFamily: "monospace",
  },
  outputContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 12px",
    minHeight: "80px",
    maxHeight: "200px",
  },
  line: {
    color: "#0f0",
    fontSize: "12px",
    lineHeight: "1.6",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    borderTop: "1px solid #333",
    padding: "4px 8px",
    backgroundColor: "#252526",
  },
  input: {
    flex: 1,
    padding: "4px 8px",
    backgroundColor: "#1e1e1e",
    border: "1px solid #555",
    borderRadius: "3px",
    color: "#0f0",
    fontFamily: "monospace",
    fontSize: "12px",
    outline: "none",
  },
  clearButton: {
    padding: "3px 10px",
    marginLeft: "8px",
    backgroundColor: "#3c3c3c",
    border: "1px solid #555",
    borderRadius: "3px",
    color: "#ccc",
    cursor: "pointer",
    fontSize: "11px",
  },
  emptyState: {
    color: "#555",
    fontSize: "12px",
    fontStyle: "italic",
    padding: "8px 0",
  },
};

export function SerialMonitor({
  output,
  onSend,
  baudRate,
  onClear,
}: SerialMonitorProps) {
  const [inputValue, setInputValue] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      onSend(inputValue);
      setInputValue("");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Serial Monitor</span>
        <span style={styles.baudRate}>{baudRate} baud</span>
      </div>
      <div style={styles.outputContainer} ref={outputRef}>
        {output.length === 0 ? (
          <div style={styles.emptyState}>No serial output</div>
        ) : (
          output.map((line, i) => (
            <div key={i} style={styles.line}>
              {line}
            </div>
          ))
        )}
      </div>
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send data..."
        />
        <button style={styles.clearButton} onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
}
