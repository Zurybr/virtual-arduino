# Tasks: Arduino Virtual Bus Simulator

**Input**: Design documents from `/specs/001-arduino-virtual-simulator/`

**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, research.md

**Tests**: Constitution Principle VI (Test-First) is NON-NEGOTIABLE. Test tasks are included for all core components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Tauri v2 hybrid app: `src-tauri/` (Rust backend), `src/` (TypeScript frontend)
- Built-in component plugins: `plugins/` (each with `component.json` + `dist/` + `assets/`)
- Tests: `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Tauri v2 project with `npm create tauri-app@latest` selecting TypeScript + Vite template
- [x] T002 [P] Install TypeScript dependencies: `konva`, `react-konva`, `ajv`, `semver`, `uuid` via `npm install`
- [x] T003 [P] Install dev dependencies: `vitest`, `@types/uuid`, `eslint`, `prettier` via `npm install -D`
- [x] T004 [P] Add Rust dependencies in `src-tauri/Cargo.toml`: `serialport`, `nix` (with `term` feature), `zip`, `sha2`, `serde_json`, `tauri`
- [x] T005 [P] Configure TypeScript strict mode in `tsconfig.json`
- [x] T006 [P] Configure Vitest in `vitest.config.ts` with `jsdom` environment
- [x] T007 [P] Configure ESLint + Prettier in `.eslintrc.json` and `.prettierrc`
- [x] T008 Create project directory structure per plan.md: `src/simulation/core/`, `src/simulation/avr/`, `src/simulation/debugger/`, `src/plugins/`, `src/ui/breadboard/`, `src/ui/toolbar/`, `src/ui/palette/`, `src/ui/debugger/`, `src/ui/sub-board/`, `src/storage/`, `plugins/`, `tests/simulation/`, `tests/components/`, `tests/integration/`, `tests/plugins/`
- [x] T009 [P] Configure Tauri CSP in `src-tauri/tauri.conf.json` with COOP/COEP headers for SharedArrayBuffer support
- [x] T010 [P] Create shared types file in `src/types.ts` with PinMode, PinValue, PinCapability, PinRef, GridCoord, BusType, SimulationStatus enums and interfaces from data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create Pin class in `src/simulation/core/pin.ts` implementing pin mode management, value transitions (digital/analog/PWM/floating), capability checks, and event emission on value change
- [x] T012 Create BoardModel value object in `src/simulation/core/board-model.ts` with ATmega328P definition: 32KB flash, 2KB SRAM, 1KB EEPROM, 16MHz clock, signature `[0x1E, 0x95, 0x0F]`, and full pin definitions (20 digital pins with capability mapping for PWM/UART/I2C/SPI on specific pins)
- [x] T013 Create Bus abstract class in `src/simulation/core/bus.ts` with abstract signal propagation methods, pin registration, observable state for debugger, and concrete GPIOBus subclass
- [x] T014 Create Wire class in `src/simulation/core/wire.ts` with PinRef endpoints, Manhattan path waypoints, and signal propagation from source to destination pin
- [x] T015 Create Board class in `src/simulation/core/board.ts` that initializes pins from BoardModel, creates buses (GPIO per port, PWM, UART), manages power rails, and holds flash/sram/eeprom typed arrays
- [x] T016 Create Circuit class in `src/simulation/core/circuit.ts` that orchestrates Board, Component instances, Wires, and net resolution (breadboard internal connections + explicit wires)
- [x] T017 Create Web Worker entry point in `src/simulation/worker.ts` with SharedArrayBuffer double-buffer initialization, message handler dispatch, and simulation tick loop with configurable batch size
- [x] T018 Create Worker API message types in `src/simulation/worker-api.ts` implementing all message types from contracts/simulation-worker.md (load-hex, start, stop, pause, resume, step, set-breakpoint, remove-breakpoint, serial-input, set-pin-external, register-component, unregister-component, inspect-state, pin-update, serial-output, paused, simulation-error, plugin-error)
- [x] T019 Create SharedArrayBuffer layout utility in `src/simulation/shared-buffer.ts` with double-buffer structure: frameId, bufferIndex, registers (32 bytes), SREG, SP, PC, simState, digital pin states, analog pin values — all with Atomics.store/load helpers
- [x] T020 Create virtual serial port manager in `src-tauri/src/serial/mod.rs` with platform-conditional compilation (`#[cfg(target_os)]`) dispatching to platform modules, port lifecycle management (create/destroy), and port path tracking
- [x] T021 [P] Create Linux PTY serial implementation in `src-tauri/src/serial/platform_linux.rs` using `nix::pty::openpty()` to create PTY pairs, with symlink creation to `/dev/ttyVARDUINO*` for Arduino IDE visibility
- [x] T022 [P] Create macOS PTY serial implementation in `src-tauri/src/serial/platform_macos.rs` using `serialport::TTYPort::pair()` to create PTY pairs that appear as `/dev/cu.s*`
- [x] T023 [P] Create Windows virtual COM implementation in `src-tauri/src/serial/platform_windows.rs` shelling out to `com0com` `setupc` for virtual port pair creation
- [x] T024 Create serial port monitor in `src-tauri/src/serial/monitor.rs` that emits `serial-port-appeared`/`serial-port-disappeared` Tauri events on port create/destroy, and forwards incoming serial bytes via `serial-data` event
- [x] T025 Create Tauri command registrations in `src-tauri/src/commands/mod.rs` registering all commands from contracts/rust-backend.md: `create_virtual_port`, `destroy_virtual_port`, `list_virtual_ports`, `write_serial`, `install_plugin`, `uninstall_plugin`, `list_plugins`, `load_plugin_bundle`, `save_circuit`, `load_circuit`, `show_save_dialog`, `show_open_dialog`
- [x] T026 Create serial Tauri commands in `src-tauri/src/commands/serial_cmd.rs` implementing `create_virtual_port`, `destroy_virtual_port`, `list_virtual_ports`, and `write_serial` using the serial port manager
- [x] T027 Create main Tauri entry in `src-tauri/src/main.rs` initializing the app with serial port creation on startup and cleanup on shutdown, registering all commands and event listeners

