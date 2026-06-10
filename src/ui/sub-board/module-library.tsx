import { useState } from "react";

interface ModuleEntry {
  id: string;
  name: string;
  componentCount: number;
  pinCount: number;
}

interface ModuleLibraryProps {
  modules: ModuleEntry[];
  onPlace: (moduleId: string) => void;
  onDelete: (moduleId: string) => void;
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
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: {
    fontSize: "11px",
    color: "#888",
    fontWeight: "normal",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0",
  },
  item: {
    padding: "8px 12px",
    cursor: "pointer",
    borderBottom: "1px solid #333",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "background-color 0.15s",
  },
  itemHover: {
    backgroundColor: "#2a2d2e",
  },
  itemSelected: {
    backgroundColor: "#094771",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: "#ddd",
    fontSize: "12px",
    marginBottom: "2px",
  },
  itemMeta: {
    color: "#888",
    fontSize: "11px",
  },
  itemActions: {
    display: "flex",
    gap: "4px",
  },
  actionBtn: {
    padding: "3px 8px",
    border: "1px solid #555",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "11px",
    fontFamily: "inherit",
    backgroundColor: "#3c3c3c",
    color: "#ccc",
  },
  deleteBtn: {
    borderColor: "#f44336",
    color: "#f44336",
  },
  emptyState: {
    padding: "20px",
    textAlign: "center" as const,
    color: "#666",
    fontSize: "12px",
  },
  confirmOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
  },
  confirmBox: {
    backgroundColor: "#2d2d2d",
    border: "1px solid #555",
    borderRadius: "6px",
    padding: "16px 20px",
    maxWidth: "300px",
    fontFamily: "'Consolas', 'Monaco', monospace",
    color: "#ccc",
    fontSize: "12px",
  },
  confirmText: {
    marginBottom: "12px",
  },
  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  btnDanger: {
    padding: "6px 14px",
    border: "1px solid #f44336",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "inherit",
    backgroundColor: "#f44336",
    color: "#fff",
  },
  btnCancel: {
    padding: "6px 14px",
    border: "1px solid #555",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "inherit",
    backgroundColor: "#3c3c3c",
    color: "#ccc",
  },
};

export function ModuleLibrary({ modules, onPlace, onDelete }: ModuleLibraryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleItemClick = (id: string) => {
    setSelectedId(id === selectedId ? null : id);
  };

  const handlePlace = () => {
    if (selectedId) {
      onPlace(selectedId);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      if (selectedId === deleteTarget) {
        setSelectedId(null);
      }
      setDeleteTarget(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>Module Library</span>
        <span style={styles.count}>{modules.length} modules</span>
      </div>
      <div style={styles.list}>
        {modules.length === 0 ? (
          <div style={styles.emptyState}>No saved modules</div>
        ) : (
          modules.map((mod) => (
            <div
              key={mod.id}
              style={{
                ...styles.item,
                ...(selectedId === mod.id ? styles.itemSelected : {}),
              }}
              onClick={() => handleItemClick(mod.id)}
            >
              <div style={styles.itemInfo}>
                <div style={styles.itemName}>{mod.name}</div>
                <div style={styles.itemMeta}>
                  {mod.componentCount} components / {mod.pinCount} pins
                </div>
              </div>
              <div style={styles.itemActions}>
                {selectedId === mod.id && (
                  <button style={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handlePlace(); }}>
                    Place
                  </button>
                )}
                <button
                  style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(mod.id); }}
                >
                  Del
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {deleteTarget && (
        <div style={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmText}>
              Delete module "{modules.find((m) => m.id === deleteTarget)?.name}"?
            </div>
            <div style={styles.confirmActions}>
              <button style={styles.btnCancel} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button style={styles.btnDanger} onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
