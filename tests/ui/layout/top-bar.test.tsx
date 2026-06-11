import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TopBar } from "../../../src/ui/layout/TopBar";

describe("TopBar", () => {
  const defaultProps = {
    circuitName: "Untitled Circuit",
    onCircuitNameChange: vi.fn(),
    status: "STOPPED" as const,
    onRun: vi.fn(),
    onStop: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onStep: vi.fn(),
    onReset: vi.fn(),
  };

  it("renders the circuit name", () => {
    render(<TopBar {...defaultProps} />);

    expect(screen.getByDisplayValue("Untitled Circuit")).toBeInTheDocument();
  });

  it("calls onCircuitNameChange when name input changes", () => {
    render(<TopBar {...defaultProps} />);

    const input = screen.getByDisplayValue("Untitled Circuit");
    fireEvent.change(input, { target: { value: "LED Blink" } });

    expect(defaultProps.onCircuitNameChange).toHaveBeenCalledWith("LED Blink");
  });

  it("renders simulation control buttons", () => {
    render(<TopBar {...defaultProps} />);

    expect(screen.getByText("▶")).toBeInTheDocument();
    expect(screen.getByText("⬛")).toBeInTheDocument();
  });

  it("renders the circuit name input with a pencil icon", () => {
    render(<TopBar {...defaultProps} />);

    const nameInput = screen.getByDisplayValue("Untitled Circuit");
    expect(nameInput).toBeInTheDocument();
    // The pencil icon is rendered as an SVG or text sibling
    expect(screen.getByLabelText("Edit circuit name")).toBeInTheDocument();
  });

  it("renders export placeholder button", () => {
    render(<TopBar {...defaultProps} />);

    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("has fixed height of 48px", () => {
    render(<TopBar {...defaultProps} />);

    const topBar = screen.getByTestId("top-bar");
    expect(topBar.style.height).toBe("48px");
  });

  it("has dark background color", () => {
    render(<TopBar {...defaultProps} />);

    const topBar = screen.getByTestId("top-bar");
    expect(topBar.style.backgroundColor).toBe("rgb(26, 26, 46)"); // #1a1a2e
  });

  it("renders undo and redo buttons", () => {
    render(
      <TopBar
        {...defaultProps}
        canUndo={true}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Undo")).toBeInTheDocument();
    expect(screen.getByLabelText("Redo")).toBeInTheDocument();
  });

  it("disables undo button when canUndo is false", () => {
    render(
      <TopBar
        {...defaultProps}
        canUndo={false}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Undo")).toBeDisabled();
  });

  it("disables redo button when canRedo is false", () => {
    render(
      <TopBar
        {...defaultProps}
        canUndo={true}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Redo")).toBeDisabled();
  });

  it("calls onUndo when undo button is clicked", () => {
    const onUndo = vi.fn();
    render(
      <TopBar
        {...defaultProps}
        canUndo={true}
        canRedo={false}
        onUndo={onUndo}
        onRedo={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Undo"));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("calls onRedo when redo button is clicked", () => {
    const onRedo = vi.fn();
    render(
      <TopBar
        {...defaultProps}
        canUndo={true}
        canRedo={true}
        onUndo={vi.fn()}
        onRedo={onRedo}
      />,
    );

    fireEvent.click(screen.getByLabelText("Redo"));
    expect(onRedo).toHaveBeenCalledOnce();
  });
});
