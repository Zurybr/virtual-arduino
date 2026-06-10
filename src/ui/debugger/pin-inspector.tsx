import { useEffect, useRef } from "react";

interface PinData {
  id: string;
  label: string;
  mode: string;
  value: string;
  busId: string | null;
}

interface PinInspectorProps {
  pins: PinData[];
}

function getValueColor(value: string): string {
  const upper = value.toUpperCase();
  if (upper === "HIGH") return "#4caf50";
  if (upper === "LOW") return "#f44336";
  if (upper.startsWith("PWM")) return "#2196f3";
  if (upper.startsWith("ANALOG") || /^\d/.test(upper)) return "#9c27b0";
  if (upper === "FLOATING" || upper === "NONE") return "#999";
  return "#ccc";
}

function getModeColor(mode: string): string {
  const upper = mode.toUpperCase();
  if (upper.includes("OUTPUT")) return "#ff9800";
  if (upper.includes("INPUT")) return "#4caf50";
  if (upper.includes("PWM")) return "#2196f3";
  if (upper.includes("ANALOG")) return "#9c27b0";
  if (upper.includes("I2C")) return "#00bcd4";
  if (upper.includes("SPI")) return "#ff5722";
  if (upper.includes("UART")) return "#795548";
  return "#999";
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
  tableContainer: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    position: "sticky" as const,
    top: 0,
    padding: "6px 8px",
    backgroundColor: "#252526",
    color: "#888",
    textAlign: "left",
    fontWeight: "normal",
    fontSize: "11px",
    textTransform: "uppercase" as const,
    borderBottom: "1px solid #444",
    letterSpacing: "0.5px",
  },
  td: {
    padding: "4px 8px",
    color: "#ccc",
    borderBottom: "1px solid #333",
    whiteSpace: "nowrap" as const,
  },
  badge: {
    display: "inline-block",
    padding: "1px 6px",
    borderRadius: "3px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  pinLabel: {
    color: "#ddd",
    fontFamily: "monospace",
  },
  busCell: {
    color: "#888",
    fontStyle: "italic",
  },
  emptyState: {
    padding: "20px",
    textAlign: "center" as const,
    color: "#666",
  },
};

export function PinInspector({ pins }: PinInspectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPinCountRef = useRef(0);

  useEffect(() => {
    if (pins.length > prevPinCountRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    prevPinCountRef.current = pins.length;
  }, [pins.length]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>Pin Inspector</div>
      <div style={styles.tableContainer} ref={containerRef}>
        {pins.length === 0 ? (
          <div style={styles.emptyState}>No pins to display</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Pin</th>
                <th style={styles.th}>Mode</th>
                <th style={styles.th}>Value</th>
                <th style={styles.th}>Bus</th>
              </tr>
            </thead>
            <tbody>
              {pins.map((pin) => (
                <tr key={pin.id}>
                  <td style={styles.td}>
                    <span style={styles.pinLabel}>{pin.label}</span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: getModeColor(pin.mode) + "33",
                        color: getModeColor(pin.mode),
                      }}
                    >
                      {pin.mode}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.badge,
                        backgroundColor: getValueColor(pin.value) + "33",
                        color: getValueColor(pin.value),
                      }}
                    >
                      {pin.value}
                    </span>
                  </td>
                  <td style={{ ...styles.td, ...styles.busCell }}>
                    {pin.busId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