**Checkpoint**: Foundation ready — virtual serial port appears in Arduino IDE, shared buffer and worker infrastructure in place. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Blink an LED (Priority: P1) 🎯 MVP

**Goal**: Upload a blink sketch from Arduino IDE, see an LED toggle on the virtual breadboard, observe serial output, and use debugging controls.

**Independent Test**: Upload any sketch from Arduino IDE and observe pin state changes on a connected LED with serial monitor output.

### Tests for User Story 1

- [x] T028 [P] [US1] Test Pin class in `tests/simulation/pin.test.ts`: mode transitions (INPUT→OUTPUT→PWM), value updates (digital high/low, analog 0-1023, PWM duty cycle), capability validation, event emission on change
- [x] T029 [P] [US1] Test Board class in `tests/simulation/board.test.ts`: pin count matches ATmega328P model, bus creation (GPIO ports B/C/D), flash/SRAM typed array sizes, power rail initialization, pin mode configuration
- [x] T030 [P] [US1] Test GPIO bus in `tests/simulation/bus-gpio.test.ts`: pin registration, HIGH/LOW signal propagation, multi-pin state observation, bus state snapshot for debugger
- [x] T031 [P] [US1] Test ATmega328P memory model in `tests/simulation/memory.test.ts`: flash read/write (Uint16Array), SRAM layout (registers 0x00-0x1F, I/O 0x20-0xFF, SRAM 0x100-0x8FF), EEPROM persistence simulation, boundary checks
- [x] T032 [P] [US1] Test AVR CPU core in `tests/simulation/atmega328p.test.ts`: basic instruction execution (NOP, MOV, LDI, ADD, SUB), register file R0-R31, SREG flag updates (Z/C/N/V/H), PC advancement, cycle counting
- [x] T033 [P] [US1] Test interrupt controller in `tests/simulation/interrupts.test.ts`: Timer0 overflow ISR firing, UART RX ISR, external interrupt triggers, ISR return and PC restore, interrupt enable/disable via SREG I-flag

### Implementation for User Story 1

