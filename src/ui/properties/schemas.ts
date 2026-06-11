/**
 * Property field types for the schema-driven property editor.
 */
export type PropertyFieldType = "dropdown" | "number" | "color" | "slider" | "text";

/**
 * An option in a dropdown or color selector.
 */
export interface PropertyOption {
  label: string;
  value: string;
}

/**
 * Schema definition for a single editable property of a component.
 * Each component type maps to an array of these schemas.
 */
export interface PropertySchema {
  key: string;
  label: string;
  type: PropertyFieldType;
  options?: PropertyOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue: string | number;
  parseValue?: (raw: string) => number | null;
  validate?: (value: unknown) => boolean;
}

// ---------------------------------------------------------------------------
// Value parsers
// ---------------------------------------------------------------------------

/**
 * Parses a human-readable resistance string into ohms (number).
 * Supports: plain number, Ω, kΩ, MΩ (also k, M without Ω).
 * Returns null for invalid input.
 */
export function parseResistanceValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Match: number followed by optional unit (Ω, kΩ, MΩ, k, M)
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(MΩ|M|kΩ|k|Ω)?$/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2] || "";

  if (isNaN(value)) return null;

  switch (unit) {
    case "MΩ":
    case "M":
      return value * 1_000_000;
    case "kΩ":
    case "k":
      return value * 1_000;
    case "Ω":
    case "":
      return value;
    default:
      return null;
  }
}

/**
 * Parses a human-readable capacitance string into farads (number).
 * Supports: pF, nF, μF, uF, mF. Plain number defaults to pF.
 * Returns null for invalid input.
 */
