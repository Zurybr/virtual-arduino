import Ajv from "ajv";
import addFormats from "ajv-formats";
import { satisfies } from "semver";
import type { PluginManifest } from "../types";

export type { PluginManifest };

const manifestSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Arduino Simulator Component Plugin Manifest",
  type: "object" as const,
  required: [
    "name",
    "displayName",
    "version",
    "description",
    "author",
    "license",
    "engines",
    "hardware",
    "main",
    "category",
  ],
  additionalProperties: false,
  properties: {
    name: {
      type: "string",
      pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
      minLength: 2,
      maxLength: 64,
    },
    displayName: {
      type: "string",
      minLength: 1,
      maxLength: 128,
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9.]+)?$",
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 512,
    },
    author: { type: "string" },
    license: { type: "string" },
    homepage: { type: "string", format: "uri" },
    engines: {
      type: "object",
      required: ["simulator", "pluginApi"],
      properties: {
        simulator: { type: "string" },
        pluginApi: { type: "string" },
      },
    },
    hardware: {
      type: "object",
      required: ["pins", "power", "protocols"],
      properties: {
        pins: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            required: ["id", "type", "label"],
            properties: {
              id: { type: "string" },
              type: {
                type: "string",
                enum: [
                  "power",
                  "ground",
                  "digital-input",
                  "digital-output",
                  "analog-input",
                  "analog-output",
                  "pwm",
                  "i2c-sda",
                  "i2c-scl",
                  "spi-mosi",
                  "spi-miso",
                  "spi-sck",
                  "spi-ss",
                  "uart-rx",
                  "uart-tx",
                ],
              },
              label: { type: "string" },
              voltage: { type: "number", minimum: 0 },
            },
          },
        },
        power: {
          type: "object",
          required: ["minVoltage", "maxVoltage", "typicalCurrent"],
          properties: {
            minVoltage: { type: "number", minimum: 0 },
            maxVoltage: { type: "number", minimum: 0 },
            typicalCurrent: { type: "string" },
          },
        },
        protocols: {
          type: "array",
          items: {
            type: "string",
            enum: ["gpio", "i2c", "spi", "uart", "pwm"],
          },
          minItems: 1,
        },
      },
    },
    assets: {
      type: "object",
      properties: {
        icon: { type: "string" },
        schematic: { type: "string" },
      },
    },
    main: { type: "string" },
    permissions: {
      type: "array",
      items: { type: "string" },
    },
    category: {
      type: "string",
      enum: [
        "basic",
        "sensor",
        "actuator",
        "display",
        "ic",
        "communication",
        "power",
      ],
    },
    tags: {
      type: "array",
      items: { type: "string" },
      maxItems: 10,
    },
    checksum: {
      type: "string",
      pattern: "^sha256:[a-f0-9]{64}$",
    },
  },
};

let compiledValidate: ReturnType<Ajv["compile"]> | null = null;

export function compileManifestSchema() {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  compiledValidate = ajv.compile(manifestSchema);
  return compiledValidate;
}

export function validateManifest(data: unknown): {
  valid: boolean;
  errors?: string[];
} {
  const validate = compiledValidate ?? compileManifestSchema();
  const valid = validate(data) as boolean;
  if (valid) {
    return { valid: true };
  }
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath} ${e.message}`
  );
  return { valid: false, errors };
}

export function checkVersionCompatibility(
  engineVersion: string,
  requiredRange: string
): boolean {
  return satisfies(engineVersion, requiredRange);
}
