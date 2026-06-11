import React from "react";
import { createPortal } from "react-dom";

interface PinTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  label: string;
}

/**
 * HTML overlay (React portal) positioned near a hovered pin.
 * Shows the pin label (e.g., "D7", "A0", "5V", "GND").
 * Positioned at the pin's absolute screen coordinates.
 */
export const PinTooltip: React.FC<PinTooltipProps> = ({ visible, x, y, label }) => {
  if (!visible) return null;

  const tooltipContent = (
    <div
      data-testid="pin-tooltip"
      style={{
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: "#1a1a2e",
        color: "#e0e0e0",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        pointerEvents: "none",
        zIndex: 10001,
        whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        border: "1px solid #444",
        transform: "translate(-50%, -100%)",
        marginTop: "-12px",
      }}
    >
      {label}
    </div>
  );

  return createPortal(tooltipContent, document.body);
};
