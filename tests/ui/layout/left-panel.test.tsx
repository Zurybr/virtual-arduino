import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LeftPanel } from "../../../src/ui/layout/LeftPanel";

describe("LeftPanel", () => {
  it("renders the Components header", () => {
    render(<LeftPanel />);

    expect(screen.getByText("Components")).toBeInTheDocument();
  });

  it("renders scrollable content area", () => {
    render(<LeftPanel />);

    expect(screen.getByTestId("left-panel-content")).toBeInTheDocument();
  });

  it("renders collapse toggle button", () => {
    render(<LeftPanel />);

    expect(screen.getByLabelText("Toggle panel")).toBeInTheDocument();
  });

  it("wraps content in ResizablePanel with correct defaults", () => {
    render(<LeftPanel />);

    const panel = screen.getByTestId("resizable-panel");
    // Default width is 240px
    expect(panel.style.width).toBe("240px");
  });

  it("has dark sidebar background color", () => {
    render(<LeftPanel />);

    const panel = screen.getByTestId("left-panel-inner");
    expect(panel.style.backgroundColor).toBe("rgb(45, 45, 68)"); // #2d2d44
  });

  it("renders children when provided", () => {
    render(
      <LeftPanel>
        <div data-testid="palette-content">Palette items</div>
      </LeftPanel>,
    );

    expect(screen.getByTestId("palette-content")).toBeInTheDocument();
    expect(screen.getByText("Palette items")).toBeInTheDocument();
  });

  it("has collapse toggle that calls onCollapse callback", () => {
    const onCollapse = vi.fn();
    render(<LeftPanel onCollapse={onCollapse} />);

    fireEvent.click(screen.getByLabelText("Toggle panel"));
    expect(onCollapse).toHaveBeenCalledOnce();
  });

  it("accepts onResize callback and passes it to ResizablePanel", () => {
    const onResize = vi.fn();
    render(<LeftPanel onResize={onResize} />);

    const handle = screen.getByTestId("resize-handle");
    fireEvent.mouseDown(handle, { clientX: 240 });
    fireEvent.mouseMove(document, { clientX: 300 });
    fireEvent.mouseUp(document);

    expect(onResize).toHaveBeenCalledWith(300);
  });
});
