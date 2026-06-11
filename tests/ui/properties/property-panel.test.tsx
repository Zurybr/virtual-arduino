import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyPanel } from "../../../src/ui/properties/PropertyPanel";
import type { PlacedComponent } from "../../../src/ui/workspace/types";

describe("PropertyPanel", () => {
  const onPropertyChange = vi.fn();

  beforeEach(() => {
    onPropertyChange.mockClear();
  });

  it("shows placeholder when no component is selected", () => {
    render(
      <PropertyPanel
        selectedComponent={null}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(
      screen.getByText("Select a component to edit properties"),
    ).toBeInTheDocument();
  });

  it("shows component type label in header when component is selected", () => {
    const led: PlacedComponent = {
      id: "led-1",
      type: "led",
      x: 100,
      y: 200,
      rotation: 0,
      state: { color: "#ff0000" },
    };

    render(
      <PropertyPanel
        selectedComponent={led}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(screen.getByText("LED")).toBeInTheDocument();
  });

  it("renders PropertyField for each schema entry", () => {
    const resistor: PlacedComponent = {
      id: "resistor-1",
      type: "resistor",
      x: 100,
      y: 200,
      rotation: 0,
      state: { resistance: 1000 },
    };

    render(
      <PropertyPanel
        selectedComponent={resistor}
        onPropertyChange={onPropertyChange}
      />,
    );

    // Resistor has a "Resistance" field
    expect(screen.getByLabelText("Resistance")).toBeInTheDocument();
  });

  it("renders multiple fields for multi-schema components", () => {
    const potentiometer: PlacedComponent = {
      id: "pot-1",
      type: "potentiometer",
      x: 100,
      y: 200,
      rotation: 0,
      state: { maxResistance: 10000, position: 50 },
    };

    render(
      <PropertyPanel
        selectedComponent={potentiometer}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(screen.getByLabelText("Max Resistance")).toBeInTheDocument();
    expect(screen.getByLabelText("Position")).toBeInTheDocument();
  });

  it("shows close button in header when onClose is provided", () => {
    const led: PlacedComponent = {
      id: "led-1",
      type: "led",
      x: 100,
      y: 200,
      rotation: 0,
      state: { color: "#ff0000" },
    };

    render(
      <PropertyPanel
        selectedComponent={led}
        onPropertyChange={onPropertyChange}
        onClose={() => {}}
      />,
    );

    expect(screen.getByTitle("Close")).toBeInTheDocument();
  });

  it("does not show close button when onClose is not provided", () => {
    const led: PlacedComponent = {
      id: "led-1",
      type: "led",
      x: 100,
      y: 200,
      rotation: 0,
      state: { color: "#ff0000" },
    };

    render(
      <PropertyPanel
        selectedComponent={led}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(screen.queryByTitle("Close")).not.toBeInTheDocument();
  });

  it("shows 'No editable properties' for component type without schema", () => {
    const unknown: PlacedComponent = {
      id: "unknown-1",
      type: "mystery-device",
      x: 100,
      y: 200,
      rotation: 0,
      state: {},
    };

    render(
      <PropertyPanel
        selectedComponent={unknown}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(
      screen.getByText("No editable properties"),
    ).toBeInTheDocument();
  });

  it("renders LED color fields", () => {
    const led: PlacedComponent = {
      id: "led-1",
      type: "led",
      x: 100,
      y: 200,
      rotation: 0,
      state: { color: "#ff0000" },
    };

    render(
      <PropertyPanel
        selectedComponent={led}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(screen.getByLabelText("Custom color")).toBeInTheDocument();
    expect(screen.getByTitle("Red")).toBeInTheDocument();
    expect(screen.getByTitle("Green")).toBeInTheDocument();
  });

  it("renders buzzer with frequency and tone type fields", () => {
    const buzzer: PlacedComponent = {
      id: "buzzer-1",
      type: "buzzer",
      x: 100,
      y: 200,
      rotation: 0,
      state: { frequency: 1000, toneType: "active" },
    };

    render(
      <PropertyPanel
        selectedComponent={buzzer}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(screen.getByLabelText("Frequency")).toBeInTheDocument();
    expect(screen.getByLabelText("Tone Type")).toBeInTheDocument();
  });

  it("renders RGB LED with three color selectors", () => {
    const rgbLed: PlacedComponent = {
      id: "rgb-1",
      type: "rgb-led",
      x: 100,
      y: 200,
      rotation: 0,
      state: { colorR: "#ff0000", colorG: "#00ff00", colorB: "#0000ff" },
    };

    render(
      <PropertyPanel
        selectedComponent={rgbLed}
        onPropertyChange={onPropertyChange}
      />,
    );

    // Three color labels
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText("Green")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
  });

  it("renders servo with min and max angle fields", () => {
    const servo: PlacedComponent = {
      id: "servo-1",
      type: "servo",
      x: 100,
      y: 200,
      rotation: 0,
      state: { minAngle: 0, maxAngle: 180 },
    };

    render(
      <PropertyPanel
        selectedComponent={servo}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(screen.getByLabelText("Min Angle")).toBeInTheDocument();
    expect(screen.getByLabelText("Max Angle")).toBeInTheDocument();
  });

  it("renders LCD display with columns and rows", () => {
    const lcd: PlacedComponent = {
      id: "lcd-1",
      type: "lcd-display",
      x: 100,
      y: 200,
      rotation: 0,
      state: { columns: 16, rows: 2 },
    };

    render(
      <PropertyPanel
        selectedComponent={lcd}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(screen.getByLabelText("Columns")).toBeInTheDocument();
    expect(screen.getByLabelText("Rows")).toBeInTheDocument();
  });

  it("renders power supply with voltage dropdown", () => {
    const psu: PlacedComponent = {
      id: "psu-1",
      type: "power-supply",
      x: 100,
      y: 200,
      rotation: 0,
      state: { voltage: "5" },
    };

    render(
      <PropertyPanel
        selectedComponent={psu}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(screen.getByLabelText("Voltage")).toBeInTheDocument();
  });

  it("uses component type display name for header", () => {
    const tempSensor: PlacedComponent = {
      id: "temp-1",
      type: "temperature-sensor",
      x: 100,
      y: 200,
      rotation: 0,
      state: { sensorType: "tmp36" },
    };

    render(
      <PropertyPanel
        selectedComponent={tempSensor}
        onPropertyChange={onPropertyChange}
      />,
    );

    expect(screen.getByText("Temperature Sensor")).toBeInTheDocument();
  });
});
