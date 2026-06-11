import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CustomValueInput } from "../../../src/ui/properties/CustomValueInput";
import type { PropertySchema } from "../../../src/ui/properties/schemas";

describe("CustomValueInput", () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    onSubmit.mockClear();
    onCancel.mockClear();
  });

  const resistorSchema: PropertySchema = {
    key: "resistance",
    label: "Resistance",
    type: "dropdown",
    options: [
      { label: "220Ω", value: "220" },
      { label: "1kΩ", value: "1000" },
    ],
    defaultValue: "1000",
    parseValue: (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(MΩ|M|kΩ|k|Ω)?$/);
      if (!match) return null;
      const val = parseFloat(match[1]);
      const unit = match[2] || "";
      if (isNaN(val)) return null;
      switch (unit) {
        case "MΩ":
        case "M":
          return val * 1_000_000;
        case "kΩ":
        case "k":
          return val * 1_000;
        case "Ω":
        case "":
          return val;
        default:
          return null;
      }
    },
    validate: (v: unknown): boolean => {
      if (typeof v === "number") return v > 0;
      if (typeof v === "string") return true; // strings will be parsed
      return false;
    },
  };

  const capacitorSchema: PropertySchema = {
    key: "capacitance",
    label: "Capacitance",
    type: "dropdown",
    options: [
      { label: "100pF", value: "1e-10" },
      { label: "1μF", value: "1e-6" },
    ],
    defaultValue: "1e-7",
    parseValue: (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(mF|μF|uF|nF|pF)?$/);
      if (!match) return null;
      const val = parseFloat(match[1]);
      const unit = match[2] || "pF";
      if (isNaN(val)) return null;
      switch (unit) {
        case "mF":
          return val * 1e-3;
        case "μF":
        case "uF":
          return val * 1e-6;
        case "nF":
          return val * 1e-9;
        case "pF":
          return val * 1e-12;
        default:
          return null;
      }
    },
    validate: (v: unknown): boolean => {
      if (typeof v === "number") return v > 0;
      return false;
    },
  };

  it("renders a text input for custom value entry", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    expect(input).toBeInTheDocument();
  });

  it("renders submit and cancel buttons", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    // Submit = checkmark, Cancel = X
    expect(screen.getByTitle("Confirm")).toBeInTheDocument();
    expect(screen.getByTitle("Cancel")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByTitle("Cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("parses resistor value '470' to 470 and calls onSubmit", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "470" } });
    fireEvent.click(screen.getByTitle("Confirm"));

    expect(onSubmit).toHaveBeenCalledWith(470);
  });

  it("parses resistor value '4.7k' to 4700 and calls onSubmit", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "4.7k" } });
    fireEvent.click(screen.getByTitle("Confirm"));

    expect(onSubmit).toHaveBeenCalledWith(4700);
  });

  it("parses resistor value '1M' to 1000000", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "1M" } });
    fireEvent.click(screen.getByTitle("Confirm"));

    expect(onSubmit).toHaveBeenCalledWith(1_000_000);
  });

  it("shows validation error for invalid resistor value 'abc'", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.click(screen.getByTitle("Confirm"));

    expect(screen.getByText("Invalid value")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows validation error for empty input", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByTitle("Confirm"));

    expect(screen.getByText("Invalid value")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("parses capacitor value '100pF' to 1e-10", () => {
    render(
      <CustomValueInput
        schema={capacitorSchema}
        previousValue="1e-7"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "100pF" } });
    fireEvent.click(screen.getByTitle("Confirm"));

    expect(onSubmit).toHaveBeenCalledWith(1e-10);
  });

  it("parses capacitor value '10nF' to 1e-8", () => {
    render(
      <CustomValueInput
        schema={capacitorSchema}
        previousValue="1e-7"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "10nF" } });
    fireEvent.click(screen.getByTitle("Confirm"));

    expect(onSubmit).toHaveBeenCalledWith(1e-8);
  });

  it("parses capacitor value '1μF' to 1e-6", () => {
    render(
      <CustomValueInput
        schema={capacitorSchema}
        previousValue="1e-7"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "1μF" } });
    fireEvent.click(screen.getByTitle("Confirm"));

    expect(onSubmit).toHaveBeenCalledWith(1e-6);
  });

  it("submits on Enter key press", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "3.3k" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSubmit).toHaveBeenCalledWith(3300);
  });

  it("cancels on Escape key press", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("clears error message when user starts typing again", () => {
    render(
      <CustomValueInput
        schema={resistorSchema}
        previousValue="1000"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    // Trigger error
    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.click(screen.getByTitle("Confirm"));
    expect(screen.getByText("Invalid value")).toBeInTheDocument();

    // Start typing again — error should clear
    fireEvent.change(input, { target: { value: "470" } });
    expect(screen.queryByText("Invalid value")).not.toBeInTheDocument();
  });

  it("works without parseValue — submits raw string for schemas without parser", () => {
    const noParseSchema: PropertySchema = {
      key: "voltage",
      label: "Voltage",
      type: "dropdown",
      options: [],
      defaultValue: "5",
    };

    render(
      <CustomValueInput
        schema={noParseSchema}
        previousValue="5"
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("Enter custom value...");
    fireEvent.change(input, { target: { value: "7.5" } });
    fireEvent.click(screen.getByTitle("Confirm"));

    expect(onSubmit).toHaveBeenCalledWith("7.5");
  });
});
