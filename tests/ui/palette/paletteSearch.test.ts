import { describe, it, expect } from "vitest";
import { filterComponents } from "../../../src/ui/palette/paletteSearch";

interface PaletteItem {
  type: string;
  label: string;
}

interface PaletteCategory {
  name: string;
  items: PaletteItem[];
}

const CATEGORIES: PaletteCategory[] = [
  {
    name: "Basic",
    items: [
      { type: "led", label: "LED" },
      { type: "resistor", label: "Resistor" },
      { type: "capacitor", label: "Capacitor" },
      { type: "pushbutton", label: "Pushbutton" },
      { type: "diode", label: "Diode" },
      { type: "transistor", label: "Transistor" },
    ],
  },
  {
    name: "Inputs",
    items: [
      { type: "potentiometer", label: "Potentiometer" },
      { type: "photoresistor", label: "Photoresistor" },
      { type: "temperature-sensor", label: "Temperature Sensor" },
    ],
  },
  {
    name: "Outputs",
    items: [
      { type: "buzzer", label: "Buzzer" },
      { type: "servo", label: "Servo" },
      { type: "dc-motor", label: "DC Motor" },
    ],
  },
  {
    name: "Displays",
    items: [
      { type: "lcd-display", label: "LCD Display" },
      { type: "rgb-led", label: "RGB LED" },
    ],
  },
  {
    name: "ICs",
    items: [
      { type: "shift-register", label: "Shift Register" },
    ],
  },
  {
    name: "Power",
    items: [
      { type: "usb-connector", label: "USB Connector" },
    ],
  },
];

describe("filterComponents", () => {
  it("returns all categories when query is empty", () => {
    const result = filterComponents("", CATEGORIES);
    expect(result).toHaveLength(CATEGORIES.length);
    expect(result[0].items).toHaveLength(6);
  });

  it("returns all categories when query is whitespace-only", () => {
    const result = filterComponents("   ", CATEGORIES);
    expect(result).toHaveLength(CATEGORIES.length);
  });

  it("filters to exact match — 'LED' matches LED and RGB LED", () => {
    const result = filterComponents("LED", CATEGORIES);
    const flatItems = result.flatMap((c) => c.items);
    // LED should be found
    const hasLed = flatItems.some((i) => i.type === "led");
    expect(hasLed).toBe(true);
    // RGB LED also matches because it contains "LED"
    const hasRgbLed = flatItems.some((i) => i.type === "rgb-led");
    expect(hasRgbLed).toBe(true);
  });

  it("filters case-insensitively", () => {
    const result = filterComponents("led", CATEGORIES);
    const flatItems = result.flatMap((c) => c.items);
    // "led" should match LED and RGB LED
    const hasLed = flatItems.some((i) => i.type === "led");
    expect(hasLed).toBe(true);
    expect(flatItems.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by fuzzy match — 'res' matches 'Resistor' and 'Photoresistor'", () => {
    const result = filterComponents("res", CATEGORIES);
    const flatItems = result.flatMap((c) => c.items);
    // "res" should at minimum match Resistor
    const hasResistor = flatItems.some((i) => i.type === "resistor");
    expect(hasResistor).toBe(true);
  });

  it("fuzzy match — 'rs' matches items with r followed by s", () => {
    const result = filterComponents("rs", CATEGORIES);
    const flatItems = result.flatMap((c) => c.items);
    // Should match Resistor (R-e-s-i-s-t-o-r) since r then s appear in order
    const hasResistor = flatItems.some((i) => i.type === "resistor");
    expect(hasResistor).toBe(true);
  });

  it("filters across multiple categories", () => {
    const result = filterComponents("sensor", CATEGORIES);
    // Should find "Temperature Sensor" in Inputs
    expect(result.length).toBeGreaterThanOrEqual(1);
    const flatItems = result.flatMap((c) => c.items);
    expect(flatItems.some((i) => i.type === "temperature-sensor")).toBe(true);
  });

  it("returns empty array when no matches found", () => {
    const result = filterComponents("xyz123", CATEGORIES);
    expect(result).toEqual([]);
  });

  it("excludes categories with no matching items", () => {
    const result = filterComponents("buzzer", CATEGORIES);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Outputs");
  });

  it("matches partial name — 'cap' matches 'Capacitor'", () => {
    const result = filterComponents("cap", CATEGORIES);
    expect(result).toHaveLength(1);
    expect(result[0].items[0].type).toBe("capacitor");
  });

  it("matches multiple items in same category", () => {
    const result = filterComponents("r", CATEGORIES);
    // 'r' should match Resistor, Transistor, Photoresistor, etc.
    const flatItems = result.flatMap((c) => c.items);
    expect(flatItems.length).toBeGreaterThan(1);
  });

  it("handles items with spaces in label", () => {
    const result = filterComponents("dc motor", CATEGORIES);
    expect(result).toHaveLength(1);
    expect(result[0].items[0].type).toBe("dc-motor");
  });

  it("fuzzy matches — 'dcm' matches 'DC Motor'", () => {
    const result = filterComponents("dcm", CATEGORIES);
    expect(result).toHaveLength(1);
    expect(result[0].items[0].type).toBe("dc-motor");
  });
});
