# Contract: Plugin API

**Version**: 1.0.0
**Description**: Interface that all component plugins MUST implement. This is the contract between the simulator host and plugin code.

## PluginManifest Schema

Every plugin MUST include a `component.json` file at its root, validated against this schema.

```typescript
interface PluginManifest {
  name: string;                         // Unique kebab-case identifier
  displayName: string;                  // Human-readable name
  version: string;                      // SemVer
  description: string;
  author: string;
  license: string;

  engines: {
    simulator: string;                  // SemVer range (e.g., "^1.0.0")
    pluginApi: string;                  // SemVer range
  };

  hardware: {
    pins: Array<{
      id: string;                       // Match to ComponentPlugin pin handlers
      type: PinType;
      label: string;
      voltage?: number;
    }>;
    power: {
      minVoltage: number;
      maxVoltage: number;
      typicalCurrent: string;
    };
    protocols: ProtocolType[];
  };

  assets: {
    icon: string;                       // Path to SVG icon
    schematic?: string;                 // Path to schematic SVG
  };

  main: string;                         // ESM entry point (e.g., "dist/index.js")
  permissions: string[];                // Declared access permissions
  category: PluginCategory;
  tags: string[];
  checksum?: string;                    // SHA-256 of plugin bundle
}

type PinType =
  | "power" | "ground"
  | "digital-input" | "digital-output"
  | "analog-input" | "analog-output"
  | "pwm"
  | "i2c-sda" | "i2c-scl"
  | "spi-mosi" | "spi-miso" | "spi-sck" | "spi-ss"
  | "uart-rx" | "uart-tx";

type ProtocolType = "gpio" | "i2c" | "spi" | "uart" | "pwm";

type PluginCategory = "basic" | "sensor" | "actuator" | "display" | "ic" | "communication" | "power";
```

## ComponentPlugin Interface

The default export of a plugin's ESM bundle MUST implement this interface.

```typescript
interface ComponentPlugin {
  readonly id: string;

  init(context: PluginContext): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;

  onPinChange(pinId: string, value: PinValue): void;

  onSerialData?(data: Uint8Array): void;

  render?(): PluginUIResult;
}
```

## PluginContext (provided by host)

The context object passed to `init()`, giving the plugin controlled access to the simulator.

```typescript
interface PluginContext {
  pluginId: string;
  manifest: PluginManifest;
  logger: PluginLogger;
  emit(event: string, data: unknown): void;
  on(event: string, handler: (data: unknown) => void): () => void;
  requestPinAccess(pins: PinRequest[]): Promise<PinAccess>;
}

interface PluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

interface PinRequest {
  pinId: string;
  mode: "read" | "write";
}

interface PinAccess {
  pins: Record<string, {
    read(): PinValue;
    write(value: PinValue): void;
    onChange(callback: (value: PinValue) => void): () => void;
  }>;
}
```

## PinValue Union

```typescript
type PinValue =
  | { type: "digital"; high: boolean }
  | { type: "analog"; value: number }       // 0-1023
  | { type: "pwm"; dutyCycle: number; frequency: number }  // 0-255, Hz
  | { type: "floating" };
```

## Plugin Lifecycle Guarantees

1. `init()` is called exactly once, before any other method
2. `start()` is called after `init()` completes successfully
3. `onPinChange()` is only called between `start()` and `stop()`
4. `stop()` is called before `destroy()`
5. `destroy()` is called exactly once; no methods are called after it
6. If any method throws, the plugin enters `error` state and no further calls are made until the host decides to retry or destroy
7. The host wraps every call in try/catch — plugin errors NEVER crash the simulator

## Plugin Package Format

```
my-component.zip
└── my-component/
    ├── component.json     # Manifest
    ├── dist/
    │   └── index.js       # Self-contained ESM bundle
    └── assets/
        ├── icon.svg
        └── schematic.svg
```

### Constraints

- Bundle MUST be self-contained ESM (no external dependencies)
- Bundle MUST export a class implementing `ComponentPlugin` as the default export
- Icon MUST be SVG format, square, at least 64×64 viewBox
- Total uncompressed size SHOULD be under 5MB
- Bundle MUST NOT use `eval()`, `new Function()`, or `import()` for dynamic loading
