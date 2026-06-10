import { useState, useMemo } from "react";

interface PalettePlugin {
  name: string;
  displayName: string;
  category: string;
  icon?: string;
}

interface ComponentPaletteProps {
  plugins: PalettePlugin[];
  onSelect: (pluginName: string) => void;
  searchQuery: string;
}

const CATEGORY_ORDER: Record<string, number> = {
  basic: 0,
  sensor: 1,
  actuator: 2,
  display: 3,
  ic: 4,
  communication: 5,
  power: 6,
};

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
  },
  searchBox: {
    padding: "8px",
    backgroundColor: "#2d2d2d",
    borderBottom: "1px solid #444",
  },
  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "6px 8px",
    backgroundColor: "#3c3c3c",
    border: "1px solid #555",
    borderRadius: "3px",
    color: "#ccc",
    fontSize: "12px",
    outline: "none",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0",
  },
  categoryHeader: {
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    backgroundColor: "#2a2a2a",
    borderBottom: "1px solid #333",
    position: "sticky",
    top: 0,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    fontSize: "12px",
    color: "#ccc",
    cursor: "pointer",
    borderBottom: "1px solid #333",
    transition: "background-color 0.15s",
  },
  iconPlaceholder: {
    width: "20px",
    height: "20px",
    borderRadius: "3px",
    backgroundColor: "#444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    color: "#aaa",
    flexShrink: 0,
  },
  emptyState: {
    padding: "16px 12px",
    textAlign: "center",
    color: "#666",
    fontSize: "12px",
  },
};

export function ComponentPalette({ plugins, onSelect, searchQuery }: ComponentPaletteProps) {
  const [internalQuery, setInternalQuery] = useState("");
  const query = searchQuery ?? internalQuery;

  const grouped = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    const filtered = plugins.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.displayName.toLowerCase().includes(lowerQuery),
    );

    const groups: Record<string, PalettePlugin[]> = {};
    for (const plugin of filtered) {
      const cat = plugin.category ?? "basic";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(plugin);
    }

    return Object.entries(groups)
      .sort(([a], [b]) => (CATEGORY_ORDER[a] ?? 99) - (CATEGORY_ORDER[b] ?? 99))
      .map(([category, items]) => ({
        category,
        label: CATEGORY_LABELS[category] ?? category,
        items,
      }));
  }, [plugins, query]);

  return (
    <div style={styles.container}>
      <div style={styles.searchBox}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search components..."
          value={query}
          onChange={(e) => setInternalQuery(e.target.value)}
        />
      </div>
      <div style={styles.list}>
        {grouped.length === 0 && (
          <div style={styles.emptyState}>No components found</div>
        )}
        {grouped.map((group) => (
          <div key={group.category}>
            <div style={styles.categoryHeader}>{group.label}</div>
            {group.items.map((plugin) => (
              <div
                key={plugin.name}
                style={styles.item}
                onClick={() => onSelect(plugin.name)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = "#2a2d2e";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                }}
              >
                <div style={styles.iconPlaceholder}>
                  {plugin.icon ? (
                    <img
                      src={plugin.icon}
                      alt=""
                      width={16}
                      height={16}
                      style={{ pointerEvents: "none" }}
                    />
                  ) : (
                    plugin.displayName[0]
                  )}
                </div>
                <span>{plugin.displayName}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
