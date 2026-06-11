import { describe, it, expect } from "vitest";
import {
  type PropertySchema,
  SCHEMA_MAP,
  parseResistanceValue,
  parseCapacitanceValue,
} from "../../../src/ui/properties/schemas";

describe("PropertySchema type", () => {
  it("accepts valid dropdown schema", () => {
    const schema: PropertySchema = {
      key: "resistance",
      label: "Resistance",
      type: "dropdown",
      options: [
        { label: "220Ω", value: "220" },
        { label: "1kΩ", value: "1000" },
      ],
      defaultValue: "1000",
    };

    expect(schema.type).toBe("dropdown");
    expect(schema.options).toHaveLength(2);
    expect(schema.defaultValue).toBe("1000");
  });

  it("accepts valid slider schema", () => {
    const schema: PropertySchema = {
      key: "position",
      label: "Position",
      type: "slider",
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      defaultValue: 50,
    };

    expect(schema.type).toBe("slider");
    expect(schema.min).toBe(0);
    expect(schema.max).toBe(100);
  });
});

describe("parseResistanceValue", () => {
  it("parses plain number as ohms", () => {
    expect(parseResistanceValue("100")).toBe(100);
  });

  it("parses value with Ω suffix", () => {
    expect(parseResistanceValue("220Ω")).toBe(220);
  });

  it("parses value with kΩ suffix (kiloohms)", () => {
    expect(parseResistanceValue("1kΩ")).toBe(1000);
  });

  it("parses value with k suffix", () => {
    expect(parseResistanceValue("4.7k")).toBe(4700);
  });

  it("parses value with MΩ suffix (megaohms)", () => {
    expect(parseResistanceValue("1MΩ")).toBe(1000000);
  });

  it("parses value with M suffix", () => {
    expect(parseResistanceValue("2.2M")).toBe(2200000);
  });

  it("parses decimal kΩ value", () => {
    expect(parseResistanceValue("3.3kΩ")).toBe(3300);
  });

  it("returns null for invalid input", () => {
    expect(parseResistanceValue("abc")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseResistanceValue("")).toBeNull();
  });

  it("parses plain number with Ω symbol only", () => {
    expect(parseResistanceValue("47Ω")).toBe(47);
  });
});

describe("parseCapacitanceValue", () => {
  it("parses value with pF suffix (picofarads)", () => {
    expect(parseCapacitanceValue("100pF")).toBeCloseTo(100e-12, 20);
  });

  it("parses value with nF suffix (nanofarads)", () => {
    expect(parseCapacitanceValue("10nF")).toBeCloseTo(10e-9, 15);
  });

  it("parses value with μF suffix (microfarads)", () => {
    expect(parseCapacitanceValue("1μF")).toBeCloseTo(1e-6, 15);
  });

  it("parses value with uF suffix (microfarads alternate)", () => {
    expect(parseCapacitanceValue("10uF")).toBeCloseTo(10e-6, 15);
  });

  it("parses value with mF suffix (millifarads)", () => {
    expect(parseCapacitanceValue("1mF")).toBeCloseTo(1e-3, 15);
  });

  it("parses plain number as picofarads (default unit)", () => {
    expect(parseCapacitanceValue("47")).toBeCloseTo(47e-12, 20);
  });

  it("returns null for invalid input", () => {
    expect(parseCapacitanceValue("xyz")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseCapacitanceValue("")).toBeNull();
  });
});