- [x] T034 [P] [US1] Create AVR memory model in `src/simulation/avr/memory.ts`: Flash (Uint16Array 16384 entries), SRAM (Uint8Array 2048 bytes with register/I/O/SRAM regions), EEPROM (Uint8Array 1024 bytes), with read/write methods that enforce ATmega328P memory map boundaries
- [x] T035 [US1] Create ATmega328P CPU core in `src/simulation/avr/atmega328p.ts` integrating avr8js or forking its interpreter: instruction decode and execute loop, 32 general-purpose registers, SREG, SP, PC, virtual cycle counter, peripheral attachment points for GPIO/UART/Timer callbacks
- [x] T036 [P] [US1] Create instruction set interpreter in `src/simulation/avr/instructions.ts` (or integrate avr8js instruction handlers): decode AVR opcodes from flash words, dispatch to handlers for arithmetic/logic/branch/bit/I/O/memory/load-store instructions, track cycle counts per instruction
- [x] T037 [P] [US1] Create GPIO peripheral in `src/simulation/avr/gpio.ts`: port registers (PORTB/C/D, PINB/C/D, DDRB/C/D) mapped to ATmega328P I/O addresses, pin mode translation (DDR→INPUT/OUTPUT), digital read/write callback to Board pins, external pin change injection (from button presses)
- [x] T038 [P] [US1] Create Timer0 peripheral in `src/simulation/avr/timer0.ts`: normal mode and CTC mode, prescaler, overflow flag (TOV0) and compare match flag (OCF0A/B), interrupt generation on overflow/compare match connected to interrupt controller, cycle-based ticking
- [x] T039 [P] [US1] Create UART peripheral in `src/simulation/avr/uart.ts`: USART0 registers (UDRn, UCSRA/B/Cn, UBRRn), baud rate calculation from UBRR, TX buffer with byte-by-byte transmission simulation, RX buffer receiving from serial input, RX-complete and TX-complete interrupt generation
- [x] T040 [US1] Create interrupt controller in `src/simulation/avr/interrupts.ts`: vector table at flash addresses 0x0000-0x0034, global interrupt enable (SREG I-flag), ISR dispatch on peripheral trigger, PC push/pop to stack, reti instruction handling
- [x] T041 [P] [US1] Create Intel HEX parser in `src/simulation/avr/hex-parser.ts`: parse Intel HEX records (byte count, address, type 00=data, type 01=EOF), write data bytes into flash Uint16Array at correct addresses, validate checksums
- [x] T042 [US1] Create debug controller in `src/simulation/debugger/debug-controller.ts`: run/stop/pause/resume/step/reset state machine per data-model.md SimulationState transitions, instruction batching control, yield points for message processing
- [x] T043 [US1] Create breakpoint manager in `src/simulation/debugger/breakpoint-manager.ts`: Set<number> of PC addresses, add/remove/check operations, O(1) has() check per instruction, conditional breakpoint evaluation
- [x] T044 [US1] Create state inspector in `src/simulation/debugger/state-inspector.ts`: snapshot current registers, SREG flags, SP, PC, SRAM region, pin states — write to SharedArrayBuffer back-buffer, full state dump for debugger pause events
- [x] T045 [US1] Create STK500v1 protocol handler in `src-tauri/src/serial/stk500.rs`: respond to SYNC (0x30), READ_SIGN (return ATmega328P signature 0x1E 0x95 0x0F), ENTER_PROGMODE, LOAD_ADDRESS, PROG_PAGE (buffer 128-byte pages), LEAVE_PROGMODE; emit `upload-progress` and `upload-complete` Tauri events
- [x] T046 [US1] Integrate STK500 handler with serial port manager in `src-tauri/src/serial/mod.rs`: route incoming serial bytes to STK500 handler when in upload mode, detect port open as DTR-reset equivalent, forward parsed HEX data to worker via `upload-complete` event
- [x] T047 [US1] Complete Worker simulation loop in `src/simulation/worker.ts`: handle all worker-api.ts message types, execute batched instruction ticks with yield for control messages, register AVR peripherals (GPIO, Timer0, UART, interrupts) with CPU, propagate pin changes to SharedArrayBuffer, post serial-output messages to main thread
- [x] T048 [US1] Create main thread simulation bridge in `src/simulation/main-bridge.ts`: spawn Worker, forward Tauri serial-data events to worker via postMessage, read SharedArrayBuffer in requestAnimationFrame loop, dispatch pin-update events to UI, handle serial-output forwarding to Rust `write_serial`
- [x] T049 [P] [US1] Create basic app layout in `src/ui/app.ts`: Konva Stage with three Layers (background, components, interaction), toolbar panel, debugger panel, serial monitor panel, component palette — using responsive layout
- [x] T050 [P] [US1] **[REWRITTEN]** Create infinite dot grid workspace canvas in `src/ui/workspace/`: React-Konva Stage with pan/zoom (mouse wheel, middle-mouse-button, pinch), dot grid background rendered dynamically per viewport, dark theme, Arduino Uno as a visual component with visible pin connection points — replaces breadboard grid approach
- [x] T051 [P] [US1] **[REWRITTEN]** Create Fritzing-style component renderer in `src/ui/workspace/ComponentItem.tsx`: realistic visual SVG representations for each component type (LED, resistor, etc.), positioned freely on the workspace, with visible pin connection points (color-coded by type), glow/animation effects for state changes
- [x] T052 [P] [US1] Create simulation controls toolbar in `src/ui/toolbar/sim-controls.ts`: Run, Stop, Pause, Resume, Step, Reset buttons with icon states, disabled states per simulation status, keyboard shortcuts (F5=run, Shift+F5=stop, F9=toggle breakpoint)
- [x] T053 [P] [US1] Create pin inspector panel in `src/ui/debugger/pin-inspector.ts`: real-time table of all 20 Arduino pins showing mode, value (HIGH/LOW/analog/PWM), bus assignment — updated from SharedArrayBuffer state at 60fps
- [x] T054 [P] [US1] Create serial monitor display in `src/ui/serial-monitor.ts`: scrolling text display of UART output from worker, input field for sending serial data to worker, baud rate display, clear button
- [x] T055 [US1] Create LED component plugin in `plugins/led/`: `component.json` manifest (pins: anode digital-input, cathode ground; power: 5V 20mA; category: basic), `dist/index.js` implementing ComponentPlugin interface with onPinChange to toggle on/brightness state, `assets/icon.svg` (LED symbol)
- [x] T056 [US1] Create plugin loader minimal bootstrap in `src/plugins/loader.ts`: scan `plugins/` directory for built-in plugins at startup, parse component.json via ajv JSON Schema validation, register in plugin registry — external install flow deferred to US3
- [x] T057 [US1] Create minimal plugin registry in `src/plugins/registry.ts`: Map<string, PluginManifest> of loaded plugins, lookup by name, list by category, basic plugin manifest types in `src/plugins/manifest.ts`
- [x] T058 [P] [US1] **[REWRITTEN]** Create free-form drag & drop interaction in `src/ui/workspace/InteractionLayer.tsx`: drag components from palette onto workspace with free placement, snap-to-dot-grid (configurable 20px spacing), ghost preview at 70% opacity during drag, wire-to-pin connection initiation, component selection/rotation/deletion
- [x] T059 [US1] Integrate end-to-end blink flow: Worker loads HEX from STK500 upload → CPU executes with GPIO peripheral → pin 13 toggles → SharedArrayBuffer update → Canvas renders LED glow on/off → Serial output appears in monitor. Verify with manual test in quickstart.md VS-1 and VS-2

