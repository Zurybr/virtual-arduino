import { describe, it, expect } from "vitest";
import {
  validateManifest,
  checkVersionCompatibility,
  compileManifestSchema,
} from "../../src/plugins/manifest";

describe("validateManifest", () => {
  function validManifest(): object {
    return {
      name: "led",
      displayName: "LED",
      version: "1.0.0",
      description: "A basic LED component",
      author: "Test Author",
      license: "MIT",
      engines: {
        simulator: "^1.0.0",
        pluginApi: "^1.0.0",
      },
      hardware: {
        pins: [
          { id: "anode", type: "digital-input", label: "Anode" },
          { id: "cathode", type: "ground", label: "Cathode" },
        ],
        power: {
          minVoltage: 1.8,
          maxVoltage: 5.5,
          typicalCurrent: "20mA",
        },
        protocols: ["gpio"],
      },
      main: "index.js",
      category: "basic",
    };
  }

  it("valid manifest passes validation", () => {
    compileManifestSchema();
    const result = validateManifest(validManifest());
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it("missing required field name fails", () => {
    compileManifestSchema();
    const manifest = validManifest();
    delete (manifest as Record<string, unknown>).name;
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("missing version fails", () => {
    compileManifestSchema();
    const manifest = validManifest();
    delete (manifest as Record<string, unknown>).version;
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("invalid pin type fails", () => {
    compileManifestSchema();
    const manifest = validManifest();
    (
      manifest as { hardware: { pins: Array<{ type: string }> } }
    ).hardware.pins[0].type = "invalid-type";
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("invalid category fails", () => {
    compileManifestSchema();
    const manifest = validManifest();
    (manifest as Record<string, unknown>).category = "nonexistent";
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("name with invalid characters fails", () => {
    compileManifestSchema();
    const manifest = validManifest();
    (manifest as Record<string, unknown>).name = "INVALID Name!";
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("version not matching semver fails", () => {
    compileManifestSchema();
    const manifest = validManifest();
    (manifest as Record<string, unknown>).version = "not-semver";
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("empty manifest fails", () => {
    compileManifestSchema();
    const result = validateManifest({});
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("extra fields are rejected", () => {
    compileManifestSchema();
    const manifest = validManifest();
    (manifest as Record<string, unknown>).extraField = "surprise";
    const result = validateManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

describe("checkVersionCompatibility", () => {
  it("returns true for compatible version", () => {
    expect(checkVersionCompatibility("1.2.0", "^1.0.0")).toBe(true);
  });

  it("returns false for incompatible major version", () => {
    expect(checkVersionCompatibility("2.0.0", "^1.0.0")).toBe(false);
  });
});
