# Data Model: Arduino Virtual Bus Simulator

**Date**: 2026-06-09
**Source**: spec.md key entities + research.md findings

## Entity Relationship Overview

```
Circuit ──1:1──► Board ──1:*──► Pin
    │               │
    │1:*            │1:* (via buses)
    ▼               ▼
Component       Bus
    │               │
    │1:*            │*:*
    ▼               ▼
ComponentPin    Wire (connects Pins)
    │
    │N:1
    ▼
Plugin (manifest + logic)
```

## Core Entities

### Board

Represents a virtual Arduino board with a specific microcontroller.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | Unique identifier (UUID) |
| model | `BoardModel` | Microcontroller model (e.g., `ATMEGA328P`) |
| pins | `Pin[]` | All digital/analog/power pins on the board |
| buses | `Bus[]` | Communication buses (GPIO, PWM, UART, I2C, SPI) |
| powerRails | `PowerRail[]` | 5V and GND power rails |
| flash | `Uint16Array` | 16384 entries (32KB flash memory) |
| sram | `Uint8Array` | 2048 bytes (includes registers, I/O, SRAM) |
| eeprom | `Uint8Array` | 1024 bytes |
| clockSpeed | `number` | 16,000,000 Hz for ATmega328P |
| cycleCount | `number` | Virtual cycle counter (monotonically increasing) |

**Validation rules**:
- `model` MUST be a supported board model
- `pins` count and capabilities MUST match the board model specification
- `flash` size MUST match `model.flashSize`
- `sram` size MUST match `model.sramSize`

### BoardModel (value object)

| Field | Type | Description |
|-------|------|-------------|
| name | `string` | e.g., `"ATMEGA328P"` |
| flashSize | `number` | 32768 bytes |
| sramSize | `number` | 2048 bytes |
| eepromSize | `number` | 1024 bytes |
| clockSpeed | `number` | 16000000 |
| signature | `[number, number, number]` | `[0x1E, 0x95, 0x0F]` for ATmega328P |
| pinDefinitions | `PinDefinition[]` | Pin count, names, capabilities per pin |

### Pin

An electrical connection point on a board or component.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | Unique within parent (board or component) |
| parentType | `"board" \| "component"` | What this pin belongs to |
| parentId | `string` | ID of the parent board or component |
| label | `string` | Human-readable name (e.g., `"D13"`, `"A0"`) |
| mode | `PinMode` | Current mode: `INPUT`, `OUTPUT`, `INPUT_PULLUP`, `PWM`, `I2C_SDA`, etc. |
| value | `PinValue` | Current electrical value |
| capabilities | `PinCapability[]` | What this pin supports (digital, analog, pwm, i2c, spi, uart) |
| busId | `string \| null` | Which bus this pin is connected to (null if unconnected) |
| gridPosition | `GridCoord \| null` | Position on breadboard grid (null if on component) |

**PinMode enum**: `INPUT`, `OUTPUT`, `INPUT_PULLUP`, `PWM`, `I2C_SDA`, `I2C_SCL`, `SPI_MOSI`, `SPI_MISO`, `SPI_SCK`, `SPI_SS`, `UART_RX`, `UART_TX`, `ANALOG`, `POWER`, `GROUND`

**PinValue union**:
- Digital: `{ type: "digital", high: boolean }`
- Analog: `{ type: "analog", value: number (0-1023) }`
- PWM: `{ type: "pwm", dutyCycle: number (0-255), frequency: number }`
- Floating: `{ type: "floating" }`

**PinCapability enum**: `DIGITAL_READ`, `DIGITAL_WRITE`, `ANALOG_READ`, `PWM_WRITE`, `I2C`, `SPI`, `UART`, `EXTERNAL_INTERRUPT`

### Wire

An electrical connection between exactly two pins.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | UUID |
| startPin | `PinRef` | Reference to the source pin |
| endPin | `PinRef` | Reference to the destination pin |
| path | `GridCoord[]` | Manhattan-routed waypoints (at least 2 points) |
| color | `string` | Wire color (CSS color value) |

**PinRef**: `{ parentId: string, pinId: string, parentType: "board" | "component" }`

**Validation rules**:
- `startPin` and `endPin` MUST NOT be the same pin
- `startPin.parentId` MUST NOT equal `endPin.parentId` unless the parent is a board (board-to-board wires allowed for breadboard internal connections)
- `path` MUST contain at least the start and end grid coordinates
- Wire MUST NOT connect pins on incompatible buses (warning displayed, wire still created per dual-behavior decision)

### Bus

A communication channel governing signal propagation rules.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | UUID |
| type | `BusType` | Protocol type |
| pins | `string[]` | Pin IDs connected to this bus |
| state | `BusState` | Observable bus state for debugging |

**BusType enum**: `GPIO`, `PWM`, `UART`, `I2C`, `SPI`

**BusState** (observable for debugger):
- GPIO: `{ voltageLevel: number, pinStates: Map<PinId, boolean> }`
- PWM: `{ dutyCycle: number, frequency: number }`
- UART: `{ baudRate: number, txBuffer: Uint8Array, rxBuffer: Uint8Array }`
- I2C: `{ address: number, sdaState: boolean, sclState: boolean, dataBuffer: Uint8Array }`
- SPI: `{ clockRate: number, mosiData: Uint8Array, misoData: Uint8Array }`

### Component

