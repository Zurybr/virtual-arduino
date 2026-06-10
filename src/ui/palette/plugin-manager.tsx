import { useState } from "react";

interface InstalledPlugin {
  name: string;
  displayName: string;
  version: string;
  category: string;
}

interface PluginManagerProps {
  installedPlugins: InstalledPlugin[];
  onInstall: (zipPath: string) => void;
  onUninstall: (pluginName: string) => void;
  isInstalling: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  basic: "Basic",
  sensor: "Sensors",
  actuator: "Actuators",
  display: "Displays",
  ic: "ICs",
  communication: "Communication",
  power: "Power",
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#252526",
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderBottom: "1px solid #444",
    backgroundColor: "#2d2d2d",
  },
  title: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#ccc",
    margin: 0,
  },
  installBtn: {
    padding: "5px 12px",
    fontSize: "12px",
    backgroundColor: "#0e639c",
    color: "#fff",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  installBtnDisabled: {
    padding: "5px 12px",
    fontSize: "12px",
    backgroundColor: "#3c3c3c",
    color: "#888",
    border: "none",
    borderRadius: "3px",
    cursor: "not-allowed",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  spinner: {
    width: "12px",
    height: "12px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.6s linear infinite",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0",
  },
  pluginItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderBottom: "1px solid #333",
    transition: "background-color 0.15s",
  },
  pluginInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    minWidth: 0,
  },
  pluginName: {
    fontSize: "12px",
    color: "#ccc",
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  pluginMeta: {
    fontSize: "11px",
    color: "#888",
    display: "flex",
    gap: "8px",
  },
  categoryBadge: {
    padding: "1px 6px",
    borderRadius: "3px",
    backgroundColor: "#3c3c3c",
    color: "#aaa",
    fontSize: "10px",
    textTransform: "uppercase",
  },
  uninstallBtn: {
    padding: "3px 8px",
    fontSize: "11px",
    backgroundColor: "transparent",
    color: "#888",
    border: "1px solid #555",
    borderRadius: "3px",
    cursor: "pointer",
    marginLeft: "8px",
    flexShrink: 0,
  },
  emptyState: {
    padding: "24px 12px",
    textAlign: "center",
    color: "#666",
    fontSize: "12px",
  },
  installingOverlay: {
    padding: "12px",
    textAlign: "center",
    color: "#aaa",
    fontSize: "12px",
    borderBottom: "1px solid #444",
    backgroundColor: "#2a2d2e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
};

export function PluginManager({
  installedPlugins,
  onInstall,
  onUninstall,
  isInstalling,
}: PluginManagerProps) {
  const [zipPathInput, setZipPathInput] = useState("");

  const handleInstallClick = () => {
    if (isInstalling) return;
    const path = zipPathInput.trim() || window.prompt("Enter path to plugin .zip file:");
    if (path) {
      onInstall(path);
      setZipPathInput("");
    }
  };

  const handleUninstall = (pluginName: string, displayName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to uninstall "${displayName}"?`,
    );
    if (confirmed) {
      onUninstall(pluginName);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.header}>
        <h3 style={styles.title}>Plugin Manager</h3>
        <button
          style={isInstalling ? styles.installBtnDisabled : styles.installBtn}
          onClick={handleInstallClick}
          disabled={isInstalling}
        >
          {isInstalling && <span style={styles.spinner} />}
          {isInstalling ? "Installing..." : "Install Plugin"}
        </button>
      </div>

      {isInstalling && (
        <div style={styles.installingOverlay}>
          <span style={styles.spinner} />
          Installing plugin...
        </div>
      )}

      <div style={styles.list}>
        {installedPlugins.length === 0 && !isInstalling && (
          <div style={styles.emptyState}>
            No plugins installed. Click "Install Plugin" to add one.
          </div>
        )}

        {installedPlugins.map((plugin) => (
          <div key={plugin.name} style={styles.pluginItem}>
            <div style={styles.pluginInfo}>
              <span style={styles.pluginName}>{plugin.displayName}</span>
              <div style={styles.pluginMeta}>
                <span>v{plugin.version}</span>
                <span style={styles.categoryBadge}>
                  {CATEGORY_LABELS[plugin.category] ?? plugin.category}
                </span>
              </div>
            </div>
            <button
              style={styles.uninstallBtn}
              onClick={() => handleUninstall(plugin.name, plugin.displayName)}
              disabled={isInstalling}
            >
              Uninstall
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