**Checkpoint**: At this point, User Story 1 should be fully functional — upload a blink sketch from Arduino IDE, see LED toggle, use debug controls, read serial output.

---

## Phase 4: User Story 2 - Wire Multiple Components (Priority: P2)

**Goal**: Place multiple components, draw wires between them on the breadboard, and observe PWM-controlled behavior.

**Independent Test**: Connect a pushbutton and LED with wires, upload a sketch that reads button input and controls LED brightness via PWM.

### Tests for User Story 2

- [x] T060 [P] [US2] Test PWM bus in `tests/simulation/bus-pwm.test.ts`: duty cycle 0-255 propagation, frequency setting, component response to PWM value changes, PWM value 0 = off, 255 = fully on
- [x] T061 [P] [US2] Test Wire class in `tests/simulation/wire.test.ts`: two-pin connection, signal propagation from source to destination, Manhattan path generation, same-pin and self-connect validation errors
- [x] T062 [P] [US2] Test Circuit net resolution in `tests/simulation/circuit.test.ts`: breadboard internal net connections (5-hole rows), wire-based connections, multi-component circuit with GPIO+PWM, signal propagation through complete circuit

### Implementation for User Story 2

- [x] T063 [US2] Create PWM bus in `src/simulation/core/bus.ts` (extend Bus): duty cycle and frequency propagation, connection to AVR Timer1/Timer2 PWM outputs, observable PWM state for pin inspector
- [x] T064 [US2] Create Timer1 peripheral in `src/simulation/avr/timer1.ts`: fast PWM mode, prescaler, ICR1/TOP, OCR1A/B compare match, PWM output on pins 9/10 connected to PWM bus
- [x] T065 [US2] Create Timer2 peripheral in `src/simulation/avr/timer2.ts`: fast PWM mode, prescaler, OCR2A/B compare match, PWM output on pins 3/11 connected to PWM bus
- [x] T066 [US2] **[REWRITTEN]** Create wire renderer in `src/ui/workspace/WireLayer.tsx`: render bezier curve wires between free-positioned component pins on Konva layer, color coding by wire type, smooth curves (not Manhattan routing), snap to pin connection points, visual offset for overlapping wires
- [x] T067 [US2] **[REWRITTEN]** Create wire drawing interaction in `src/ui/workspace/InteractionLayer.tsx` (extend): rubber-band wire preview during creation, click source pin → drag → click destination pin, bezier curve preview, wire color selection, snap-to-valid-target highlighting (green=valid, red=invalid)
- [x] T068 [US2] Create component palette in `src/ui/palette/component-palette.ts`: searchable grid of available components from plugin registry, drag initiation to breadboard canvas, category grouping (basic, sensor, actuator, display, IC), component count display
- [x] T069 [P] [US2] Create pushbutton component plugin in `plugins/pushbutton/`: component.json (pins: terminal-a, terminal-b both digital; normally open), onPinChange handler, user click simulation that toggles pin HIGH/LOW, `assets/icon.svg`
- [x] T070 [P] [US2] Create resistor component plugin in `plugins/resistor/`: component.json (pins: terminal-a, terminal-b; passive component), pass-through signal behavior, configurable resistance value, `assets/icon.svg`
- [x] T071 [P] [US2] Create potentiometer component plugin in `plugins/potentiometer/`: component.json (pins: terminal-a, wiper, terminal-b; analog output), user-adjustable wiper position via slider in UI, `assets/icon.svg`
- [x] T072 [P] [US2] Create servo component plugin in `plugins/servo/`: component.json (pins: vcc, gnd, signal PWM-input), onPinChange handler that maps PWM duty cycle to angle (0-180°), visual rotation indicator, `assets/icon.svg`
- [x] T073 [US2] **[REWRITTEN]** Enhance component placement interaction in `src/ui/workspace/InteractionLayer.tsx`: multi-select via rubber-band rectangle, component rotation (right-click or R key), component deletion (Delete key), wire deletion (click to select, Delete to remove), free-form positioning on dot grid workspace
- [x] T074 [US2] Integrate multi-component wiring: place pushbutton + resistor + LED, wire on breadboard, upload fade-on-press sketch, verify PWM brightness control. Verify with quickstart.md VS-4

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can place multiple components, wire them, and see PWM-controlled behavior.

