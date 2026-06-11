import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RightPanel } from "../../../src/ui/layout/RightPanel";

// Mock CodeEditor and SerialMonitor
vi.mock("../../../src/ui/editor/code-editor", () => ({
  CodeEditor: ({ code: _code, onCodeChange: _onCodeChange }: { code: string; onCodeChange: (code: string) => void }) => (
    <div data-testid="code-editor">CodeEditor</div>
  ),
}));

vi.mock("../../../src/ui/serial-monitor", () => ({
  SerialMonitor: ({ output }: { output: string[] }) => (
    <div data-testid="serial-monitor">SerialMonitor: {output.length} lines</div>
  ),
}));

describe("RightPanel", () => {
  const defaultProps = {
    code: "void setup() { }",
    onCodeChange: vi.fn(),
    serialOutput: ["Hello", "World"],
    onSerialSend: vi.fn(),
    baudRate: 9600,
    onSerialClear: vi.fn(),
  };

  it("renders Code tab and Serial tab", () => {
    render(<RightPanel {...defaultProps} />);

    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Serial")).toBeInTheDocument();
  });

  it("shows Code tab as active by default", () => {
    render(<RightPanel {...defaultProps} />);

    const codeTab = screen.getByRole("button", { name: /code/i });
    expect(codeTab).toHaveAttribute("data-active", "true");
  });

  it("switches to Serial tab when clicked", () => {
    render(<RightPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /serial/i }));

    expect(screen.getByRole("button", { name: /serial/i })).toHaveAttribute("data-active", "true");
    expect(screen.getByRole("button", { name: /code/i })).toHaveAttribute("data-active", "false");
  });

  it("renders CodeEditor when Code tab is active", () => {
    render(<RightPanel {...defaultProps} />);

    expect(screen.getByTestId("code-editor")).toBeInTheDocument();
  });

  it("renders SerialMonitor when Serial tab is active", () => {
    render(<RightPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /serial/i }));

    expect(screen.getByTestId("serial-monitor")).toBeInTheDocument();
  });

  it("hides CodeEditor when Serial tab is active", () => {
    render(<RightPanel {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /serial/i }));

    expect(screen.queryByTestId("code-editor")).not.toBeInTheDocument();
  });

  it("wraps content in ResizablePanel with correct defaults", () => {
    render(<RightPanel {...defaultProps} />);

    const panel = screen.getByTestId("resizable-panel");
    // Default width 360px
    expect(panel.style.width).toBe("360px");
  });
});
