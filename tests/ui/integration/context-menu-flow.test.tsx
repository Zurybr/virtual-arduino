import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ContextMenu } from "../../../src/ui/context-menu/ContextMenu";
import type { MenuItem } from "../../../src/ui/context-menu/ContextMenu";
import {
  getCanvasMenuItems,
  getComponentMenuItems,
  getWireMenuItems,
  getPinMenuItems,
} from "../../../src/ui/context-menu/menuConfigs";

describe("ContextMenu integration scenarios", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe("getComponentMenuItems", () => {
    it("should return component menu items with expected labels", () => {
      const items = getComponentMenuItems();
      const labels = items.filter((i) => !i.separator).map((i) => i.label);

      expect(labels).toContain("Rotate 90°");
      expect(labels).toContain("Duplicate");
      expect(labels).toContain("Delete");
      expect(labels).toContain("Properties");
      expect(labels).toContain("Bring to Front");
      expect(labels).toContain("Send to Back");
    });

    it("should include separator items", () => {
      const items = getComponentMenuItems();
      const separators = items.filter((i) => i.separator);

      expect(separators.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getCanvasMenuItems", () => {
    it("should return canvas menu items", () => {
      const items = getCanvasMenuItems(false);
      const labels = items.map((i) => i.label);

      expect(labels).toContain("Paste");
      expect(labels).toContain("Select All");
      expect(labels).toContain("Fit to Screen");
    });

    it("should disable Paste when no clipboard", () => {
      const items = getCanvasMenuItems(false);
      const paste = items.find((i) => i.label === "Paste");

      expect(paste?.disabled).toBe(true);
    });

    it("should enable Paste when clipboard has content", () => {
      const items = getCanvasMenuItems(true);
      const paste = items.find((i) => i.label === "Paste");

      expect(paste?.disabled).toBe(false);
    });
  });

  describe("getWireMenuItems", () => {
    it("should return wire menu items", () => {
      const items = getWireMenuItems();
      const labels = items.map((i) => i.label);

      expect(labels).toContain("Delete");
      expect(labels).toContain("Change Color");
    });
  });

  describe("getPinMenuItems", () => {
    it("should return pin menu items", () => {
      const items = getPinMenuItems();
      const labels = items.map((i) => i.label);

      expect(labels).toContain("Start Wire from Here");
    });
  });

  describe("ContextMenu rendering", () => {
    it("should render menu items at specified position", () => {
      const onClose = vi.fn();
      const items: MenuItem[] = [
        { label: "Delete", action: vi.fn() },
        { label: "Duplicate", action: vi.fn() },
      ];

      render(
        <ContextMenu x={100} y={200} items={items} onClose={onClose} />,
      );

      const menu = screen.getByTestId("context-menu");
      expect(menu).toBeTruthy();
      expect(menu.style.left).toBe("100px");
      expect(menu.style.top).toBe("200px");
    });

    it("should call action and close when item is clicked", () => {
      const onClose = vi.fn();
      const deleteAction = vi.fn();
      const items: MenuItem[] = [
        { label: "Delete", action: deleteAction },
      ];

      render(
        <ContextMenu x={100} y={200} items={items} onClose={onClose} />,
      );

      const deleteItem = screen.getByText("Delete");
      fireEvent.click(deleteItem);

      expect(deleteAction).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("should not call action for disabled items", () => {
      const onClose = vi.fn();
      const action = vi.fn();
      const items: MenuItem[] = [
        { label: "Paste", action, disabled: true },
      ];

      render(
        <ContextMenu x={100} y={200} items={items} onClose={onClose} />,
      );

      const pasteItem = screen.getByText("Paste");
      fireEvent.click(pasteItem);

      expect(action).not.toHaveBeenCalled();
      // onClose should still be called even for disabled items
      // (actually per implementation, it closes only on non-disabled click)
    });
  });
});