---

## Phase 5: User Story 3 - Plugin System (Priority: P3)

**Goal**: Install a component plugin from a .zip file, see it in the palette, place and wire it, and uninstall it.

**Independent Test**: Install an HC-SR04 plugin, place it on the breadboard, wire it, upload a sketch, and verify distance readings. Uninstall and verify removal.

### Tests for User Story 3

- [x] T075 [P] [US3] Test manifest validation in `tests/plugins/manifest-validation.test.ts`: valid manifest passes, missing required fields fail, invalid pin types fail, invalid semver ranges fail, JSON Schema validation via ajv
- [x] T076 [P] [US3] Test plugin loader in `tests/plugins/loader.test.ts`: load built-in plugin from directory, load external plugin via dynamic import, engines version compatibility check, missing main entry error, invalid manifest rejection
- [x] T077 [P] [US3] Test plugin registry in `tests/plugins/registry.test.ts`: register plugin, lookup by name, list by category, duplicate name rejection, unregister plugin
- [x] T078 [P] [US3] Test plugin sandbox in `tests/plugins/sandbox.test.ts`: PluginContainer wraps plugin with try/catch, crashing plugin enters error state, other plugins continue running, error notification emitted

### Implementation for User Story 3

- [x] T079 [P] [US3] Create plugin manifest schema and validator in `src/plugins/manifest.ts`: full JSON Schema from contracts/plugin-manifest-schema.json, ajv compilation and validation function, semver range checking for `engines.simulator` and `engines.pluginApi`
- [x] T080 [US3] Create plugin loader in `src/plugins/loader.ts` (extend): dynamic `import()` with `@vite-ignore` from `file://` URLs for external plugins, self-contained ESM bundle requirement, import map for shared plugin SDK API
- [x] T081 [P] [US3] Create plugin sandbox in `src/plugins/sandbox.ts`: PluginContainer wrapper class with try/catch on every lifecycle method (init/start/stop/destroy/onPinChange), state machine (loading→initialized→running→stopped→destroyed + error from any state), error notification dispatch to UI
- [x] T082 [US3] Create plugin storage backend in `src/storage/plugin-storage.ts`: resolve plugin directory paths via Tauri appDataDir, manage plugin file structure, validate .zip archives before extraction
- [x] T083 [US3] Create plugin Tauri commands in `src-tauri/src/commands/plugin_cmd.rs`: `install_plugin` (validate zip, extract to plugins dir, return manifest), `uninstall_plugin` (remove directory, update registry), `list_plugins` (scan directory, parse manifests), `load_plugin_bundle` (read JS file content)
- [x] T084 [US3] Create plugin manager UI in `src/ui/palette/plugin-manager.ts`: install button with native file dialog (.zip filter), installed plugins list with version/category, uninstall button with confirmation, progress indicator during install
- [x] T085 [P] [US3] Create plugin template in `plugins/_template/`: `component.json` with documented fields and placeholder values, `index.ts` with skeleton ComponentPlugin implementation and commented lifecycle methods, `assets/icon.svg` placeholder, README with plugin development guide
- [x] T086 [P] [US3] Create buzzer plugin in `plugins/buzzer/`: component.json (pins: vcc, gnd, signal digital-input), tone generation on HIGH with configurable frequency via manifest, `assets/icon.svg`
- [x] T087 [P] [US3] Create RGB LED plugin in `plugins/rgb-led/`: component.json (pins: r, g, b digital-input/PWM, gnd), onPinChange handler mapping 3 PWM values to RGB color state, `assets/icon.svg`
- [x] T088 [P] [US3] Create photoresistor plugin in `plugins/photoresistor/`: component.json (pins: vcc, gnd, output analog-output), user-adjustable light level slider, `assets/icon.svg`
- [x] T089 [P] [US3] Create temperature sensor plugin in `plugins/temperature-sensor/`: component.json (pins: vcc, gnd, data analog-output; protocol: one-wire), user-adjustable temperature value, `assets/icon.svg`
- [x] T090 [P] [US3] Create DC motor plugin in `plugins/dc-motor/`: component.json (pins: vcc, gnd, enable PWM-input, in1 digital, in2 digital), speed/direction from PWM + digital pins, `assets/icon.svg`
- [x] T091 [P] [US3] Create LCD display plugin in `plugins/lcd-display/`: component.json (pins: rs, en, d4-d7 digital-input; protocol: gpio), 16x2 text display rendering, cursor control, `assets/icon.svg`
- [x] T092 [P] [US3] Create shift register plugin in `plugins/shift-register/`: component.json (pins: vcc, gnd, ser, srclk, rclk digital-input; protocol: spi-like), 8-bit output expansion, `assets/icon.svg`
- [x] T093 [P] [US3] Create transistor plugin in `plugins/transistor/`: component.json (pins: collector, base, emitter), signal amplification/gating behavior, `assets/icon.svg`
- [x] T094 [P] [US3] Create diode plugin in `plugins/diode/`: component.json (pins: anode, cathode), one-way signal pass-through, voltage drop simulation, `assets/icon.svg`
- [x] T095 [P] [US3] Create capacitor plugin in `plugins/capacitor/`: component.json (pins: terminal-a, terminal-b), charge/discharge timing behavior, `assets/icon.svg`
- [x] T096 [US3] Integrate plugin lifecycle: install HC-SR04 via plugin manager → validate manifest → extract to plugins dir → hot-load into registry → appear in palette → place on breadboard → wire → upload sketch → verify behavior. Uninstall → verify removal from palette and instances flagged missing. Verify with quickstart.md VS-6

