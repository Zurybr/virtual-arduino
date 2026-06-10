import type { PluginManifest } from "../types";

export class PluginRegistry {
  plugins: Map<string, { manifest: PluginManifest; sourcePath?: string }>;

  constructor() {
    this.plugins = new Map();
  }

  register(manifest: PluginManifest, sourcePath?: string): void {
    if (this.plugins.has(manifest.name)) {
      throw new Error(`Plugin "${manifest.name}" is already registered`);
    }
    this.plugins.set(manifest.name, { manifest, sourcePath });
  }

  unregister(name: string): void {
    this.plugins.delete(name);
  }

  get(name: string): PluginManifest | undefined {
    return this.plugins.get(name)?.manifest;
  }

  listByCategory(category: string): PluginManifest[] {
    const result: PluginManifest[] = [];
    for (const entry of this.plugins.values()) {
      if (entry.manifest.category === category) {
        result.push(entry.manifest);
      }
    }
    return result;
  }

  listAll(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(
      (entry) => entry.manifest
    );
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  clear(): void {
    this.plugins.clear();
  }
}
