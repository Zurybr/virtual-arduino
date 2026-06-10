interface RegisterData {
  name: string;
  value: number;
}

interface SregData {
  I: boolean;
  T: boolean;
  H: boolean;
  S: boolean;
  V: boolean;
  N: boolean;
  Z: boolean;
  C: boolean;
}

interface VariableViewProps {
  registers: RegisterData[];
  sreg: SregData;
  sp: number;
  pc: number;
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
  scrollArea: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
  },
  sectionTitle: {
    color: "#888",
    fontSize: "10px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "6px",
    marginTop: "8px",
  },
  counterRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "8px",
  },
  counterItem: {
    flex: 1,
    backgroundColor: "#252526",
    padding: "6px 10px",
    borderRadius: "3px",
    border: "1px solid #3e3e3e",
  },
  counterLabel: {
    color: "#888",
    fontSize: "10px",
    display: "block",
    marginBottom: "2px",
  },
  counterValue: {
    color: "#569cd6",
    fontSize: "14px",
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  regGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "4px",
    marginBottom: "8px",
  },
  regCell: {
    backgroundColor: "#252526",
    padding: "4px 6px",
    borderRadius: "2px",
    border: "1px solid #3e3e3e",
    textAlign: "center" as const,
  },
  regName: {
    color: "#9cdcfe",
    fontSize: "10px",
    display: "block",
  },
  regValue: {
    color: "#ce9178",
    fontSize: "11px",
    fontFamily: "monospace",
  },
  flagsRow: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap" as const,
    marginBottom: "8px",
  },
  flagBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "22px",
    borderRadius: "3px",
    fontSize: "11px",
    fontWeight: "bold",
    fontFamily: "monospace",
  },
};

function hexByte(value: number): string {
  return "0x" + (value & 0xff).toString(16).toUpperCase().padStart(2, "0");
}

export function VariableView({ registers, sreg, sp, pc }: VariableViewProps) {
  const flags: Array<{ key: keyof SregData; label: string }> = [
    { key: "I", label: "I" },
    { key: "T", label: "T" },
    { key: "H", label: "H" },
    { key: "S", label: "S" },
    { key: "V", label: "V" },
    { key: "N", label: "N" },
    { key: "Z", label: "Z" },
    { key: "C", label: "C" },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>CPU State</div>
      <div style={styles.scrollArea}>
        <div style={styles.counterRow}>
          <div style={styles.counterItem}>
            <span style={styles.counterLabel}>PC</span>
            <span style={styles.counterValue}>
              0x{pc.toString(16).toUpperCase().padStart(4, "0")}
            </span>
          </div>
          <div style={styles.counterItem}>
            <span style={styles.counterLabel}>SP</span>
            <span style={styles.counterValue}>
              0x{sp.toString(16).toUpperCase().padStart(4, "0")}
            </span>
          </div>
        </div>

        <div style={styles.sectionTitle}>SREG Flags</div>
        <div style={styles.flagsRow}>
          {flags.map(({ key, label }) => {
            const isSet = sreg[key];
            return (
              <span
                key={key}
                style={{
                  ...styles.flagBadge,
                  backgroundColor: isSet ? "#4caf5033" : "#3c3c3c",
                  color: isSet ? "#4caf50" : "#666",
                  border: isSet ? "1px solid #4caf5055" : "1px solid #3e3e3e",
                }}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div style={styles.sectionTitle}>Registers R0–R31</div>
        <div style={styles.regGrid}>
          {registers.map((reg) => (
            <div key={reg.name} style={styles.regCell}>
              <span style={styles.regName}>{reg.name}</span>
              <span style={styles.regValue}>{hexByte(reg.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