**Checkpoint**: All three user stories now work independently. Plugin system enables extensibility with 15 built-in components.

---

## Phase 6: User Story 4 - Custom Sub-Boards (Priority: P4)

**Goal**: Create a custom sub-board with components and optional secondary MCU, save it, place it on the main breadboard, connect via I2C/SPI/UART, and run concurrent simulations.

**Independent Test**: Create a sub-board with an ATtiny85 and LEDs, save it, connect via I2C to the main Arduino, upload separate firmware, verify bidirectional communication.

### Tests for User Story 4

- [x] T097 [P] [US4] Test I2C bus in `tests/simulation/bus-i2c.test.ts`: address-based routing, SDA/SCL signal propagation, master transmit/receive, device addressing (7-bit), ACK/NACK response, observable bus state
- [x] T098 [P] [US4] Test SPI bus in `tests/simulation/bus-spi.test.ts`: MOSI/MISO/SCK/SS signal propagation, clock rate, master-slave data exchange, chip select addressing, observable bus state
- [x] T099 [P] [US4] Test sub-board model in `tests/integration/sub-board.test.ts`: create sub-board with components and wires, expose external pins, save/load as module, connect to main board via bus, verify signal propagation between boards

### Implementation for User Story 4

- [x] T100 [P] [US4] Create I2C bus in `src/simulation/core/bus.ts` (extend): SDA/SCL pin management, 7-bit address routing, master transmit/receive protocol simulation, clock stretching support, observable I2C state (address, data buffer, SDA/SCL levels)
- [x] T101 [P] [US4] Create SPI bus in `src/simulation/core/bus.ts` (extend): MOSI/MISO/SCK/SS pin management, clock rate configuration, full-duplex data exchange, chip select management, observable SPI state
- [x] T102 [P] [US4] Create TWI/I2C peripheral in `src/simulation/avr/twi.ts`: TWI registers (TWBR, TWCR, TWSR, TWDR, TWAR), master/slave mode, START/STOP condition generation, address matching, interrupt generation
- [x] T103 [P] [US4] Create SPI peripheral in `src/simulation/avr/spi.ts`: SPI registers (SPCR, SPSR, SPDR), master/slave mode, clock polarity/phase (CPOL/CPHA), data register exchange, interrupt generation
- [x] T104 [US4] Create SubBoard model in `src/simulation/core/sub-board.ts`: optional secondary Board with own MCU (ATtiny85 support), internal components and wires, exposed external pins, connection to main board bus, independent simulation tick loop
- [x] T105 [US4] Create sub-board editor in `src/ui/sub-board/sub-board-editor.ts`: separate canvas for designing sub-board circuits, component placement and wiring within sub-board, external pin designation UI, save-as-module action
- [x] T106 [US4] Create module library in `src/ui/sub-board/module-library.ts`: list of saved sub-board modules, drag to place on main breadboard, module details view (components, pins, protocols), delete module
- [x] T107 [US4] Extend virtual serial port manager for sub-boards: create additional virtual serial ports per sub-board MCU, each port independently accessible from Arduino IDE, map port to sub-board for firmware upload
- [x] T108 [US4] Extend Worker to support concurrent sub-board simulation: multiple CPU instances (main ATmega328P + sub-board ATtiny85s), independent tick loops, bus-level communication between instances, shared SharedArrayBuffer region for sub-board pin states
- [x] T109 [US4] Integrate sub-board flow: create sub-board with components → save as module → place on main breadboard → connect external pins via I2C → create virtual serial port for sub-board → upload firmware to sub-board from IDE → verify concurrent execution and I2C communication. Verify with quickstart.md

