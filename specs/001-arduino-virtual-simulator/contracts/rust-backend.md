# Contract: Rust Backend API

**Version**: 1.0.0
**Description**: Tauri commands exposed by the Rust backend to the TypeScript frontend. These are invoked via `@tauri-apps/api/invoke` from the main thread.

## Serial Port Commands

### `create_virtual_port`

Create a new virtual serial port pair. Returns the port path visible to the Arduino IDE.

```typescript
invoke("create_virtual_port", { label: string }): Promise<string>
// Returns: port path (e.g., "/dev/cu.s4" on macOS, "COM5" on Windows)
```

### `destroy_virtual_port`

Destroy a virtual serial port (disappears from IDE).

```typescript
invoke("destroy_virtual_port", { portPath: string }): Promise<void>
```

### `list_virtual_ports`

List all virtual ports created by this app instance.

```typescript
invoke("list_virtual_ports"): Promise<Array<{ path: string; label: string }>>
```

### `write_serial`

Write bytes to the virtual serial port (worker → serial → external).

```typescript
invoke("write_serial", { portPath: string; data: number[] }): Promise<void>
```

## File System Commands

### `install_plugin`

Install a plugin from a .zip file path.

```typescript
invoke("install_plugin", { zipPath: string }): Promise<PluginInstallResult>

interface PluginInstallResult {
  name: string;
  version: string;
  installPath: string;
}
```

### `uninstall_plugin`

Remove an installed plugin.

```typescript
invoke("uninstall_plugin", { pluginName: string }): Promise<void>
```

### `list_plugins`

List all installed plugins with their manifests.

```typescript
invoke("list_plugins"): Promise<PluginManifest[]>
```

### `load_plugin_bundle`

Read a plugin's ESM bundle file content.

```typescript
invoke("load_plugin_bundle", { pluginName: string }): Promise<string>
// Returns: JS source code of the plugin's main bundle
```

### `save_circuit`

Save a circuit configuration to a file.

```typescript
invoke("save_circuit", { data: string; filename: string }): Promise<string>
// Returns: Full path where the file was saved
```

### `load_circuit`

Load a circuit configuration from a file.

```typescript
invoke("load_circuit", { filename: string }): Promise<string>
// Returns: JSON string of the circuit data
```

### `show_save_dialog`

Open native save file dialog.

```typescript
invoke("show_save_dialog", { defaultName: string; filters: FileFilter[] }): Promise<string | null>
// Returns: Selected file path, or null if cancelled
```

### `show_open_dialog`

Open native open file dialog.

```typescript
invoke("show_open_dialog", { filters: FileFilter[] }): Promise<string | null>
// Returns: Selected file path, or null if cancelled
```

## Events (Rust → Frontend)

These events are emitted by the Rust backend and listened to via `listen()` in the frontend.

### `serial-data`

Incoming serial data from the virtual port (avrdude upload bytes, Serial Monitor input).

```typescript
listen("serial-data", (event: { port: string; data: number[] }) => void)
```

### `serial-port-appeared`

A virtual port was created and is now visible to the system.

```typescript
listen("serial-port-appeared", (event: { path: string; label: string }) => void)
```

### `serial-port-disappeared`

A virtual port was destroyed.

```typescript
listen("serial-port-disappeared", (event: { path: string }) => void)
```

### `plugin-install-progress`

Progress notification during plugin installation.

```typescript
listen("plugin-install-progress", (event: { stage: string; percent: number }) => void)
```

### `upload-progress`

Progress notification during sketch upload (STK500 protocol).

```typescript
listen("upload-progress", (event: { stage: string; bytesWritten: number; totalBytes: number }) => void)
```

### `upload-complete`

Sketch upload finished successfully.

```typescript
listen("upload-complete", (event: { port: string; flashSize: number }) => void)
```
