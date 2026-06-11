import type { MenuItem } from "./ContextMenu";

/**
 * Canvas empty space context menu items.
 * @param hasClipboard - whether clipboard has content (enables Paste)
 */
export function getCanvasMenuItems(hasClipboard: boolean): MenuItem[] {
  return [
    {
      label: "Paste",
      icon: "📋",
      shortcut: "Ctrl+V",
      disabled: !hasClipboard,
      action: undefined, // wired in app.tsx
    },
    {
      label: "Select All",
      icon: "☑️",
      shortcut: "Ctrl+A",
      action: undefined,
    },
    {
      label: "Fit to Screen",
      icon: "🔍",
      shortcut: "Ctrl+0",
      action: undefined,
    },
  ];
}

/**
 * Component context menu items (right-click on a component).
 */
export function getComponentMenuItems(): MenuItem[] {
  return [
    {
      label: "Rotate 90°",
      icon: "🔄",
      shortcut: "R",
      action: undefined,
    },
    {
      label: "Duplicate",
      icon: "📄",
      shortcut: "Ctrl+D",
      action: undefined,
    },
    { separator: true, label: "" },
    {
      label: "Delete",
      icon: "🗑️",
      shortcut: "Del",
      action: undefined,
    },
    {
      label: "Properties",
      icon: "⚙️",
      action: undefined,
    },
    { separator: true, label: "" },
    {
      label: "Bring to Front",
      icon: "⬆️",
      action: undefined,
    },
    {
      label: "Send to Back",
      icon: "⬇️",
      action: undefined,
    },
  ];
}

/**
 * Wire context menu items (right-click on a wire).
 */
export function getWireMenuItems(): MenuItem[] {
  return [
    {
      label: "Delete",
      icon: "🗑️",
      shortcut: "Del",
      action: undefined,
    },
    {
      label: "Change Color",
      icon: "🎨",
      action: undefined,
    },
  ];
}

/**
 * Pin context menu items (right-click on a pin).
 */
export function getPinMenuItems(): MenuItem[] {
  return [
    {
      label: "Start Wire from Here",
      icon: "🔌",
      action: undefined,
    },
  ];
}
