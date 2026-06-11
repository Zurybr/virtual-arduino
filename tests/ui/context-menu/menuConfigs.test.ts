import { describe, it, expect } from "vitest";
import {
  getCanvasMenuItems,
  getComponentMenuItems,
  getWireMenuItems,
  getPinMenuItems,
} from "../../../src/ui/context-menu/menuConfigs";

describe("menuConfigs", () => {
  describe("getCanvasMenuItems", () => {
    it("returns canvas menu items with Paste disabled when no clipboard", () => {
      const items = getCanvasMenuItems(false);

      const paste = items.find((i) => i.label === "Paste");
      expect(paste).toBeDefined();
      expect(paste!.disabled).toBe(true);
    });

    it("returns canvas menu items with Paste enabled when clipboard has content", () => {
      const items = getCanvasMenuItems(true);

      const paste = items.find((i) => i.label === "Paste");
      expect(paste).toBeDefined();
      expect(paste!.disabled).toBe(false);
    });

    it("includes Select All menu item", () => {
      const items = getCanvasMenuItems(false);

      expect(items.find((i) => i.label === "Select All")).toBeDefined();
    });

    it("includes Fit to Screen menu item", () => {
      const items = getCanvasMenuItems(false);

      expect(items.find((i) => i.label === "Fit to Screen")).toBeDefined();
    });
  });

  describe("getComponentMenuItems", () => {
    it("returns all component menu items", () => {
      const items = getComponentMenuItems();

      const labels = items.filter((i) => !i.separator).map((i) => i.label);
      expect(labels).toContain("Rotate 90°");
      expect(labels).toContain("Duplicate");
      expect(labels).toContain("Delete");
      expect(labels).toContain("Properties");
      expect(labels).toContain("Bring to Front");
      expect(labels).toContain("Send to Back");
    });

    it("includes separator between groups", () => {
      const items = getComponentMenuItems();

      const separators = items.filter((i) => i.separator);
      expect(separators.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getWireMenuItems", () => {
    it("returns wire menu items", () => {
      const items = getWireMenuItems();

      const labels = items.filter((i) => !i.separator).map((i) => i.label);
      expect(labels).toContain("Delete");
      expect(labels).toContain("Change Color");
    });
  });

  describe("getPinMenuItems", () => {
    it("returns pin menu items", () => {
      const items = getPinMenuItems();

      const labels = items.filter((i) => !i.separator).map((i) => i.label);
      expect(labels).toContain("Start Wire from Here");
    });
  });
});
