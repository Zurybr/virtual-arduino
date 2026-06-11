# Arduino Virtual Bus Simulator

A desktop application that simulates an **Arduino Uno** board with a visual breadboard, real-time circuit simulation, code editing, and virtual serial port integration — designed to replicate the [Autodesk Tinkercad Circuits](https://www.tinkercad.com/circuits) experience as a standalone desktop app.

![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript)
![Rust](https://img.shields.io/badge/Rust-latest-000000?logo=rust)
![Konva](https://img.shields.io/badge/Konva-10.x-0088CC?logo=data:image/svg+xml;base64,)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What Is This?

Arduino Virtual Bus Simulator lets you:

- **Place components** on a virtual breadboard (LEDs, resistors, servos, LCDs, and more)
- **Wire them** pin-to-pin with click-to-draw bezier curves
- **Write Arduino sketches** in a built-in code editor
- **Simulate in real-time** — watch LEDs glow, servos rotate, motors spin
- **Connect to the real Arduino IDE** via virtual serial ports
- **Debug** with breakpoints, step-through, pin inspection, and variable watching

All inside a native desktop app built with **Tauri v2** (Rust backend + React frontend).

---

## Features

### Circuit Design

| Feature | Description |
|---------|-------------|
| Visual breadboard | Drag-and-drop placement with snap-to-grid |
| 18+ components | LED, resistor, capacitor, pushbutton, potentiometer, servo, DC motor, buzzer, RGB LED, photoresistor, temperature sensor, LCD display, shift register, transistor, diode, USB connector |
| Wire drawing | Click pin A → click pin B, automatic bezier curve routing |
| Component rotation | Rotate any component 90° with one click |
| Zoom & pan | Scroll to zoom, middle-click to pan |
| Selection model | Click to select, drag to move, keyboard delete |
| Component properties | Edit values (resistance, capacitance, LED color, etc.) via property panel |

### Simulation Engine

| Feature | Description |
|---------|-------------|
| ATmega328P model | Full instruction set, memory (Flash, SRAM, EEPROM), timers, interrupts |
| Bus system | GPIO, PWM, UART, I2C, SPI buses with address-based routing |
| Real-time execution | Web Worker-based simulation engine, 60fps UI, ≤16ms pin propagation |
| Deterministic ticks | Tick-based simulation for reproducible results |

### Debugging

| Feature | Description |
|---------|-------------|
| Run / Stop / Pause / Step | Full simulation control from toolbar |
| Breakpoints | Set breakpoints in source code for step-through debugging |
| Pin inspector | Real-time table of all pin states (mode, value, bus) |
| Variable watcher | Monitor variables during execution |
| State snapshots | Capture and inspect full board state at any point |

### IDE Integration

| Feature | Description |
|---------|-------------|
| Virtual serial ports | Rust backend creates virtual COM/tty ports on app launch |
| Arduino IDE compatible | Upload sketches from the real Arduino IDE as if a physical board |
| Serial monitor | Bidirectional serial communication display |
| Port lifecycle | Ports appear on launch, disappear on close |

### Plugin Architecture

All components are **plugins** with standardized manifests. Install, uninstall, or create custom components without rebuilding the core application.

```
plugins/
├── _template/           # Template for creating new plugins
│   ├── component.json   # Plugin manifest (metadata, pins, properties)
│   ├── index.ts         # Component logic
│   └── icon.svg         # Component icon
├── led/                 # LED component plugin
├── resistor/            # Resistor with editable values (220Ω, 1kΩ, 10kΩ...)
├── servo/               # Servo motor with rotation animation
├── lcd-display/         # 16x2 LCD display
└── ... (15 more built-in plugins)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript 6.x (strict) | UI components, state management |
| **Canvas** | Konva / react-konva 10.x | Breadboard & component rendering |
| **Simulation** | Web Workers + TypeScript | ATmega328P emulation, bus system |
| **Backend** | Rust (Tauri v2) | Virtual serial ports, OS integration |
| **Build** | Vite 8.x | Frontend bundling, HMR |
| **Testing** | Vitest 4.x (TS) + cargo test (Rust) | Unit, integration, and plugin tests |
| **Validation** | AJV + ajv-formats | Plugin manifest schema validation |
| **Desktop** | Tauri v2 | Native desktop shell (Windows, macOS, Linux) |

---

## Project Structure

```
arduino/
├── src/                              # TypeScript frontend
│   ├── main.tsx                      # App entry point
│   ├── types.ts                      # Global type definitions
│   ├── simulation/                   # Simulation engine
│   │   ├── core/                     # Board, Pin, Bus, Wire, Circuit
│   │   ├── avr/                      # ATmega328P model
│   │   │   ├── atmega328p.ts         # CPU model (memory, registers, timers)
│   │   │   ├── instructions.ts       # Instruction set interpreter
│   │   │   ├── memory.ts             # Flash, SRAM, EEPROM
│   │   │   └── interrupts.ts         # Interrupt vector table
│   │   ├── debugger/                 # Debug controller, breakpoints, inspector
│   │   ├── worker.ts                 # Web Worker entry point
│   │   └── worker-api.ts             # Main ↔ Worker message protocol
│   │
│   ├── ui/                           # React UI components
│   │   ├── app.tsx                   # Root layout + state management
│   │   ├── workspace/                # Konva canvas (Workspace, ComponentItem, WireLayer)
│   │   ├── toolbar/                  # Simulation controls
│   │   ├── palette/                  # Component palette
│   │   ├── editor/                   # Code editor
│   │   ├── debugger/                 # Pin inspector, variable watch
│   │   └── serial-monitor.tsx        # Serial output display
│   │
│   ├── plugins/                      # Plugin system (loader, registry, manifest)
│   └── storage/                      # Circuit save/load (JSON)
│
├── src-tauri/                        # Rust backend (Tauri v2)
│   ├── src/
│   │   ├── main.rs                   # Tauri entry point
│   │   ├── lib.rs                    # Library root
│   │   ├── serial/                   # Virtual serial port management
│   │   │   ├── mod.rs                # Port manager
│   │   │   ├── platform_linux.rs     # tty0tty / socat integration
│   │   │   ├── platform_macos.rs     # Pseudo-terminal creation
│   │   │   └── platform_windows.rs   # com0com / virtual COM
│   │   └── commands/                 # Tauri IPC commands
│   │       ├── serial_cmd.rs         # Frontend ↔ serial bridge
│   │       └── plugin_cmd.rs         # Plugin file operations
│   └── Cargo.toml
│
├── plugins/                          # 15 built-in component plugins
├── tests/                            # Vitest test suites
├── specs/                            # SDD specifications
├── openspec/                         # OpenSpec artifacts
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **Rust** (latest stable) — [install via rustup](https://rustup.rs/)
- **Tauri v2 CLI** — installed automatically via npm
- **System dependencies** — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Install

```bash
# Clone the repository
git clone https://github.com/Zurybr/virtual-arduino.git
cd virtual-arduino

# Install frontend dependencies
npm install
```

### Development

```bash
# Start the Tauri dev server (frontend + backend with hot reload)
npm run tauri dev
```

This opens the desktop app at `localhost:1420` with Vite HMR for the frontend and Cargo watch for the Rust backend.

### Build for Production

```bash
# Build the optimized desktop application
npm run tauri build
```

Output bundles are generated in `src-tauri/target/release/bundle/` for your platform (`.msi` / `.dmg` / `.AppImage`).

---

## Testing

```bash
# Run all TypeScript tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npx vitest run --coverage

# Run Rust backend tests
cd src-tauri && cargo test

# Type checking
npm run typecheck

# Linting
npm run lint

# Formatting
npm run format
```

---

## Component Plugin System

### Plugin Manifest

Each plugin defines a `component.json` manifest:

```json
{
  "id": "resistor",
  "name": "Resistor",
  "version": "1.0.0",
  "description": "Standard resistor with editable resistance value",
  "category": "basic",
  "icon": "icon.svg",
  "pins": [
    { "id": "pin-a", "label": "A", "type": "passive" },
    { "id": "pin-b", "label": "B", "type": "passive" }
  ],
  "properties": [
    {
      "key": "resistance",
      "label": "Resistance",
      "type": "dropdown",
      "unit": "Ω",
      "defaultValue": "10000",
      "options": [
        { "label": "220 Ω", "value": "220" },
        { "label": "330 Ω", "value": "330" },
        { "label": "1 kΩ", "value": "1000" },
        { "label": "10 kΩ", "value": "10000" }
      ]
    }
  ]
}
```

### Creating a Custom Plugin

1. Copy `plugins/_template/` to `plugins/my-component/`
2. Edit `component.json` with your component metadata, pins, and properties
3. Implement logic in `index.ts` following the `Component` interface
4. Add an SVG icon
5. The plugin is auto-discovered on next app launch

---

## Simulation Architecture

```
┌─────────────────────────────────────────────┐
│                   UI Layer                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Canvas  │ │  Editor  │ │  Debugger    │ │
│  │ (Konva) │ │ (Code)   │ │ (Inspector)  │ │
│  └────┬────┘ └─────┬────┘ └──────┬───────┘ │
│       │            │             │          │
│  ┌────┴────────────┴─────────────┴───────┐  │
│  │          State Management             │  │
│  └────────────────┬──────────────────────┘  │
│                   │                         │
├───────────────────┼─────────────────────────┤
│                   │    Web Worker Boundary   │
│  ┌────────────────┴──────────────────────┐  │
│  │         Simulation Engine             │  │
│  │  ┌─────────┐ ┌─────┐ ┌────────────┐  │  │
│  │  │ Circuit │ │ Bus │ │ ATmega328P │  │  │
│  │  │         │ │     │ │            │  │  │
│  │  │ Board   │ │GPIO │ │ Memory     │  │  │
│  │  │ Pin     │ │PWM  │ │ Timers     │  │  │
│  │  │ Wire    │ │UART │ │ Interrupts │  │  │
│  │  │         │ │I2C  │ │ Registers  │  │  │
│  │  │         │ │SPI  │ │            │  │  │
│  │  └─────────┘ └─────┘ └────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         │                │
    ┌────┴────┐    ┌──────┴──────┐
    │  Tauri  │    │   Virtual   │
    │   IPC   │    │ Serial Port │
    └────┬────┘    └──────┬──────┘
         │                │
    ┌────┴────────────────┴──────┐
    │     Rust Backend (Tauri)   │
    │  serialport · nix · sha2   │
    └────────────────────────────┘
```

The simulation runs in a **Web Worker** to keep the UI at 60fps. The main thread communicates with the worker via a typed message protocol. The Rust backend handles virtual serial port creation and OS-level device management.

---

## Performance Targets

| Metric | Target |
|--------|--------|
| UI rendering | 60fps |
| Pin state propagation | ≤16ms |
| Sketch upload | <5s |
| Virtual port appearance | <3s |
| Simulation determinism | Tick-based, reproducible |

---

## Target Platforms

| Platform | Version |
|----------|---------|
| Windows | 10+ |
| macOS | 12+ |
| Linux | x64 (with udev for serial) |

---

## License

MIT

---

## Acknowledgements

Built with [Tauri v2](https://v2.tauri.app/), [React](https://react.dev/), [Konva](https://konvajs.org/), and [Vite](https://vite.dev/).

Inspired by [Autodesk Tinkercad Circuits](https://www.tinkercad.com/circuits).
