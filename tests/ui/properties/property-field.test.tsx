import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropertyField } from "../../../src/ui/properties/PropertyField";
import type { PropertySchema } from "../../../src/ui/properties/schemas";

describe("PropertyField", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  // -----------------------------------------------------------------------
  // Dropdown
  // -----------------------------------------------------------------------

  describe("dropdown type", () => {
    const dropdownSchema: PropertySchema = {
      key: "resistance",
      label: "Resistance",
      type: "dropdown",
      options: [
        { label: "220Ω", value: "220" },
        { label: "470Ω", value: "470" },
        { label: "1kΩ", value: "1000" },
      ],
      defaultValue: "1000",
    };

    it("renders a select element with all options plus Custom...", () => {
      render(
        <PropertyField
          schema={dropdownSchema}
          value="1000"
          onChange={onChange}
        />,
      );

      const select = screen.getByLabelText("Resistance") as HTMLSelectElement;
      expect(select).toBeInTheDocument();

      // Options: 3 defined + "Custom..." sentinel
      expect(select.options.length).toBe(4);
      expect(select.options[0].text).toBe("220Ω");
      expect(select.options[1].text).toBe("470Ω");
      expect(select.options[2].text).toBe("1kΩ");
      expect(select.options[3].text).toBe("Custom...");
    });

    it("selects the matching option for current value", () => {
      render(
        <PropertyField
          schema={dropdownSchema}
          value="470"
          onChange={onChange}
        />,
      );

      const select = screen.getByLabelText("Resistance") as HTMLSelectElement;
      expect(select.value).toBe("470");
    });

    it("selects Custom... when value does not match any option", () => {
      render(
        <PropertyField
          schema={dropdownSchema}
          value="9999"
          onChange={onChange}
        />,
      );

      const select = screen.getByLabelText("Resistance") as HTMLSelectElement;
      expect(select.value).toBe("__custom__");
    });

    it("calls onChange when a predefined option is selected", () => {
      render(
        <PropertyField
          schema={dropdownSchema}
          value="1000"
          onChange={onChange}
        />,
      );

      const select = screen.getByLabelText("Resistance");
      fireEvent.change(select, { target: { value: "470" } });

      expect(onChange).toHaveBeenCalledWith("470");
    });

    it("calls onChange with __custom__ when Custom is selected", () => {
      render(
        <PropertyField
          schema={dropdownSchema}
          value="1000"
          onChange={onChange}
        />,
      );

      const select = screen.getByLabelText("Resistance");
      fireEvent.change(select, { target: { value: "__custom__" } });

      expect(onChange).toHaveBeenCalledWith("__custom__");
    });

    it("displays the label text", () => {
      render(
        <PropertyField
          schema={dropdownSchema}
          value="1000"
          onChange={onChange}
        />,
      );

      expect(screen.getByText("Resistance")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Number
  // -----------------------------------------------------------------------

  describe("number type", () => {
    const numberSchema: PropertySchema = {
      key: "frequency",
      label: "Frequency",
      type: "number",
      unit: "Hz",
      min: 20,
      max: 20000,
      step: 1,
      defaultValue: 1000,
    };

    it("renders an input[type=number] with min/max/step attributes", () => {
      render(
        <PropertyField
          schema={numberSchema}
          value={1000}
          onChange={onChange}
        />,
      );

      const input = screen.getByLabelText("Frequency") as HTMLInputElement;
      expect(input.type).toBe("number");
      expect(input.min).toBe("20");
      expect(input.max).toBe("20000");
      expect(input.step).toBe("1");
    });

    it("displays the current numeric value", () => {
      render(
        <PropertyField
          schema={numberSchema}
          value={440}
          onChange={onChange}
        />,
      );

      const input = screen.getByLabelText("Frequency") as HTMLInputElement;
      expect(input.value).toBe("440");
    });

    it("calls onChange when value changes", () => {
      render(
        <PropertyField
          schema={numberSchema}
          value={1000}
          onChange={onChange}
        />,
      );

      const input = screen.getByLabelText("Frequency");
      fireEvent.change(input, { target: { value: "440" } });

      expect(onChange).toHaveBeenCalledWith(440);
    });

    it("displays the unit when provided", () => {
      render(
        <PropertyField
          schema={numberSchema}
          value={1000}
          onChange={onChange}
        />,
      );

      expect(screen.getByText("Hz")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Color
  // -----------------------------------------------------------------------

  describe("color type", () => {
    const colorSchema: PropertySchema = {
      key: "color",
      label: "Color",
      type: "color",
      options: [
        { label: "Red", value: "#ff0000" },
        { label: "Green", value: "#00ff00" },
        { label: "Blue", value: "#0000ff" },
      ],
      defaultValue: "#ff0000",
    };

    it("renders color swatches from options", () => {
      render(
        <PropertyField
          schema={colorSchema}
          value="#ff0000"
          onChange={onChange}
        />,
      );

      expect(screen.getByTitle("Red")).toBeInTheDocument();
      expect(screen.getByTitle("Green")).toBeInTheDocument();
      expect(screen.getByTitle("Blue")).toBeInTheDocument();
    });

    it("calls onChange when a color swatch is clicked", () => {
      render(
        <PropertyField
          schema={colorSchema}
          value="#ff0000"
          onChange={onChange}
        />,
      );

      fireEvent.click(screen.getByTitle("Green"));

      expect(onChange).toHaveBeenCalledWith("#00ff00");
    });

    it("renders a color input for custom colors", () => {
      render(
        <PropertyField
          schema={colorSchema}
          value="#ff0000"
          onChange={onChange}
        />,
      );

      const input = screen.getByLabelText("Custom color") as HTMLInputElement;
      expect(input.type).toBe("color");
      expect(input.value).toBe("#ff0000");
    });

    it("calls onChange when custom color input changes", () => {
      render(
        <PropertyField
          schema={colorSchema}
          value="#ff0000"
          onChange={onChange}
        />,
      );

      const input = screen.getByLabelText("Custom color");
      fireEvent.change(input, { target: { value: "#abcdef" } });

      expect(onChange).toHaveBeenCalledWith("#abcdef");
    });
  });

  // -----------------------------------------------------------------------
  // Slider
  // -----------------------------------------------------------------------

  describe("slider type", () => {
    const sliderSchema: PropertySchema = {
      key: "position",
      label: "Position",
      type: "slider",
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      defaultValue: 0,
    };

    it("renders a range input with min/max/step", () => {
      render(
        <PropertyField
          schema={sliderSchema}
          value={50}
          onChange={onChange}
        />,
      );

      const input = screen.getByLabelText("Position") as HTMLInputElement;
      expect(input.type).toBe("range");
      expect(input.min).toBe("0");
      expect(input.max).toBe("100");
      expect(input.step).toBe("1");
    });

    it("displays the current value with unit", () => {
      render(
        <PropertyField
          schema={sliderSchema}
          value={75}
          onChange={onChange}
        />,
      );

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("calls onChange when slider is moved", () => {
      render(
        <PropertyField
          schema={sliderSchema}
          value={50}
          onChange={onChange}
        />,
      );

      const input = screen.getByLabelText("Position");
      fireEvent.change(input, { target: { value: "75" } });

      expect(onChange).toHaveBeenCalledWith(75);
    });
  });

  // -----------------------------------------------------------------------
  // Text
  // -----------------------------------------------------------------------

  describe("text type", () => {
    const textSchema: PropertySchema = {
      key: "name",
      label: "Name",
      type: "text",
      defaultValue: "",
    };

    it("renders a text input", () => {
      render(
        <PropertyField
          schema={textSchema}
          value="hello"
          onChange={onChange}
        />,
      );

      const input = screen.getByLabelText("Name") as HTMLInputElement;
      expect(input.type).toBe("text");
      expect(input.value).toBe("hello");
    });

    it("calls onChange when text changes", () => {
      render(
        <PropertyField
          schema={textSchema}
          value=""
          onChange={onChange}
        />,
      );

      const input = screen.getByLabelText("Name");
      fireEvent.change(input, { target: { value: "new name" } });

      expect(onChange).toHaveBeenCalledWith("new name");
    });
  });
});
