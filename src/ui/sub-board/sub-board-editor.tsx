import { useState } from "react";
import { SubBoard } from "../../simulation/core/sub-board";

interface SubBoardEditorProps {
  subBoard: SubBoard | null;
  onSave: (subBoard: SubBoard) => void;
  onClose: () => void;
}

interface ComponentEntry {
  id: string;
  type: string;
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  container: {
    width: "80%",
    maxWidth: "900px",
    height: "70vh",
    backgroundColor: "#1e1e1e",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Consolas', 'Monaco', monospace",
    color: "#ccc",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    backgroundColor: "#2d2d2d",
    borderBottom: "1px solid #444",
  },
  title: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#ddd",
  },
  headerActions: {
    display: "flex",
    gap: "8px",
  },
  body: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  canvas: {
    flex: 1,
    backgroundColor: "#252526",
    padding: "16px",
    overflow: "auto",
    position: "relative",
  },
  sidebar: {
    width: "240px",
    backgroundColor: "#2d2d2d",
    borderLeft: "1px solid #444",
    overflow: "auto",
    padding: "12px",
  },
  sidebarSection: {
    marginBottom: "16px",
  },
  sidebarTitle: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
    letterSpacing: "0.5px",
  },
  pinRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
    padding: "4px 0",
  },
  pinLabel: {
    fontSize: "12px",
    color: "#ccc",
    flex: 1,
  },
  checkbox: {
    accentColor: "#007acc",
  },
  button: {
    padding: "6px 14px",
    border: "1px solid #555",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "inherit",
  },
  btnPrimary: {
    backgroundColor: "#0e639c",
    color: "#fff",
    borderColor: "#0e639c",
  },
  btnSecondary: {
    backgroundColor: "#3c3c3c",
    color: "#ccc",
  },
  btnSuccess: {
    backgroundColor: "#2ea043",
    color: "#fff",
    borderColor: "#2ea043",
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#666",
    fontSize: "13px",
  },
  componentItem: {
    padding: "6px 8px",
    backgroundColor: "#3c3c3c",
    borderRadius: "3px",
    marginBottom: "4px",
    fontSize: "12px",
    color: "#ccc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  removeBtn: {
    background: "none",
    border: "none",
    color: "#f44336",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0 4px",
  },
  input: {
    width: "100%",
    padding: "4px 8px",
    backgroundColor: "#1e1e1e",
    border: "1px solid #555",
    borderRadius: "3px",
    color: "#ccc",
    fontSize: "12px",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
    marginBottom: "8px",
  },
};

export function SubBoardEditor({ subBoard, onSave, onClose }: SubBoardEditorProps) {
  const [name, setName] = useState(subBoard?.name ?? "New Module");
  const [components] = useState<ComponentEntry[]>(
    subBoard
      ? Array.from(subBoard.components.entries()).map(([id, _val]) => ({
          id,
          type: "component",
        }))
      : [],
  );
  const [externalPinIds, setExternalPinIds] = useState<Set<string>>(
    new Set(subBoard ? subBoard.externalPins.map((p) => p.id) : []),
  );

  if (!subBoard) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.container}>
          <div style={styles.emptyState}>No sub-board selected</div>
        </div>
      </div>
    );
  }

  const toggleExternalPin = (pinId: string) => {
    setExternalPinIds((prev) => {
      const next = new Set(prev);
      if (next.has(pinId)) {
        next.delete(pinId);
      } else {
        next.add(pinId);
      }
      return next;
    });
  };

  const handleSave = () => {
    subBoard.name = name;
    onSave(subBoard);
  };

  const allPins = subBoard.externalPins.map((p) => p.id);

  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>Sub-Board Editor</span>
          <div style={styles.headerActions}>
            <button
              style={{ ...styles.button, ...styles.btnSuccess }}
              onClick={handleSave}
            >
              Save as Module
            </button>
            <button
              style={{ ...styles.button, ...styles.btnSecondary }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
        <div style={styles.body}>
          <div style={styles.canvas}>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Module name"
            />
            <div style={{ color: "#666", fontSize: "12px" }}>
              Components: {components.length} | Wires: {subBoard.wires.size}
            </div>
          </div>
          <div style={styles.sidebar}>
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarTitle}>External Pins</div>
              {allPins.length === 0 ? (
                <div style={{ color: "#666", fontSize: "11px" }}>No pins available</div>
              ) : (
                allPins.map((pinId) => (
                  <div key={pinId} style={styles.pinRow}>
                    <span style={styles.pinLabel}>{pinId}</span>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      checked={externalPinIds.has(pinId)}
                      onChange={() => toggleExternalPin(pinId)}
                    />
                  </div>
                ))
              )}
            </div>
            <div style={styles.sidebarSection}>
              <div style={styles.sidebarTitle}>Components</div>
              {components.map((comp) => (
                <div key={comp.id} style={styles.componentItem}>
                  <span>{comp.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
