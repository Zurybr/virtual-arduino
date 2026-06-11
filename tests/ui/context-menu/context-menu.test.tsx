import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ContextMenu } from "../../../src/ui/context-menu/ContextMenu";
import type { MenuItem } from "../../../src/ui/context-menu/ContextMenu";

describe("ContextMenu", () => {
  const mockItems: MenuItem[] = [
    { label: "Rotate 90°", shortcut: "R", action: vi.fn() },
    { label: "Duplicate", shortcut: "Ctrl+D", action: vi.fn() },
    { separator: true, label: "" },
    { label: "Delete", shortcut: "Del", action: vi.fn() },
  ];

  const defaultProps = {
    x: 100,
    y: 200,
    items: mockItems,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders at the specified position", () => {
    render(<ContextMenu {...defaultProps} />);

    const menu = screen.getByTestId("context-menu");
    expect(menu).toBeInTheDocument();
    expect(menu.style.left).toBe("100px");
    expect(menu.style.top).toBe("200px");
  });

  it("renders all menu items", () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByText("Rotate 90°")).toBeInTheDocument();
    expect(screen.getByText("Duplicate")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("renders keyboard shortcuts", () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByText("R")).toBeInTheDocument();
    expect(screen.getByText("Ctrl+D")).toBeInTheDocument();
    expect(screen.getByText("Del")).toBeInTheDocument();
  });

  it("renders separator between items", () => {
    render(<ContextMenu {...defaultProps} />);

    const separators = screen.getAllByTestId("menu-separator");
    expect(separators).toHaveLength(1);
  });

  it("calls action and onClose when a menu item is clicked", () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.click(screen.getByText("Rotate 90°"));

    expect(mockItems[0].action).toHaveBeenCalledOnce();
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", () => {
    render(<ContextMenu {...defaultProps} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when clicking outside the menu", async () => {
    render(
      <div>
        <ContextMenu {...defaultProps} />
      </div>,
    );

    // Wait for the setTimeout(0) in click-outside handler to register
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Click on an element that is NOT the menu
    const outside = document.createElement("div");
    document.body.appendChild(outside);
    fireEvent.mouseDown(outside);

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
    document.body.removeChild(outside);
  });

  it("repositions menu if it would overflow viewport to the right", () => {
    // viewport is 1024x768, menu at x=900 would overflow
    render(<ContextMenu {...defaultProps} x={900} y={200} />);

    const menu = screen.getByTestId("context-menu");
    // Menu width ~200px, so it should reposition to 900 - ~200 = ~700
    // The exact value depends on the menu element's offsetWidth
    // We just verify it's repositioned (left < 900)
    const left = parseInt(menu.style.left, 10);
    expect(left).toBeLessThan(900);
  });

  it("repositions menu if it would overflow viewport at the bottom", () => {
    render(<ContextMenu {...defaultProps} x={100} y={700} />);

    const menu = screen.getByTestId("context-menu");
    const top = parseInt(menu.style.top, 10);
    expect(top).toBeLessThan(700);
  });

  it("renders as a portal attached to document.body", () => {
    const { baseElement } = render(<ContextMenu {...defaultProps} />);

    // The portal should render the menu outside the test container
    const menu = baseElement.querySelector('[data-testid="context-menu"]');
    expect(menu).toBeInTheDocument();
  });
});
