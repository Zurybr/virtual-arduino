import type { PluginManifest } from "../types";
import { PluginRegistry } from "./registry";
import { validateManifest } from "./manifest";

const BUILTIN_PLUGINS = ["led"];

export class PluginLoader {
  registry: PluginRegistry;

  constructor(registry: PluginRegistry) {
    this.registry = registry;
  }

  async loadBuiltinPlugins(basePath: string): Promise<number> {
    let count = 0;
    for (const pluginName of BUILTIN_PLUGINS) {
      try {
        await this.loadExternalPlugin(`${basePath}/${pluginName}`);
        count++;
      } catch {
        // skip invalid or missing plugins
      }
    }
    return count;
  }

  async loadExternalPlugin(dirPath: string): Promise<PluginManifest> {
    const response = await fetch(`${dirPath}/component.json`);
    if (!response.ok) {
      throw new Error(
        `Failed to load manifest from ${dirPath}/component.json`
      );
    }
    const data: unknown = await response.json();
    const result = validateManifest(data);
    if (!result.valid) {
      throw new Error(
        `Invalid manifest in ${dirPath}: ${result.errors?.join(", ")}`
      );
    }
    const manifest = data as PluginManifest;
    this.registry.register(manifest, dirPath);
    return manifest;
  }
}
