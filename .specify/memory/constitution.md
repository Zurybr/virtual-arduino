<!--
  Sync Impact Report
  ==================
  Version change: N/A → 1.0.0 (initial ratification)
  Modified principles: N/A (first version)
  Added sections:
    - Core Principles (7 principles)
    - Technology Stack
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ compatible (no changes needed)
    - .specify/templates/spec-template.md: ✅ compatible (no changes needed)
    - .specify/templates/tasks-template.md: ✅ compatible (no changes needed)
  Follow-up TODOs: None
-->

# Arduino Virtual Bus Simulator Constitution

## Core Principles

### I. Hardware Abstraction First

Every physical component MUST be modeled as an independent, self-contained
TypeScript class implementing a well-defined `Component` interface. Each
component MUST declare its pin requirements, power draw, and communication
protocol. Components MUST NOT directly depend on other components; all
interaction MUST go through the bus system.

**Rationale**: Mirrors real-world hardware design where components are
interchangeable black boxes connected via standardized buses.

### II. Bus Architecture

The simulator MUST implement virtual buses matching real hardware protocols
(GPIO, I2C, SPI, UART, PWM). Signal propagation between components MUST
respect bus semantics: address-based routing for I2C/SPI, voltage-level
signaling for GPIO, and frequency-based modulation for PWM. Bus state MUST
be observable at all times for debugging.

**Rationale**: Accurate bus behavior is what makes the simulator useful as
a learning and prototyping tool. Without it, the simulation has no fidelity.

### III. Modularity & Plugin System

All components (LEDs, servos, sensors, displays, custom chips) MUST be
distributed as plugins following a standardized manifest format. The core
simulator MUST NOT contain any component implementations—only the bus
infrastructure and plugin loader. Third-party or user-created plugins MUST
be installable at runtime without rebuilding the application.

**Rationale**: An open plugin architecture allows the ecosystem to grow
organically and lets users build custom boards and microchips without
touching core code.

### IV. IDE Integration via Serial Protocol

The simulator MUST present itself to the Arduino IDE as a virtual serial
port (USB CDC ACM or similar). Uploading a sketch from the IDE MUST work
identically to uploading to a physical board. When the application closes,
the virtual port MUST disappear, exactly as if a physical device were
unplugged. Serial Monitor output from the simulated sketch MUST flow back
to the IDE through the same virtual port.

**Rationale**: Seamless IDE integration is the core value proposition.
Users should not need to learn a new tool—they use the Arduino IDE as usual.

### V. Real-Time Simulation

Pin state changes, timer interrupts, and analog reads MUST propagate within
a single animation frame (≤16ms). The simulation loop MUST use a
deterministic tick model where each Arduino instruction cycle is processed
sequentially. UI rendering MUST be decoupled from simulation ticks to
maintain responsiveness.

**Rationale**: Laggy or non-deterministic simulation breaks the illusion
of a physical device and makes time-dependent sketches (servo control,
tone generation, sensor polling) unusable.

### VI. Test-First Development (NON-NEGOTIABLE)

All component models, bus protocols, and plugin interfaces MUST be developed
using strict TDD: write tests → tests fail → implement → tests pass →
refactor. Every plugin MUST ship with its own test suite validating pin
behavior under all supported configurations. Integration tests MUST verify
end-to-end sketch upload → execution → serial output flow.

**Rationale**: A simulator that does not behave like real hardware is worse
than no simulator. Tests are the only way to guarantee behavioral fidelity
across the growing component library.

### VII. Simplicity & YAGNI

Start with the ATmega328P (Arduino Uno) as the sole supported
microcontroller. Start with GPIO, PWM, and UART as the only buses. Add
I2C, SPI, and additional boards only when there is a concrete, tested need.
Every abstraction layer MUST justify its existence with at least two
independent consumers.

**Rationale**: Over-engineering the plugin system or simulating ten board
variants before a single LED blinks is a guaranteed path to project failure.

## Technology Stack

- **Framework**: Tauri v2 (Rust backend + TypeScript/HTML/CSS frontend)
- **Language**: TypeScript (strict mode) for simulation logic and UI;
  Rust for native serial port emulation and OS-level device drivers
- **Frontend**: Canvas- or WebGL-based circuit visualizer (component
  rendering and wiring)
- **Simulation Engine**: TypeScript class hierarchy running in a Web
  Worker to avoid blocking the UI thread
- **Serial Emulation**: Rust `serialport` crate or platform-specific
  virtual COM port driver (e.g., `tty0tty` on Linux, com0com on Windows)
- **Plugin Format**: Directory-based with a `component.json` manifest,
  compiled TypeScript bundle, and optional assets (SVG/icons)
- **Build Tool**: Vite for frontend bundling; Cargo for Rust backend
- **Testing**: Vitest for TypeScript unit/integration tests;
  `cargo test` for Rust serial layer tests
- **Linting**: ESLint + Prettier (TypeScript); rustfmt + clippy (Rust)

## Development Workflow

1. **Feature specs** MUST be written before any code, following the
   spec-template format in `.specify/templates/spec-template.md`.
2. **Implementation plans** MUST reference the Constitution Check section
   and verify compliance with all seven principles.
3. **Branch naming**: `###-feature-name` as specified in plan templates.
4. **Commit discipline**: One logical change per commit; commit messages
   follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`).
5. **Code review**: Every PR MUST pass automated tests and MUST be
   reviewed for principle compliance before merge.
6. **Plugin contributions**: External plugins MUST include manifest,
   tests, and at least one usage example before acceptance.

## Governance

This constitution is the authoritative source of architectural and
process decisions for the Arduino Virtual Bus Simulator project.

- **Amendments** require documentation of the change, rationale, and
  a migration plan for any affected code.
- **Version bumps** follow semantic versioning:
  - MAJOR: principle removal or redefinition
  - MINOR: new principle or materially expanded guidance
  - PATCH: wording clarifications, typo fixes
- **Compliance**: All code reviews MUST verify adherence to the seven
  core principles. Any deviation MUST be documented in the Complexity
  Tracking section of the implementation plan.
- **Runtime guidance**: Use `AGENTS.md` for agent-specific development
  instructions that supplement (never contradict) this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-06-09