describe("SCHEMA_MAP completeness", () => {
  const expectedTypes = [
    "resistor",
    "capacitor",
    "led",
    "potentiometer",
    "buzzer",
    "rgb-led",
    "servo",
    "photoresistor",
    "temperature-sensor",
    "lcd-display",
    "power-supply",
    "dc-motor",
  ];

  it("contains schemas for all 12 component types", () => {
    for (const type of expectedTypes) {
      expect(SCHEMA_MAP).toHaveProperty(type);
      expect(SCHEMA_MAP[type]).toBeDefined();
      expect(Array.isArray(SCHEMA_MAP[type])).toBe(true);
      expect(SCHEMA_MAP[type].length).toBeGreaterThan(0);
    }
  });

  it("every schema entry has required fields", () => {
    for (const type of expectedTypes) {
      for (const schema of SCHEMA_MAP[type]) {
        expect(schema.key).toBeTruthy();
        expect(schema.label).toBeTruthy();
        expect(["dropdown", "number", "color", "slider", "text"]).toContain(schema.type);
        expect(schema.defaultValue).toBeDefined();
      }
    }
  });

  it("resistor schema has E12 series dropdown", () => {
    const resistorSchema = SCHEMA_MAP["resistor"];
    const dropdownField = resistorSchema.find((s) => s.type === "dropdown");
    expect(dropdownField).toBeDefined();
    expect(dropdownField!.key).toBe("resistance");

    const e12Values = ["1", "10", "100", "220", "330", "470", "1000", "2200", "4700", "10000", "47000", "100000", "1000000"];
    const optionValues = dropdownField!.options!.map((o) => o.value);
    for (const v of e12Values) {
      expect(optionValues).toContain(v);
    }
  });

  it("capacitor schema has standard values dropdown", () => {
    const capSchema = SCHEMA_MAP["capacitor"];
    const dropdownField = capSchema.find((s) => s.type === "dropdown");
    expect(dropdownField).toBeDefined();
    expect(dropdownField!.key).toBe("capacitance");
    expect(dropdownField!.options!.length).toBeGreaterThan(0);
  });

  it("led schema has color selector", () => {
    const ledSchema = SCHEMA_MAP["led"];
    const colorField = ledSchema.find((s) => s.type === "color");
    expect(colorField).toBeDefined();
    expect(colorField!.key).toBe("color");
    expect(colorField!.options).toBeDefined();
    const colorValues = colorField!.options!.map((o) => o.value);
    expect(colorValues).toContain("#ff0000"); // red
    expect(colorValues).toContain("#00ff00"); // green
    expect(colorValues).toContain("#0000ff"); // blue
  });

  it("potentiometer schema has position slider", () => {
    const potSchema = SCHEMA_MAP["potentiometer"];
    const sliderField = potSchema.find((s) => s.type === "slider");
    expect(sliderField).toBeDefined();
    expect(sliderField!.key).toBe("position");
    expect(sliderField!.min).toBe(0);
    expect(sliderField!.max).toBe(100);
  });

  it("buzzer schema has frequency and tone type", () => {
    const buzzerSchema = SCHEMA_MAP["buzzer"];
    const freqField = buzzerSchema.find((s) => s.key === "frequency");
    expect(freqField).toBeDefined();
    const toneField = buzzerSchema.find((s) => s.key === "toneType");
    expect(toneField).toBeDefined();
  });

  it("rgb-led schema has three color selectors", () => {
    const rgbSchema = SCHEMA_MAP["rgb-led"];
    const colorFields = rgbSchema.filter((s) => s.type === "color");
    expect(colorFields).toHaveLength(3);
    const keys = colorFields.map((f) => f.key);
    expect(keys).toContain("colorR");
    expect(keys).toContain("colorG");
    expect(keys).toContain("colorB");
  });

  it("servo schema has min and max angle", () => {
    const servoSchema = SCHEMA_MAP["servo"];
    const minField = servoSchema.find((s) => s.key === "minAngle");
    expect(minField).toBeDefined();
    expect(minField!.type).toBe("number");
    const maxField = servoSchema.find((s) => s.key === "maxAngle");
    expect(maxField).toBeDefined();
    expect(maxField!.type).toBe("number");
  });

  it("power-supply schema has voltage selector", () => {
    const psSchema = SCHEMA_MAP["power-supply"];
    const voltageField = psSchema.find((s) => s.key === "voltage");
    expect(voltageField).toBeDefined();
    expect(voltageField!.type).toBe("dropdown");
    const voltageValues = voltageField!.options!.map((o) => o.value);
    expect(voltageValues).toContain("3.3");
    expect(voltageValues).toContain("5");
    expect(voltageValues).toContain("9");
    expect(voltageValues).toContain("12");
  });
});
