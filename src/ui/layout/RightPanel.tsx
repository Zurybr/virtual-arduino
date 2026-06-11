import { useState } from "react";
import { ResizablePanel } from "./ResizablePanel";
import { CodeEditor } from "../editor/code-editor";
import { SerialMonitor } from "../serial-monitor";

export interface RightPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  serialOutput: string[];
  onSerialSend: (data: string) => void;
  baudRate: number;
  onSerialClear: () => void;
  onResize?: (width: number) => void;
}

type Tab = "code" | "serial";

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 16px",
  fontSize: "12px",
  color: active ? "#e0e0e0" : "#888",
  cursor: "pointer",
  border: "none",
  background: "none",
  borderBottom: active ? "2px solid #4488ff" : "2px solid transparent",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

export function RightPanel({
  code,
  onCodeChange,
  serialOutput,
  onSerialSend,
  baudRate,
  onSerialClear,
  onResize,
}: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("code");

  return (
    <ResizablePanel
      side="right"
      defaultWidth={360}
      minWidth={280}
      maxWidth={600}
      storageKey="right-panel-width"
      onResize={onResize}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#1e1e1e",
          color: "#e0e0e0",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#252526",
            borderBottom: "1px solid #444",
          }}
        >
          <button
            style={tabStyle(activeTab === "code")}
            onClick={() => setActiveTab("code")}
            data-active={activeTab === "code"}
            role="button"
            aria-label="Code editor tab"
          >
            <span>✏️</span>
            <span>Code</span>
          </button>
          <button
            style={tabStyle(activeTab === "serial")}
            onClick={() => setActiveTab("serial")}
            data-active={activeTab === "serial"}
            role="button"
            aria-label="Serial monitor tab"
          >
            <span>📡</span>
            <span>Serial</span>
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {activeTab === "code" ? (
            <CodeEditor code={code} onCodeChange={onCodeChange} />
          ) : (
            <SerialMonitor
              output={serialOutput}
              onSend={onSerialSend}
              baudRate={baudRate}
              onClear={onSerialClear}
            />
          )}
        </div>
      </div>
    </ResizablePanel>
  );
}
