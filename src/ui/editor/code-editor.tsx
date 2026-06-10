import { useRef, useCallback } from "react";

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#1e1e1e",
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
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
  editorArea: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  lineNumbers: {
    padding: "8px 8px 8px 12px",
    backgroundColor: "#1e1e1e",
    color: "#555",
    fontSize: "12px",
    lineHeight: "1.6",
    textAlign: "right",
    userSelect: "none",
    minWidth: "36px",
    borderRight: "1px solid #333",
    overflow: "hidden",
  },
  textarea: {
    flex: 1,
    padding: "8px 12px",
    backgroundColor: "#1e1e1e",
    color: "#ccc",
    fontSize: "12px",
    lineHeight: "1.6",
    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
    border: "none",
    outline: "none",
    resize: "none",
    tabSize: 2,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    backgroundColor: "#252526",
    borderTop: "1px solid #333",
  },
  button: {
    padding: "3px 12px",
    backgroundColor: "#0e639c",
    border: "1px solid #1177bb",
    borderRadius: "3px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "11px",
  },
  buttonSecondary: {
    padding: "3px 12px",
    backgroundColor: "#3c3c3c",
    border: "1px solid #555",
    borderRadius: "3px",
    color: "#ccc",
    cursor: "pointer",
    fontSize: "11px",
  },
};

export function CodeEditor({ code, onCodeChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = code.split("\n").length;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newCode = code.substring(0, start) + "  " + code.substring(end);
        onCodeChange(newCode);
        requestAnimationFrame(() => {
          target.selectionStart = start + 2;
          target.selectionEnd = start + 2;
        });
      }
    },
    [code, onCodeChange],
  );

  const handleCompile = useCallback(() => {
    console.log("[Arduino Simulator] Compile requested:", code.length, "bytes");
  }, [code]);

  const handleUpload = useCallback(() => {
    console.log("[Arduino Simulator] Upload requested:", code.length, "bytes");
  }, [code]);

  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Sketch Editor</span>
      </div>
      <div style={styles.editorArea}>
        <div style={styles.lineNumbers}>
          {lines.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          style={styles.textarea}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
      <div style={styles.actions}>
        <button style={styles.button} onClick={handleCompile}>
          Compile
        </button>
        <button style={styles.buttonSecondary} onClick={handleUpload}>
          Upload
        </button>
      </div>
    </div>
  );
}
