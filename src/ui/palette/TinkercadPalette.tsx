import React, { useState, useCallback, useMemo } from "react";
import { filterComponents } from "./paletteSearch";
import type { PaletteCategory } from "./paletteSearch";
import { getRecentlyUsed } from "./recentlyUsed";

export interface TinkercadPaletteProps {
  onDragStart: (e: React.DragEvent, type: string) => void;
}

const PALETTE_CATEGORIES: PaletteCategory[] = [
  {
    name: "Basic",
    items: [
      { type: "led", label: "LED", icon: "💡" },
      { type: "resistor", label: "Resistor", icon: "🔄" },
      { type: "capacitor", label: "Capacitor", icon: "🔋" },
      { type: "pushbutton", label: "Pushbutton", icon: "⬜" },
      { type: "diode", label: "Diode", icon: "▶" },
      { type: "transistor", label: "Transistor", icon: "🔻" },
    ],
  },
  {
    name: "Inputs",
    items: [
      { type: "potentiometer", label: "Potentiometer", icon: "🔘" },
      { type: "photoresistor", label: "Photoresistor", icon: "☀" },
      { type: "temperature-sensor", label: "Temp Sensor", icon: "🌡" },
    ],
  },
  {
    name: "Outputs",
    items: [
      { type: "buzzer", label: "Buzzer", icon: "🔔" },
      { type: "servo", label: "Servo", icon: "⚙" },
      { type: "dc-motor", label: "DC Motor", icon: "🌀" },
    ],
  },
  {
    name: "Displays",
    items: [
      { type: "lcd-display", label: "LCD Display", icon: "📺" },
      { type: "rgb-led", label: "RGB LED", icon: "🌈" },
    ],
  },
  {
    name: "ICs",
    items: [
      { type: "shift-register", label: "Shift Register", icon: "📦" },
    ],
  },
  {
    name: "Power",
    items: [
      { type: "usb-connector", label: "USB Connector", icon: "🔌" },
    ],
  },
];

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  backgroundColor: "#1e1e1e",
  color: "#e0e0e0",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  overflow: "hidden",
};

const searchContainerStyle: React.CSSProperties = {
  padding: "8px",
  borderBottom: "1px solid #383838",
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 10px",
  fontSize: "12px",
  backgroundColor: "#2a2a2a",
  color: "#e0e0e0",
  border: "1px solid #444",
  borderRadius: "4px",
  outline: "none",
  boxSizing: "border-box",
};

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
};

const categoryHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  backgroundColor: "#2a2a2a",
  borderBottom: "1px solid #383838",
  fontSize: "10px",
  fontWeight: "bold",
  color: "#888",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  cursor: "pointer",
  userSelect: "none",
};

const toggleStyle: React.CSSProperties = {
  fontSize: "10px",
  width: "14px",
  textAlign: "center",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "6px 12px",
  fontSize: "12px",
  color: "#aaa",
  cursor: "grab",
  borderBottom: "1px solid #2e2e2e",
  transition: "background-color 0.15s",
  userSelect: "none",
};

const iconStyle: React.CSSProperties = {
  width: "22px",
  height: "22px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#333",
  borderRadius: "3px",
  fontSize: "11px",
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: "10px",
  fontWeight: "bold",
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderBottom: "1px solid #2e2e2e",
};

const noResultsStyle: React.CSSProperties = {
  padding: "20px 12px",
  color: "#666",
  fontSize: "12px",
  textAlign: "center",
  fontStyle: "italic",
};

/**
 * Tinkercad-style component palette with:
 * - Collapsible categories
 * - Search/filter bar
 * - Recently used section
 * - Draggable items
 */
export function TinkercadPalette({ onDragStart }: TinkercadPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const recentlyUsed = useMemo(() => getRecentlyUsed(), []);

  const toggleCategory = useCallback((name: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const filteredCategories = useMemo(
    () => filterComponents(searchQuery, PALETTE_CATEGORIES),
    [searchQuery],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, type: string) => {
      onDragStart(e, type);
    },
    [onDragStart],
  );

  // Build recently used items
  const recentlyUsedItems = useMemo(() => {
    if (recentlyUsed.length === 0) return [];
    return recentlyUsed
      .map((type) => {
        for (const cat of PALETTE_CATEGORIES) {
          const item = cat.items.find((i) => i.type === type);
          if (item) return item;
        }
        return null;
      })
      .filter(Boolean) as typeof PALETTE_CATEGORIES[0]["items"];
  }, [recentlyUsed]);

  const showRecentlyUsed = searchQuery.trim() === "" && recentlyUsedItems.length > 0;

  return (
    <div style={containerStyle}>
      {/* Search bar */}
      <div style={searchContainerStyle}>
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {/* Scrollable content */}
      <div style={scrollAreaStyle}>
        {/* Recently Used */}
        {showRecentlyUsed && (
          <>
            <div style={sectionHeaderStyle}>Recently Used</div>
            {recentlyUsedItems.map((item) => (
              <PaletteItemRow
                key={`recent-${item.type}`}
                item={item}
                onDragStart={handleDragStart}
              />
            ))}
          </>
        )}

        {/* Filtered categories */}
        {filteredCategories.length === 0 && searchQuery.trim() !== "" ? (
          <div style={noResultsStyle}>No components found</div>
        ) : (
          filteredCategories.map((category) => {
            const isCollapsed =
              collapsedCategories.has(category.name) && searchQuery.trim() === "";

            return (
              <div key={category.name}>
                <div
                  style={categoryHeaderStyle}
                  onClick={() => toggleCategory(category.name)}
                  data-testid={`category-header-${category.name}`}
                >
                  <span style={toggleStyle}>
                    {isCollapsed ? "▶" : "▼"}
                  </span>
                  {category.name}
                </div>
                {!isCollapsed &&
                  category.items.map((item) => (
                    <PaletteItemRow
                      key={item.type}
                      item={item}
                      onDragStart={handleDragStart}
                    />
                  ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Individual palette item row.
 */
function PaletteItemRow({
  item,
  onDragStart,
}: {
  item: { type: string; label: string; icon?: string };
  onDragStart: (e: React.DragEvent, type: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.type)}
      style={itemStyle}
    >
      <span style={iconStyle}>{item.icon ?? "?"}</span>
      {item.label}
    </div>
  );
}
