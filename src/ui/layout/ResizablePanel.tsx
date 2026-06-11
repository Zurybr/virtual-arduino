import { useState, useRef, useCallback, useEffect } from "react";

export interface ResizablePanelProps {
  side: "left" | "right";
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  children: React.ReactNode;
  storageKey?: string;
  onResize?: (width: number) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function ResizablePanel({
  side,
  defaultWidth,
  minWidth,
  maxWidth,
  children,
  storageKey,
  onResize,
}: ResizablePanelProps) {
  const getInitialWidth = (): number => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          return clamp(parsed, minWidth, maxWidth);
        }
      }
    }
    return defaultWidth;
  };

  const [width, setWidth] = useState(getInitialWidth);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width],
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;

      const delta = e.clientX - startX.current;
      // For left panel: moving right increases width
      // For right panel: moving left increases width (negative delta)
      const newWidth = side === "left"
        ? startWidth.current + delta
        : startWidth.current - delta;

      const clamped = clamp(newWidth, minWidth, maxWidth);
      setWidth(clamped);
    };

    const handleMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      setWidth((currentWidth) => {
        if (storageKey) {
          localStorage.setItem(storageKey, String(currentWidth));
        }
        onResize?.(currentWidth);
        return currentWidth;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [side, minWidth, maxWidth, storageKey, onResize]);

  const handleStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "4px",
    cursor: "col-resize",
    backgroundColor: "transparent",
    zIndex: 10,
    ...(side === "left" ? { right: 0 } : { left: 0 }),
  };

  const handleHoverStyle: React.CSSProperties = {
    ...handleStyle,
    transition: "background-color 0.15s",
  };

  const panelStyle: React.CSSProperties = {
    position: "relative",
    width: `${width}px`,
    minWidth: `${minWidth}px`,
    maxWidth: `${maxWidth}px`,
    overflow: "hidden",
    flexShrink: 0,
  };

  return (
    <div data-testid="resizable-panel" style={panelStyle}>
      {children}
      <div
        data-testid="resize-handle"
        style={handleHoverStyle}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