A virtual electronic part placed on the breadboard.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | UUID (unique instance) |
| pluginId | `string` | References the Plugin manifest name |
| type | `string` | Component type from plugin (e.g., `"led"`, `"servo"`) |
| pins | `ComponentPin[]` | Pins exposed by this component |
| gridPosition | `GridCoord` | Position on the breadboard grid |
| rotation | `0 \| 90 \| 180 \| 270` | Current rotation in degrees |
| state | `ComponentState` | Component-specific runtime state |
| healthStatus | `"healthy" \| "error" \| "missing"` | Plugin health status |

**ComponentPin**: Extends Pin with `manifestPinId` (links to plugin manifest pin definition)

**ComponentState**: Plugin-defined key-value map. Each plugin defines its own state shape. Examples:
- LED: `{ on: boolean, brightness: number }`
- Servo: `{ angle: number, speed: number }`
- LCD: `{ cursor: { row, col }, text: string[], backlight: boolean }`

### Plugin

An installable package providing one or more component types.

| Field | Type | Description |
|-------|------|-------------|
| name | `string` | Unique plugin identifier (from manifest) |
| displayName | `string` | Human-readable name |
| version | `string` | SemVer version |
| description | `string` | What the plugin provides |
| author | `string` | Author name |
| license | `string` | License identifier |
| engines | `{ simulator: string, pluginApi: string }` | SemVer range constraints |
| hardware | `HardwareSpec` | Pin definitions, power draw, protocols |
| assets | `AssetRefs` | Paths to icon, schematic SVGs |
| main | `string` | ESM entry point path |
| permissions | `string[]` | Declared access permissions (transparency) |
| category | `string` | e.g., `"sensor"`, `"actuator"`, `"display"`, `"ic"` |
| checksum | `string` | SHA-256 of the plugin bundle |

**HardwareSpec**:
```typescript
interface HardwareSpec {
  pins: Array<{
    id: string;
    type: "power" | "ground" | "digital-input" | "digital-output" |
          "analog-input" | "analog-output" | "pwm" | "i2c-sda" |
          "i2c-scl" | "spi-mosi" | "spi-miso" | "spi-sck" | "uart-rx" | "uart-tx";
    label: string;
    voltage?: number;
  }>;
  power: {
    minVoltage: number;
    maxVoltage: number;
    typicalCurrent: string;
  };
  protocols: Array<"gpio" | "i2c" | "spi" | "uart" | "pwm">;
}
```

### SubBoard

A reusable circuit module with its own components and optional microcontroller.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | UUID |
| name | `string` | User-given name |
| board | `Board \| null` | Optional secondary microcontroller board |
| components | `Component[]` | Components inside this sub-board |
| wires | `Wire[]` | Internal wiring |
| externalPins | `Pin[]` | Pins exposed for connection to the main board |
| virtualSerialPort | `string \| null` | Serial port path (if board has MCU) |

### Circuit

A saved configuration of a complete simulation setup.

| Field | Type | Description |
|-------|------|-------------|
| id | `string` | UUID |
| name | `string` | User-given name |
| mainBoard | `Board` | The primary Arduino board |
| components | `Component[]` | All components on the breadboard |
| wires | `Wire[]` | All wire connections |
| subBoards | `SubBoard[]` | Connected sub-board modules |
| createdAt | `string` | ISO timestamp |
| modifiedAt | `string` | ISO timestamp |
| layout | `LayoutSnapshot` | Canvas viewport position and zoom |

### SimulationState

The runtime execution state of the simulator.

| Field | Type | Description |
|-------|------|-------------|
| status | `SimulationStatus` | Current execution state |
| instructionPointer | `number` | Current PC value |
| cycleCount | `number` | Total virtual cycles executed |
| breakpoints | `Set<number>` | PC addresses where execution pauses |
| sourceMap | `Map<number, SourceLocation>` | PC → source file/line mapping |
| errorLog | `SimulationError[]` | Warnings and errors from the simulation |

**SimulationStatus**: `"STOPPED" | "RUNNING" | "PAUSED" | "STEPPING" | "UPLOADING"`

**SourceLocation**: `{ file: string, line: number, column?: number, isUserCode: boolean }`

**SimulationError**: `{ type: "memory" | "power" | "short-circuit" | "protocol-mismatch" | "plugin-crash" | "upload-replace", message: string, affectedPins?: string[], severity: "warning" | "error" }`

## Grid Coordinate System

| Type | Fields | Description |
|------|--------|-------------|
| `GridCoord` | `{ row: number, col: number }` | Position on breadboard grid. Row: 1-63, Col: maps to a-j and power rail columns |
| `GridSection` | `"terminal-left" \| "terminal-right" \| "power-top" \| "power-bottom"` | Which section of the breadboard |

## State Transitions

### Simulation Lifecycle

```
STOPPED ──[upload]──► UPLOADING ──[complete]──► RUNNING
    │                                            │  │
    │                          [pause/breakpoint]─  ──[stop]
    ▼                                            ▼      │
  STOPPED ◄────────────────────[stop/reset]── PAUSED    │
    ▲                                            │      │
    │                              [resume/step]─┘      │
    │                                                   │
    └───────────────────────────────────────────────────┘
```

### Plugin Lifecycle

```
discovered ──► loading ──► initialized ──► running
                  │             │              │
                  ▼             ▼              ▼
                error ◄────────┴──────────────┘
                  │
                  ▼
               destroyed
```

### Component Placement Lifecycle

```
dragging (from palette) ──► placing (on grid) ──► placed
                                                    │
                                   [delete/plugin-missing]──► removed
```
