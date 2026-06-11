import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export interface MenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

const MENU_WIDTH_ESTIMATE = 200;
const MENU_HEIGHT_ESTIMATE = 200;

function calculateMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number,
  vpWidth: number,
  vpHeight: number,
): { x: number; y: number } {
  let finalX = x;
  let finalY = y;

  if (finalX + menuWidth > vpWidth) {
    finalX = vpWidth - menuWidth;
  }
  if (finalY + menuHeight > vpHeight) {
    finalY = vpHeight - menuHeight;
  }

  // Ensure not negative
  finalX = Math.max(0, finalX);
  finalY = Math.max(0, finalY);

  return { x: finalX, y: finalY };
}

export { calculateMenuPosition };

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });

  // Viewport bounds clamping
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const menuWidth = menu.offsetWidth || MENU_WIDTH_ESTIMATE;
    const menuHeight = menu.offsetHeight || MENU_HEIGHT_ESTIMATE;
    const vpWidth = window.innerWidth;
    const vpHeight = window.innerHeight;

    const clamped = calculateMenuPosition(x, y, menuWidth, menuHeight, vpWidth, vpHeight);

    if (clamped.x !== x || clamped.y !== y) {
      setPosition(clamped);
    }
  }, [x, y]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Use setTimeout to avoid the same click that opened the menu
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleItemClick = useCallback(
    (item: MenuItem) => {
      if (item.disabled) return;
      item.action?.();
      onClose();
    },
    [onClose],
  );

  const menuContent = (
    <div
      ref={menuRef}
      data-testid="context-menu"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        backgroundColor: "#2d2d3d",
        border: "1px solid #444",
        borderRadius: "4px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        padding: "4px 0",
        minWidth: "160px",
        zIndex: 10000,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        fontSize: "13px",
        color: "#e0e0e0",
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={`sep-${index}`}
              data-testid="menu-separator"
              style={{
                height: "1px",
                backgroundColor: "#444",
                margin: "4px 0",
              }}
            />
          );
        }

        return (
          <div
            key={item.label}
            onClick={() => handleItemClick(item)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 12px",
              cursor: item.disabled ? "not-allowed" : "pointer",
              opacity: item.disabled ? 0.4 : 1,
              transition: "background-color 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = "#3a3a5c";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span style={{ color: "#888", fontSize: "11px", marginLeft: "16px" }}>
                {item.shortcut}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  return createPortal(menuContent, document.body);
}
