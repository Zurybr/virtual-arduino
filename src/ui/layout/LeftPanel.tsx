import { ResizablePanel } from "./ResizablePanel";

export interface LeftPanelProps {
  children?: React.ReactNode;
  onCollapse?: () => void;
  onResize?: (width: number) => void;
}

export function LeftPanel({ children, onCollapse, onResize }: LeftPanelProps) {
  return (
    <ResizablePanel
      side="left"
      defaultWidth={240}
      minWidth={180}
      maxWidth={400}
      storageKey="left-panel-width"
      onResize={onResize}
    >
      <div
        data-testid="left-panel-inner"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          backgroundColor: "#2d2d44",
          color: "#e0e0e0",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderBottom: "1px solid #3a3a5c",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <span>Components</span>
          <button
            onClick={onCollapse}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: "14px",
              padding: "2px 4px",
            }}
            aria-label="Toggle panel"
          >
            ◀
          </button>
        </div>

        {/* Scrollable content */}
        <div
          data-testid="left-panel-content"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px",
          }}
        >
          {children ?? <div style={{ color: "#666", fontSize: "12px", padding: "8px" }}>Palette placeholder</div>}
        </div>
      </div>
    </ResizablePanel>
  );
}
