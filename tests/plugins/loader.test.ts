import { describe, it, expect, vi, beforeEach } from "vitest";
import { PluginLoader } from "../../src/plugins/loader";
import { PluginRegistry } from "../../src/plugins/registry";
import { compileManifestSchema } from "../../src/plugins/manifest";

function validManifestData() {
  return {
    name: "test-plugin",
    displayName: "Test Plugin",
    version: "1.0.0",
    description: "A test plugin",
    author: "Tester",
    license: "MIT",
    engines: {
      simulator: "^1.0.0",
      pluginApi: "^1.0.0",
    },
    hardware: {
      pins: [
        { id: "pin1", type: "digital-input", label: "Pin 1" },
      ],
      power: {
        minVoltage: 3.3,
        maxVoltage: 5.0,
        typicalCurrent: "10mA",
      },
      protocols: ["gpio"],
    },
    main: "index.js",
    category: "basic",
  };
}

describe("PluginLoader", () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
    compileManifestSchema();
  });

  it("loading a valid built-in plugin succeeds", async () => {
    const loader = new PluginLoader(registry);
    const manifestData = validManifestData();

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(manifestData),
    } as Response);

    const manifest = await loader.loadExternalPlugin("/plugins/led");
    expect(manifest.name).toBe("test-plugin");
    expect(registry.has("test-plugin")).toBe(true);
  });

  it("loading plugin with invalid manifest is rejected", async () => {
    const loader = new PluginLoader(registry);

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ name: "bad" }),
    } as Response);

    await expect(
      loader.loadExternalPlugin("/plugins/bad-plugin")
    ).rejects.toThrow("Invalid manifest");
  });

  it("engines version compatibility check", async () => {
    const loader = new PluginLoader(registry);
    const manifestData = validManifestData();
    manifestData.engines.simulator = "^99.0.0";

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(manifestData),
    } as Response);

    const manifest = await loader.loadExternalPlugin("/plugins/versioned");
    expect(manifest.engines.simulator).toBe("^99.0.0");
  });

  it("missing component.json in plugin directory", async () => {
    const loader = new PluginLoader(registry);

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(
      loader.loadExternalPlugin("/plugins/missing")
    ).rejects.toThrow("Failed to load manifest");
  });

  it("duplicate plugin name handling", async () => {
    const loader = new PluginLoader(registry);
    const manifestData = validManifestData();

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manifestData),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(manifestData),
      } as Response);

    await loader.loadExternalPlugin("/plugins/first");
    await expect(
      loader.loadExternalPlugin("/plugins/second")
    ).rejects.toThrow("already registered");
  });
});