export function parseCapacitanceValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(mF|μF|uF|nF|pF)?$/);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2] || "pF";

  if (isNaN(value)) return null;

  switch (unit) {
    case "mF":
      return value * 1e-3;
    case "μF":
    case "uF":
      return value * 1e-6;
    case "nF":
      return value * 1e-9;
    case "pF":
      return value * 1e-12;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component schemas
// ---------------------------------------------------------------------------

const RESISTOR_SCHEMA: PropertySchema[] = [
  {
    key: "resistance",
    label: "Resistance",
    type: "dropdown",
    options: [
      { label: "1Ω", value: "1" },
      { label: "10Ω", value: "10" },
      { label: "100Ω", value: "100" },
      { label: "220Ω", value: "220" },
      { label: "330Ω", value: "330" },
      { label: "470Ω", value: "470" },
      { label: "1kΩ", value: "1000" },
      { label: "2.2kΩ", value: "2200" },
      { label: "4.7kΩ", value: "4700" },
      { label: "10kΩ", value: "10000" },
      { label: "47kΩ", value: "47000" },
      { label: "100kΩ", value: "100000" },
      { label: "1MΩ", value: "1000000" },
    ],
    defaultValue: "1000",
    parseValue: parseResistanceValue,
    validate: (v: unknown): boolean => {
      if (typeof v === "number") return v > 0;
      if (typeof v === "string") return parseResistanceValue(v) !== null;
      return false;
    },
  },
];

const CAPACITOR_SCHEMA: PropertySchema[] = [
  {
    key: "capacitance",
    label: "Capacitance",
    type: "dropdown",
    options: [
      { label: "1pF", value: "1e-12" },
      { label: "10pF", value: "1e-11" },
      { label: "100pF", value: "1e-10" },
      { label: "1nF", value: "1e-9" },
      { label: "10nF", value: "1e-8" },
      { label: "100nF", value: "1e-7" },
      { label: "1μF", value: "1e-6" },
      { label: "10μF", value: "1e-5" },
      { label: "100μF", value: "1e-4" },
      { label: "1000μF", value: "1e-3" },
    ],
    defaultValue: "1e-7",
    parseValue: parseCapacitanceValue,
    validate: (v: unknown): boolean => {
      if (typeof v === "number") return v > 0;
      if (typeof v === "string") return parseCapacitanceValue(v) !== null;
      return false;
    },
  },
];

const LED_COLORS: PropertyOption[] = [
  { label: "Red", value: "#ff0000" },
  { label: "Green", value: "#00ff00" },
  { label: "Blue", value: "#0000ff" },
  { label: "Yellow", value: "#ffff00" },
  { label: "White", value: "#ffffff" },
  { label: "Orange", value: "#ff8800" },
];

const LED_SCHEMA: PropertySchema[] = [
  {
    key: "color",
    label: "Color",
    type: "color",
    options: LED_COLORS,
    defaultValue: "#ff0000",
  },
];

const POTENTIOMETER_SCHEMA: PropertySchema[] = [
  {
    key: "maxResistance",
    label: "Max Resistance",
    type: "number",
    unit: "Ω",
    defaultValue: 10000,
    validate: (v: unknown): boolean => typeof v === "number" && v > 0,
  },
  {
    key: "position",
    label: "Position",
    type: "slider",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    defaultValue: 0,
  },
];

const BUZZER_SCHEMA: PropertySchema[] = [
  {
    key: "frequency",
    label: "Frequency",
    type: "number",
    unit: "Hz",
    defaultValue: 1000,
    min: 20,
    max: 20000,
    validate: (v: unknown): boolean => typeof v === "number" && v >= 20 && v <= 20000,
  },
  {
    key: "toneType",
    label: "Tone Type",
    type: "dropdown",
    options: [
      { label: "Active", value: "active" },
      { label: "Passive", value: "passive" },
    ],
    defaultValue: "active",
  },
];

const RGB_LED_SCHEMA: PropertySchema[] = [
  {
    key: "colorR",
    label: "Red",
    type: "color",
    options: LED_COLORS,
    defaultValue: "#ff0000",
  },
  {
    key: "colorG",
    label: "Green",
    type: "color",
    options: LED_COLORS,
    defaultValue: "#00ff00",
  },
  {
    key: "colorB",
    label: "Blue",
    type: "color",
    options: LED_COLORS,
    defaultValue: "#0000ff",
  },
];

const SERVO_SCHEMA: PropertySchema[] = [
  {
    key: "minAngle",
    label: "Min Angle",
    type: "number",
    unit: "°",
    defaultValue: 0,
    min: 0,
    max: 360,
    validate: (v: unknown): boolean => typeof v === "number" && v >= 0 && v <= 360,
  },
  {
    key: "maxAngle",
    label: "Max Angle",
    type: "number",
    unit: "°",
    defaultValue: 180,
    min: 0,
    max: 360,
    validate: (v: unknown): boolean => typeof v === "number" && v >= 0 && v <= 360,
  },
];

const PHOTORESISTOR_SCHEMA: PropertySchema[] = [
  {
    key: "darkResistance",
    label: "Dark Resistance",
    type: "number",
    unit: "Ω",
    defaultValue: 1000000,
    validate: (v: unknown): boolean => typeof v === "number" && v > 0,
  },
  {
    key: "lightResistance",
    label: "Light Resistance",
    type: "number",
    unit: "Ω",
    defaultValue: 1000,
    validate: (v: unknown): boolean => typeof v === "number" && v > 0,
  },
];

const TEMPERATURE_SENSOR_SCHEMA: PropertySchema[] = [
  {
    key: "sensorType",
    label: "Sensor Type",
    type: "dropdown",
    options: [
      { label: "TMP36", value: "tmp36" },
      { label: "DHT11", value: "dht11" },
    ],
    defaultValue: "tmp36",
  },
];

const LCD_DISPLAY_SCHEMA: PropertySchema[] = [
  {
    key: "columns",
    label: "Columns",
    type: "number",
    defaultValue: 16,
    min: 1,
    max: 40,
    validate: (v: unknown): boolean => typeof v === "number" && v >= 1 && v <= 40,
  },
  {
    key: "rows",
    label: "Rows",
    type: "number",
    defaultValue: 2,
    min: 1,
    max: 4,
    validate: (v: unknown): boolean => typeof v === "number" && v >= 1 && v <= 4,
  },
];

const POWER_SUPPLY_SCHEMA: PropertySchema[] = [
  {
    key: "voltage",
    label: "Voltage",
    type: "dropdown",
    options: [
      { label: "3.3V", value: "3.3" },
      { label: "5V", value: "5" },
      { label: "9V", value: "9" },
      { label: "12V", value: "12" },
      { label: "Custom", value: "custom" },
    ],
    defaultValue: "5",
    validate: (v: unknown): boolean => {
      if (typeof v === "number") return v > 0;
      if (typeof v === "string") {
        if (v === "custom") return true;
        const parsed = parseFloat(v);
        return !isNaN(parsed) && parsed > 0;
      }
      return false;
    },
  },
];

const DC_MOTOR_SCHEMA: PropertySchema[] = [
  {
    key: "rpm",
    label: "RPM",
    type: "number",
    unit: "RPM",
    defaultValue: 0,
    validate: (_v: unknown): boolean => true, // read-only, always valid
  },
];

/**
 * Maps component type strings to their property schema arrays.
 */
export const SCHEMA_MAP: Record<string, PropertySchema[]> = {
  resistor: RESISTOR_SCHEMA,
  capacitor: CAPACITOR_SCHEMA,
  led: LED_SCHEMA,
  potentiometer: POTENTIOMETER_SCHEMA,
  buzzer: BUZZER_SCHEMA,
  "rgb-led": RGB_LED_SCHEMA,
  servo: SERVO_SCHEMA,
  photoresistor: PHOTORESISTOR_SCHEMA,
  "temperature-sensor": TEMPERATURE_SENSOR_SCHEMA,
  "lcd-display": LCD_DISPLAY_SCHEMA,
  "power-supply": POWER_SUPPLY_SCHEMA,
  "dc-motor": DC_MOTOR_SCHEMA,
};
