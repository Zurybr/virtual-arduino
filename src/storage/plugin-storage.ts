import type { PluginManifest } from "../types.js";

export interface FileSystemAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, data: string | Uint8Array): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  removeDir(path: string): Promise<void>;
  readDir(path: string): Promise<string[]>;
  isDirectory(path: string): Promise<boolean>;
  readZipEntries(data: Uint8Array): Promise<{ filename: string; content: Uint8Array }[]>;
}

export class PluginStorage {
  protected baseDir: string;
  protected fs: FileSystemAdapter;

  constructor(baseDir: string, fsAdapter: FileSystemAdapter) {
    this.baseDir = baseDir;
    this.fs = fsAdapter;
  }

  getPluginDir(pluginName: string): string {
    return `${this.baseDir}/plugins/${pluginName}`;
  }

  getPluginManifestPath(pluginName: string): string {
    return `${this.getPluginDir(pluginName)}/component.json`;
  }

  getPluginBundlePath(pluginName: string, mainEntry: string): string {
    return `${this.getPluginDir(pluginName)}/${mainEntry}`;
  }

  async validateZip(zipData: Uint8Array): Promise<{ valid: boolean; error?: string }> {
    if (!zipData || zipData.length < 4) {
      return { valid: false, error: "Invalid or empty zip data" };
    }

    const signature = new DataView(zipData.buffer, zipData.byteOffset, 4).getUint32(0, true);
    if (signature !== 0x04034b50) {
      return { valid: false, error: "Not a valid zip file" };
    }

    try {
      const entries = await this.fs.readZipEntries(zipData);
      const manifestEntry = entries.find(
        (e) =>
          e.filename === "component.json" ||
          e.filename.endsWith("/component.json"),
      );

      if (!manifestEntry) {
        return { valid: false, error: "component.json not found in zip" };
      }

      try {
        const text = new TextDecoder().decode(manifestEntry.content);
        const parsed = JSON.parse(text) as PluginManifest;
        if (!parsed.name || !parsed.version || !parsed.main) {
          return { valid: false, error: "component.json is missing required fields" };
        }
      } catch {
        return { valid: false, error: "component.json is not valid JSON" };
      }

      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: `Validation failed: ${(err as Error).message}`,
      };
    }
  }

  async extractPlugin(zipData: Uint8Array, pluginName: string): Promise<string> {
    const targetDir = this.getPluginDir(pluginName);
    const entries = await this.fs.readZipEntries(zipData);

    const rootEntry = entries.find((e) => e.filename === "component.json");
    const subEntry = entries.find(
      (e) =>
        e.filename.endsWith("/component.json") &&
        e.filename.split("/").length === 2,
    );

    const prefix = rootEntry ? "" : subEntry ? subEntry.filename.split("/")[0] + "/" : "";

    await this.fs.mkdir(targetDir);

    for (const entry of entries) {
      const relativePath = prefix ? entry.filename.slice(prefix.length) : entry.filename;
      if (!relativePath) continue;
      const destPath = `${targetDir}/${relativePath}`;
      const pathParts = destPath.split("/");
      pathParts.pop();
      await this.fs.mkdir(pathParts.join("/"));
      await this.fs.writeFile(destPath, entry.content);
    }

    return targetDir;
  }

  async removePlugin(pluginName: string): Promise<void> {
    const dir = this.getPluginDir(pluginName);
    const exists = await this.fs.exists(dir);
    if (exists) {
      await this.fs.removeDir(dir);
    }
  }

  async listInstalledPlugins(): Promise<string[]> {
    const pluginsDir = `${this.baseDir}/plugins`;
    const exists = await this.fs.exists(pluginsDir);
    if (!exists) {
      return [];
    }

    const entries = await this.fs.readDir(pluginsDir);
    const pluginNames: string[] = [];

    for (const entry of entries) {
      const entryPath = `${pluginsDir}/${entry}`;
      const isDir = await this.fs.isDirectory(entryPath);
      if (!isDir) continue;
      const manifestPath = `${entryPath}/component.json`;
      const hasManifest = await this.fs.exists(manifestPath);
      if (hasManifest) {
        pluginNames.push(entry);
      }
    }

    return pluginNames;
  }
}