**Checkpoint**: All four user stories are now independently functional. Sub-boards enable advanced modular circuit design.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T110 [P] Implement edge case dual behavior in `src/simulation/core/circuit.ts`: detect short circuits (two OUTPUT pins wired with conflicting values) and display real behavior + warning, detect overcurrent (sum component currents > supply) with brownout + warning, detect protocol mismatch with no-communication + warning
- [x] T111 [P] Implement edge case handling in Worker: sketch memory overflow detection (check flash write address against ATmega328P flash size) → halt + error notification (FR-014), sketch upload-while-running → stop current + reset pins + start new + notification (FR-020)
- [x] T112 [P] Implement plugin error isolation in Worker integration: catch plugin onPinChange errors, mark plugin as unhealthy, emit plugin-error notification to main thread, continue simulation without the failed plugin (FR-019)
- [x] T113 [P] Create circuit save/load in `src/storage/circuit-file.ts`: serialize Circuit (board, components, wires, sub-boards, layout) to JSON, deserialize and reconstruct circuit, validate loaded data against current plugin availability, mark missing plugins
- [x] T114 [P] Create circuit file Tauri commands in `src-tauri/src/commands/mod.rs` (extend): `save_circuit` writes JSON to user-selected path, `load_circuit` reads JSON from user-selected path, `show_save_dialog` and `show_open_dialog` with `.circuit.json` filter
- [x] T115 [P] Create breakpoint panel UI in `src/ui/debugger/breakpoint-panel.ts`: list active breakpoints with PC addresses and source locations, click to jump to breakpoint in code view, toggle enable/disable, conditional breakpoint editing
- [x] T116 [P] Create variable watch panel in `src/ui/debugger/variable-view.ts`: display register values R0-R31, SREG flags (I/T/H/S/V/N/Z/C), SP, PC, selected SRAM addresses, update on pause/step from SharedArrayBuffer
- [x] T117 [P] Implement source map integration: parse DWARF line info from `.elf` files (pre-built at compile time) into PC→source-location map, display current source line highlight in breakpoint panel, map breakpoint source-line clicks to PC addresses
- [x] T118 [P] **[REWRITTEN]** Add zoom and pan to workspace canvas in `src/ui/workspace/Workspace.tsx`: mouse wheel zoom (0.25x–4x) centered on cursor, middle-mouse-button pan, pinch-to-zoom on trackpad, infinite dot grid that adapts to viewport, screen-to-world coordinate transform
- [x] T119 [P] Create app entry point in `src/main.ts`: initialize Tauri frontend, spawn simulation Worker, load built-in plugins, set up main-bridge event routing, render Konva app layout
- [x] T120 Run full quickstart.md validation: execute all 8 validation scenarios (VS-1 through VS-8) and verify passing results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (Phase 3) and US2 (Phase 4) are sequential (US2 needs PWM which needs US1 timers)
  - US3 (Phase 5) can start after US1 is complete (plugin system needs simulation engine)
  - US4 (Phase 6) depends on US2 completion (needs I2C/SPI buses and multi-component wiring)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories
- **User Story 2 (P2)**: Can start after US1 (needs Timer1/Timer2 PWM which extends US1 AVR peripherals)
- **User Story 3 (P3)**: Can start after US1 (needs simulation engine running for plugin integration testing)
- **User Story 4 (P4)**: Can start after US2 (needs I2C/SPI buses and sub-board builds on wiring UI)

### Within Each User Story

- Tests written and MUST FAIL before implementation
- Core models before services
- AVR peripherals before Worker integration
- Worker integration before UI
- Component plugins can be parallel within a story
- Integration test is the final task in each story

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T010)
- All Foundational platform modules can run in parallel (T021-T023)
- All test tasks within a story can run in parallel
- All component plugins within a story can run in parallel
- Phase 7 Polish tasks are almost all parallelizable

---

## Parallel Example: User Story 1

```bash
# Phase 2 platform implementations (parallel):
Task: "T021 Linux PTY serial in src-tauri/src/serial/platform_linux.rs"
Task: "T022 macOS PTY serial in src-tauri/src/serial/platform_macos.rs"
Task: "T023 Windows COM serial in src-tauri/src/serial/platform_windows.rs"

# US1 tests (all parallel):
Task: "T028 Test Pin in tests/simulation/pin.test.ts"
Task: "T029 Test Board in tests/simulation/board.test.ts"
Task: "T030 Test GPIO bus in tests/simulation/bus-gpio.test.ts"
Task: "T031 Test memory in tests/simulation/memory.test.ts"
Task: "T032 Test CPU in tests/simulation/atmega328p.test.ts"
Task: "T033 Test interrupts in tests/simulation/interrupts.test.ts"

# US1 AVR peripherals (all parallel):
Task: "T034 Memory model in src/simulation/avr/memory.ts"
Task: "T036 Instructions in src/simulation/avr/instructions.ts"
Task: "T037 GPIO in src/simulation/avr/gpio.ts"
Task: "T038 Timer0 in src/simulation/avr/timer0.ts"
Task: "T039 UART in src/simulation/avr/uart.ts"
Task: "T041 HEX parser in src/simulation/avr/hex-parser.ts"

# US1 UI components (all parallel):
Task: "T049 App layout in src/ui/app.ts"
Task: "T050 Breadboard canvas in src/ui/breadboard/canvas.ts"
Task: "T051 Component renderer in src/ui/breadboard/component-renderer.ts"
Task: "T052 Sim controls in src/ui/toolbar/sim-controls.ts"
Task: "T053 Pin inspector in src/ui/debugger/pin-inspector.ts"
Task: "T054 Serial monitor in src/ui/serial-monitor.ts"
```

---

## Parallel Example: User Story 3 (Built-in Plugins)

```bash
# All 10 remaining component plugins (parallel):
Task: "T086 Buzzer plugin in plugins/buzzer/"
Task: "T087 RGB LED plugin in plugins/rgb-led/"
Task: "T088 Photoresistor plugin in plugins/photoresistor/"
Task: "T089 Temperature sensor plugin in plugins/temperature-sensor/"
Task: "T090 DC motor plugin in plugins/dc-motor/"
Task: "T091 LCD display plugin in plugins/lcd-display/"
Task: "T092 Shift register plugin in plugins/shift-register/"
Task: "T093 Transistor plugin in plugins/transistor/"
Task: "T094 Diode plugin in plugins/diode/"
Task: "T095 Capacitor plugin in plugins/capacitor/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test VS-1 (port lifecycle), VS-2 (blink), VS-3 (serial monitor), VS-5 (debug controls)
5. At this point you have a working Arduino simulator that can upload and run sketches

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Working Arduino simulator with LED, serial, debug (MVP!)
3. Add User Story 2 → Test independently → Multi-component wiring with PWM
4. Add User Story 3 → Test independently → Plugin system with 15 components
5. Add User Story 4 → Test independently → Sub-boards with secondary MCUs
6. Polish → Edge cases, save/load, zoom/pan

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (Constitution Principle VI: TDD NON-NEGOTIABLE)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution Principle VII (YAGNI): GPIO/PWM/UART in US1-US2, I2C/SPI deferred to US4
