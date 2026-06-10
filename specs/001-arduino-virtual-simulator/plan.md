# Implementation Plan: Arduino Virtual Bus Simulator

**Branch**: `001-arduino-virtual-simulator` | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-arduino-virtual-simulator/spec.md`

## Summary

A desktop application (Tauri v2) that simulates an Arduino Uno board, connecting
to the real Arduino IDE via virtual serial ports. Users place components on a
visual breadboard, wire them, upload sketches from the IDE, and observe real-time
simulation with full debugging controls (breakpoints, step-through, pause). The
system is modular via a plugin architecture — components are plugins with
standardized manifests. Advanced users can create custom sub-boards with
secondary microcontrollers, each exposing its own virtual serial port.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) + Rust (latest stable, via
Tauri v2)

**Primary Dependencies**: Tauri v2, Vite, Vitest, `serialport` crate (Rust),
Canvas API (breadboard rendering)

**Storage**: File system — circuit save files (JSON), plugin directories with
manifest + bundle, sub-board module files

**Testing**: Vitest for TypeScript (unit + integration), `cargo test` for Rust
serial layer

**Target Platform**: Windows 10+, macOS 12+, Linux (x64, with udev for serial)

**Project Type**: Desktop application (Tauri v2 hybrid)

**Performance Goals**: 60fps UI, pin state propagation ≤16ms, sketch upload
<5s, virtual port appearance <3s

**Constraints**: Single main Arduino board, ATmega328P only, offline-capable,
deterministic tick-based simulation

**Scale/Scope**: 15 built-in component plugins, plugin install/uninstall,
full debugging controls, sub-board creation, circuit save/load

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hardware Abstraction First | ✅ PASS | Components as independent TS classes with `Component` interface; no cross-component dependencies; all interaction via bus system |
| II. Bus Architecture | ✅ PASS | Virtual buses for GPIO, PWM, UART (v1), I2C/SPI (v2); address-based routing, voltage-level signaling, frequency modulation; observable bus state for debugger |
| III. Modularity & Plugin System | ✅ PASS | All components are plugins; core contains only bus infrastructure + plugin loader; runtime install without rebuild; standardized `component.json` manifest |
| IV. IDE Integration via Serial | ✅ PASS | Virtual serial port (Rust backend); appears on launch, disappears on close; sketch upload works identically to physical board; bidirectional Serial Monitor |
| V. Real-Time Simulation | ✅ PASS | Web Worker for simulation engine; deterministic tick model; decoupled UI rendering; ≤16ms propagation target |
| VI. Test-First (NON-NEGOTIABLE) | ✅ PASS | Vitest for TS, cargo test for Rust; TDD enforced; plugin test suites required; integration tests for upload→execution→serial flow |
| VII. Simplicity & YAGNI | ✅ PASS | ATmega328P only; GPIO/PWM/UART first; I2C/SPI deferred to concrete need; 15 built-in components sufficient for launch |

**Gate Result**: PASS — all 7 principles satisfied. No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/001-arduino-virtual-simulator/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

```text
arduino-simulator/
├── src-tauri/                    # Rust backend (Tauri v2)
│   ├── src/
│   │   ├── main.rs               # Tauri entry point
│   │   ├── serial/
│   │   │   ├── mod.rs            # Virtual serial port manager
│   │   │   ├── platform_linux.rs # tty0tty / socat integration
│   │   │   ├── platform_macos.rs # pseudo-terminal creation
│   │   │   ├── platform_windows.rs # com0com / virtual COM
│   │   │   └── monitor.rs        # Port lifecycle (appear/disappear)
│   │   ├── commands/
│   │   │   ├── mod.rs            # Tauri command registrations
│   │   │   ├── serial_cmd.rs     # Frontend ↔ serial bridge
│   │   │   └── plugin_cmd.rs     # Plugin file operations
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                          # TypeScript frontend + simulation
│   ├── simulation/               # Simulation engine (runs in Web Worker)
│   │   ├── core/
│   │   │   ├── board.ts          # Board class (pins, power rails)
│   │   │   ├── pin.ts            # Pin class (mode, value, bus)
│   │   │   ├── bus.ts            # Bus abstract class + GPIO/PWM/UART/I2C/SPI
│   │   │   ├── wire.ts           # Wire class (pin-to-pin connection)
│   │   │   └── circuit.ts        # Circuit orchestrator
│   │   ├── avr/
│   │   │   ├── atmega328p.ts     # ATmega328P model (memory, registers, timers)
│   │   │   ├── instructions.ts   # Instruction set interpreter
│   │   │   ├── memory.ts         # Flash, SRAM, EEPROM model
│   │   │   └── interrupts.ts     # Interrupt vector table + handler
│   │   ├── debugger/
│   │   │   ├── debug-controller.ts # Run/Stop/Pause/Step/Breakpoint logic
│   │   │   ├── breakpoint-manager.ts
│   │   │   └── state-inspector.ts  # Pin/variable snapshot
│   │   ├── worker.ts             # Web Worker entry point
│   │   └── worker-api.ts         # Message protocol (main ↔ worker)
│   │
│   ├── plugins/                  # Plugin system
│   │   ├── loader.ts             # Plugin discovery + loading
│   │   ├── registry.ts           # Installed plugin registry
│   │   ├── manifest.ts           # component.json schema + validation
│   │   └── sandbox.ts            # Plugin error isolation wrapper
│   │
│   ├── ui/                       # UI components
│   │   ├── breadboard/
│   │   │   ├── canvas.ts         # Canvas renderer for breadboard grid
│   │   │   ├── component-renderer.ts  # Draw components on canvas
│   │   │   ├── wire-renderer.ts  # Draw wires with bezier curves
│   │   │   └── interaction.ts    # Drag-drop, wire drawing, selection
│   │   ├── toolbar/
│   │   │   ├── sim-controls.ts   # Run/Stop/Pause/Step/Reset buttons
│   │   │   └── board-selector.ts # Board type selector (future)
│   │   ├── palette/
│   │   │   ├── component-palette.ts  # Draggable component list
│   │   │   └── plugin-manager.ts     # Install/uninstall UI
│   │   ├── debugger/
│   │   │   ├── pin-inspector.ts  # Real-time pin state table
│   │   │   ├── variable-view.ts  # Variable watch panel
│   │   │   └── breakpoint-panel.ts # Source line breakpoints
│   │   ├── sub-board/
│   │   │   ├── sub-board-editor.ts   # Sub-board creation canvas
│   │   │   └── module-library.ts     # Saved sub-board modules
│   │   ├── serial-monitor.ts     # Serial output display
│   │   └── app.ts                # Root layout + state management
│   │
│   ├── storage/
│   │   ├── circuit-file.ts       # Save/load circuit JSON
│   │   └── plugin-storage.ts     # Plugin directory management
│   │
│   ├── main.ts                   # App entry point
│   └── styles/
│       └── global.css
│
├── plugins/                      # Built-in component plugins
│   ├── _template/                # Plugin template for reference
│   │   ├── component.json
│   │   ├── index.ts
│   │   └── icon.svg
│   ├── led/
│   ├── resistor/
│   ├── pushbutton/
│   ├── potentiometer/
│   ├── servo/
│   ├── dc-motor/
│   ├── buzzer/
│   ├── rgb-led/
│   ├── photoresistor/
│   ├── temperature-sensor/
│   ├── lcd-display/
│   ├── shift-register/
│   ├── transistor/
│   ├── diode/
│   └── capacitor/
│
├── tests/
│   ├── simulation/
│   │   ├── board.test.ts
│   │   ├── pin.test.ts
│   │   ├── bus-gpio.test.ts
│   │   ├── bus-pwm.test.ts
│   │   ├── bus-uart.test.ts
│   │   ├── bus-i2c.test.ts
│   │   ├── bus-spi.test.ts
│   │   ├── atmega328p.test.ts
│   │   ├── memory.test.ts
│   │   ├── interrupts.test.ts
│   │   └── debugger.test.ts
│   ├── components/
│   │   ├── led.test.ts
│   │   ├── servo.test.ts
│   │   └── ... (one per built-in plugin)
│   ├── integration/
│   │   ├── sketch-upload.test.ts
│   │   ├── serial-monitor.test.ts
│   │   ├── plugin-lifecycle.test.ts
│   │   ├── sub-board.test.ts
│   │   └── circuit-save-load.test.ts
│   └── plugins/
│       ├── loader.test.ts
│       ├── registry.test.ts
│       └── manifest-validation.test.ts
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json
└── README.md
```

**Structure Decision**: Tauri v2 hybrid — Rust backend (`src-tauri/`) handles
virtual serial port creation and OS-level device interaction. TypeScript
frontend (`src/`) contains the simulation engine (Web Worker), UI, and plugin
system. Built-in component plugins live in `plugins/` as self-contained
directories with manifests.

## Complexity Tracking

> No constitution violations detected. Table left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
