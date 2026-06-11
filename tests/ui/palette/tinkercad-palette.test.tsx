import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TinkercadPalette } from "../../../src/ui/palette/TinkercadPalette";
import { addRecentlyUsed } from "../../../src/ui/palette/recentlyUsed";

describe("TinkercadPalette", () => {
  const onDragStart = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    onDragStart.mockClear();
  });

  it("renders search bar at top", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    const searchInput = screen.getByPlaceholderText("Search components...");
    expect(searchInput).toBeInTheDocument();
  });

  it("renders all category headers", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Inputs")).toBeInTheDocument();
    expect(screen.getByText("Outputs")).toBeInTheDocument();
    expect(screen.getByText("Displays")).toBeInTheDocument();
    expect(screen.getByText("ICs")).toBeInTheDocument();
    expect(screen.getByText("Power")).toBeInTheDocument();
  });

  it("renders component items under categories", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    // Some items from Basic category
    expect(screen.getByText("LED")).toBeInTheDocument();
    expect(screen.getByText("Resistor")).toBeInTheDocument();
    expect(screen.getByText("Capacitor")).toBeInTheDocument();
  });

  it("collapses a category when its header is clicked", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    // All categories start expanded — there should be ▼ symbols (6 categories)
    const expandedCount = screen.queryAllByText("▼").length;
    expect(expandedCount).toBe(6); // 6 categories, all expanded

    // Click Basic header to collapse
    fireEvent.click(screen.getByTestId("category-header-Basic"));

    // Now one category is collapsed: 5 ▼ + 1 ▶ from collapsed Basic
    // But note: Diode icon is also "▶" so we check the specific category
    expect(screen.getByTestId("category-header-Basic").textContent).toContain("▶");
  });

  it("expands a collapsed category when clicked again", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    // Collapse Basic
    fireEvent.click(screen.getByTestId("category-header-Basic"));
    expect(screen.getByTestId("category-header-Basic").textContent).toContain("▶");

    // Expand Basic
    fireEvent.click(screen.getByTestId("category-header-Basic"));
    expect(screen.getByTestId("category-header-Basic").textContent).toContain("▼");
  });

  it("filters components when search query is entered", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    const searchInput = screen.getByPlaceholderText("Search components...");
    fireEvent.change(searchInput, { target: { value: "resistor" } });

    // Resistor should be visible, but many other items should be filtered
    expect(screen.getByText("Resistor")).toBeInTheDocument();
    // LED should be filtered out (no match for "resistor")
    expect(screen.queryByText("LED")).not.toBeInTheDocument();
  });

  it("shows no results message when search matches nothing", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    const searchInput = screen.getByPlaceholderText("Search components...");
    fireEvent.change(searchInput, { target: { value: "xyz123" } });

    expect(screen.getByText("No components found")).toBeInTheDocument();
  });

  it("shows Recently Used section when items exist", () => {
    addRecentlyUsed("led");
    addRecentlyUsed("resistor");

    render(<TinkercadPalette onDragStart={onDragStart} />);

    expect(screen.getByText("Recently Used")).toBeInTheDocument();
  });

  it("does not show Recently Used section when no items exist", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    expect(screen.queryByText("Recently Used")).not.toBeInTheDocument();
  });

  it("renders draggable items", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    // Find a draggable item — items should have draggable attribute
    const ledItem = screen.getByText("LED");
    const parentEl = ledItem.closest("[draggable]");
    expect(parentEl).toBeTruthy();
  });

  it("calls onDragStart with correct component type", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    const ledItem = screen.getByText("LED");
    const parentEl = ledItem.closest("[draggable]")!;
    
    fireEvent.dragStart(parentEl);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    // Second argument should be the component type
    expect(onDragStart.mock.calls[0][1]).toBe("led");
  });

  it("renders all Basic category items", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    expect(screen.getByText("LED")).toBeInTheDocument();
    expect(screen.getByText("Resistor")).toBeInTheDocument();
    expect(screen.getByText("Capacitor")).toBeInTheDocument();
    expect(screen.getByText("Pushbutton")).toBeInTheDocument();
    expect(screen.getByText("Diode")).toBeInTheDocument();
    expect(screen.getByText("Transistor")).toBeInTheDocument();
  });

  it("renders Input category items", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    expect(screen.getByText("Potentiometer")).toBeInTheDocument();
    expect(screen.getByText("Photoresistor")).toBeInTheDocument();
    expect(screen.getByText("Temp Sensor")).toBeInTheDocument();
  });

  it("renders Output category items", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    expect(screen.getByText("Buzzer")).toBeInTheDocument();
    expect(screen.getByText("Servo")).toBeInTheDocument();
    expect(screen.getByText("DC Motor")).toBeInTheDocument();
  });

  it("clears search when input is cleared", () => {
    render(<TinkercadPalette onDragStart={onDragStart} />);

    const searchInput = screen.getByPlaceholderText("Search components...");
    
    // Type search
    fireEvent.change(searchInput, { target: { value: "resistor" } });
    expect(screen.queryByText("LED")).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("LED")).toBeInTheDocument();
  });
});
