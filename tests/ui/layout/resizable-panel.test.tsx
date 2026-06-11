import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResizablePanel } from "../../../src/ui/layout/ResizablePanel";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ResizablePanel", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("renders children inside the panel", () => {
    render(
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400}>
        <div>Child content</div>
      </ResizablePanel>,
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("starts with default width", () => {
    render(
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400}>
        <div>Content</div>
      </ResizablePanel>,
    );

    const panel = screen.getByTestId("resizable-panel");
    expect(panel.style.width).toBe("240px");
  });

  it("restores width from localStorage if available", () => {
    localStorageMock.getItem.mockReturnValueOnce("300");

    render(
      <ResizablePanel
        side="left"
        defaultWidth={240}
        minWidth={180}
        maxWidth={400}
        storageKey="test-panel-width"
      >
        <div>Content</div>
      </ResizablePanel>,
    );

    const panel = screen.getByTestId("resizable-panel");
    expect(panel.style.width).toBe("300px");
  });

  it("clamps restored width to minWidth if stored value is too small", () => {
    localStorageMock.getItem.mockReturnValueOnce("100");

    render(
      <ResizablePanel
        side="left"
        defaultWidth={240}
        minWidth={180}
        maxWidth={400}
        storageKey="test-panel-width"
      >
        <div>Content</div>
      </ResizablePanel>,
    );

    const panel = screen.getByTestId("resizable-panel");
    expect(panel.style.width).toBe("180px");
  });

  it("clamps restored width to maxWidth if stored value is too large", () => {
    localStorageMock.getItem.mockReturnValueOnce("500");

    render(
      <ResizablePanel
        side="left"
        defaultWidth={240}
        minWidth={180}
        maxWidth={400}
        storageKey="test-panel-width"
      >
        <div>Content</div>
      </ResizablePanel>,
    );

    const panel = screen.getByTestId("resizable-panel");
    expect(panel.style.width).toBe("400px");
  });

  it("renders drag handle on the right edge for left panel", () => {
    render(
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400}>
        <div>Content</div>
      </ResizablePanel>,
    );

    const handle = screen.getByTestId("resize-handle");
    expect(handle).toBeInTheDocument();
    // Left panel: handle should be on the right edge (cursor: col-resize)
    expect(handle.style.cursor).toBe("col-resize");
  });

  it("renders drag handle on the left edge for right panel", () => {
    render(
      <ResizablePanel side="right" defaultWidth={360} minWidth={280} maxWidth={600}>
        <div>Content</div>
      </ResizablePanel>,
    );

    const handle = screen.getByTestId("resize-handle");
    expect(handle).toBeInTheDocument();
  });

  it("resizes panel when dragging the handle for left side", () => {
    render(
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400}>
        <div>Content</div>
      </ResizablePanel>,
    );

    const handle = screen.getByTestId("resize-handle");
    const panel = screen.getByTestId("resizable-panel");

    // Mouse down on handle starts drag
    fireEvent.mouseDown(handle, { clientX: 240 });

    // Mouse move to the right (increase width for left panel)
    fireEvent.mouseMove(document, { clientX: 300 });
    expect(panel.style.width).toBe("300px");

    // Mouse up ends drag
    fireEvent.mouseUp(document);
  });

  it("resizes panel when dragging the handle for right side", () => {
    render(
      <ResizablePanel side="right" defaultWidth={360} minWidth={280} maxWidth={600}>
        <div>Content</div>
      </ResizablePanel>,
    );

    const handle = screen.getByTestId("resize-handle");
    const panel = screen.getByTestId("resizable-panel");

    // Mouse down on handle starts drag
    fireEvent.mouseDown(handle, { clientX: 640 });

    // Mouse move to the left (increase width for right panel — moving left increases width)
    fireEvent.mouseMove(document, { clientX: 540 });
    expect(panel.style.width).toBe("460px");

    fireEvent.mouseUp(document);
  });

  it("clamps to minWidth when resizing too small", () => {
    render(
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400}>
        <div>Content</div>
      </ResizablePanel>,
    );

    const handle = screen.getByTestId("resize-handle");
    const panel = screen.getByTestId("resizable-panel");

    fireEvent.mouseDown(handle, { clientX: 240 });
    fireEvent.mouseMove(document, { clientX: 50 }); // way too small

    expect(panel.style.width).toBe("180px");

    fireEvent.mouseUp(document);
  });

  it("clamps to maxWidth when resizing too large", () => {
    render(
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400}>
        <div>Content</div>
      </ResizablePanel>,
    );

    const handle = screen.getByTestId("resize-handle");
    const panel = screen.getByTestId("resizable-panel");

    fireEvent.mouseDown(handle, { clientX: 240 });
    fireEvent.mouseMove(document, { clientX: 500 }); // way too large

    expect(panel.style.width).toBe("400px");

    fireEvent.mouseUp(document);
  });

  it("persists width to localStorage on resize end", () => {
    render(
      <ResizablePanel
        side="left"
        defaultWidth={240}
        minWidth={180}
        maxWidth={400}
        storageKey="test-panel-width"
      >
        <div>Content</div>
      </ResizablePanel>,
    );

    const handle = screen.getByTestId("resize-handle");

    fireEvent.mouseDown(handle, { clientX: 240 });
    fireEvent.mouseMove(document, { clientX: 300 });
    fireEvent.mouseUp(document);

    expect(localStorageMock.setItem).toHaveBeenCalledWith("test-panel-width", "300");
  });

  it("calls onResize callback when width changes", () => {
    const onResize = vi.fn();

    render(
      <ResizablePanel side="left" defaultWidth={240} minWidth={180} maxWidth={400} onResize={onResize}>
        <div>Content</div>
      </ResizablePanel>,
    );

    const handle = screen.getByTestId("resize-handle");

    fireEvent.mouseDown(handle, { clientX: 240 });
    fireEvent.mouseMove(document, { clientX: 300 });
    fireEvent.mouseUp(document);

    expect(onResize).toHaveBeenCalledWith(300);
  });
});
