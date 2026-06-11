import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PinTooltip } from "../../../src/ui/workspace/PinTooltip";

describe("PinTooltip", () => {
  beforeEach(() => {
    // Clean up any portals
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render nothing when not visible", () => {
    const { container } = render(
      <PinTooltip
        visible={false}
        x={100}
        y={200}
        label="D7"
      />,
    );
    // The tooltip should not be visible
    expect(container.innerHTML).toBe("");
  });

  it("should render the pin label when visible", () => {
    render(
      <PinTooltip
        visible={true}
        x={100}
        y={200}
        label="D7"
      />,
    );

    const tooltip = screen.getByTestId("pin-tooltip");
    expect(tooltip).toBeTruthy();
    expect(tooltip.textContent).toContain("D7");
  });

  it("should render at the specified position", () => {
    render(
      <PinTooltip
        visible={true}
        x={300}
        y={400}
        label="A0"
      />,
    );

    const tooltip = screen.getByTestId("pin-tooltip");
    expect(tooltip.style.left).toBe("300px");
    expect(tooltip.style.top).toBe("400px");
  });

  it("should render different pin labels", () => {
    render(
      <PinTooltip
        visible={true}
        x={100}
        y={100}
        label="5V"
      />,
    );

    const tooltip = screen.getByTestId("pin-tooltip");
    expect(tooltip.textContent).toContain("5V");
  });

  it("should render GND label correctly", () => {
    render(
      <PinTooltip
        visible={true}
        x={50}
        y={75}
        label="GND"
      />,
    );

    const tooltip = screen.getByTestId("pin-tooltip");
    expect(tooltip.textContent).toContain("GND");
  });

  it("should have dark background styling", () => {
    render(
      <PinTooltip
        visible={true}
        x={100}
        y={200}
        label="D7"
      />,
    );

    const tooltip = screen.getByTestId("pin-tooltip");
    // Dark background
    expect(tooltip.style.backgroundColor).toBeTruthy();
  });
});
