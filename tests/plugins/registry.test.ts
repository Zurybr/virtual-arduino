import { describe, it, expect } from "vitest";
import { PluginRegistry } from "../../src/plugins/registry";
import type { PluginManifest } from "../../src/types";

function createManifest(name: string, category: string = "basic"): PluginManifest {
  return {
    name,
    displayName: name,
    version: "1.0.0",
    description: `Test plugin ${name}`,
    author: "Tester",
    license: "MIT",
    engines: { simulator: "^1.0.0", pluginApi: "^1.0.0" },
    hardware: {
      pins: [{ id: "p1", type: "digital-input", label: "P1" }],
      power: { minVoltage: 3.3, maxVoltage: 5.0, typicalCurrent: "10mA" },
      protocols: ["gpio"],
    },
    main: "index.js",
    category: category as PluginManifest["category"],
    assets: { icon: "icon.svg" },
    permissions: [],
    tags: [],
  };
}

describe("PluginRegistry", () => {
  it("register plugin adds to map", () => {
    const registry = new PluginRegistry();
    const manifest = createManifest("led");
    registry.register(manifest);
    expect(registry.has("led")).toBe(true);
  });

  it("get by name returns correct manifest", () => {
    const registry = new PluginRegistry();
    const manifest = createManifest("led");
    registry.register(manifest);
    const result = registry.get("led");
    expect(result).toBe(manifest);
  });

  it("listByCategory returns only matching category", () => {
    const registry = new PluginRegistry();
    registry.register(createManifest("led", "basic"));
    registry.register(createManifest("temp-sensor", "sensor"));
    registry.register(createManifest("servo", "actuator"));

    const sensors = registry.listByCategory("sensor");
    expect(sensors).toHaveLength(1);
    expect(sensors[0].name).toBe("temp-sensor");
  });

  it("listAll returns all plugins", () => {
    const registry = new PluginRegistry();
    registry.register(createManifest("led", "basic"));
    registry.register(createManifest("temp-sensor", "sensor"));
    registry.register(createManifest("servo", "actuator"));

    const all = registry.listAll();
    expect(all).toHaveLength(3);
  });

  it("duplicate name throws", () => {
    const registry = new PluginRegistry();
    registry.register(createManifest("led"));
    expect(() => registry.register(createManifest("led"))).toThrow(
      "already registered"
    );
  });

  it("unregister removes plugin", () => {
    const registry = new PluginRegistry();
    registry.register(createManifest("led"));
    expect(registry.has("led")).toBe(true);
    registry.unregister("led");
    expect(registry.has("led")).toBe(false);
  });

  it("has returns correct boolean", () => {
    const registry = new PluginRegistry();
    expect(registry.has("led")).toBe(false);
    registry.register(createManifest("led"));
    expect(registry.has("led")).toBe(true);
    expect(registry.has("nonexistent")).toBe(false);
  });

  it("clear removes all plugins", () => {
    const registry = new PluginRegistry();
    registry.register(createManifest("led"));
    registry.register(createManifest("sensor"));
    expect(registry.listAll()).toHaveLength(2);
    registry.clear();
    expect(registry.listAll()).toHaveLength(0);
  });
});
