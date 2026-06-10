# Research: Arduino Virtual Bus Simulator

**Date**: 2026-06-09
**Status**: Complete

## 1. Virtual Serial Port Creation (Rust Backend)

### Decision: Platform-specific PTY + com0com

**Rationale**: PTY pairs (via `serialport::TTYPort::pair()` or `nix::pty::openpty()`) work on Linux and macOS with no external dependencies. Windows requires the `com0com` kernel driver for virtual COM ports.

**Alternatives considered**:
- `socat` subprocess: external dependency, poor Arduino IDE visibility
- Custom kernel drivers per platform: months of work per OS
- USB gadget (`g_serial` on Linux): requires root, kernel config
- IOKit kext on macOS: deprecated by Apple, requires signing

### Platform details

| Platform | Method | Rust crate/API | Arduino IDE visibility | Complexity |
|----------|--------|---------------|----------------------|------------|
| Linux | `nix::pty::openpty()` | `nix` crate (term feature) | Needs symlink `/dev/ttyVARDUINO*` or manual port entry | Low |
| macOS | `serialport::TTYPort::pair()` | `serialport` crate | `/dev/cu.s*` appears automatically | Low |
| Windows | `com0com` driver (bundled) | Shell out to `setupc` | COM ports appear in IDE | Medium (admin install) |

### Key findings
- `serialport-rs` can only **open** existing ports, not create virtual ones (except `TTYPort::pair()` on Unix)
- PTY ports lack USB VID/PID metadata → Arduino IDE shows them as generic serial ports (no auto board identification)
- User must manually select board type in Arduino IDE (or we ship a custom `boards.txt` entry)
- DTR auto-reset not available on PTYs → detect port open/close as reset signal instead

### STK500v1 protocol (sketch upload)

The simulator must respond to these STK500v1 commands on the virtual serial port:

| Command | Bytes | Expected Response |
|---------|-------|-------------------|
| SYNC | `0x30 0x20` | `0x14 0x10` |
| READ_SIGN | `0x75 0x20` | `0x14 0x1E 0x95 0x0F 0x10` (ATmega328P signature) |
| ENTER_PROGMODE | `0x50 0x20` | `0x14 0x10` |
| LOAD_ADDRESS | `0x55 <lo> <hi> 0x20` | `0x14 0x10` |
| PROG_PAGE | `0x64 <len_h> <len_l> 0x46 <data> 0x20` | `0x14 0x10` |
| LEAVE_PROGMODE | `0x51 0x20` | `0x14 0x10` |

The STK500 handler lives in the Rust backend (direct serial port access). It writes received flash data to the worker via Tauri Channel + postMessage.

---

## 2. AVR ATmega328P Emulation

### Decision: Use/fork avr8js (TypeScript interpreter)

**Rationale**: avr8js is the most mature TypeScript AVR simulator, MIT-licensed, production-proven via Wokwi. Pure TypeScript with no DOM dependencies — runs natively in a Web Worker. No WASM build step needed.

**Alternatives considered**:
- `simavr` (C) compiled to WASM: GPL license concerns, complex build toolchain, function pointer issues with Emscripten
- Custom interpreter from scratch: months of work, avr8js already covers 90%+ of ATmega328P instructions
- JIT compilation to JS: much more complex, harder to debug, breaks step-through debugging

### Execution strategy: Interpretation with batched ticks

- Worker runs N instructions per batch (e.g., 100K per 16ms frame)
- Each instruction decoded from flash `Uint16Array` and dispatched to handler
- Virtual cycle counter drives timer peripherals (not wall-clock time)
- **Functional equivalence** only — not cycle-accurate real-time
- Performance estimate: ~6.25 MIPS achievable (2.5x slower than real 16MHz), sufficient for most Arduino sketches

### Peripheral implementation priority

| Phase | Peripheral | Arduino API | Justification |
|-------|-----------|-------------|---------------|
| P0 | GPIO (ports B, C, D) | `digitalRead`, `digitalWrite`, `pinMode` | Every sketch |
| P0 | Timer0 | `millis`, `micros`, `delay` | Arduino core depends on it |
| P0 | UART (USART0) | `Serial.begin`, `Serial.print` | Primary I/O |
| P0 | Interrupt controller | ISRs, `attachInterrupt` | Timer ISRs required |
| P1 | Timer1 | `Servo` library, `analogWrite` pins 9,10 | Common libraries |
| P1 | Timer2 | `tone()`, `analogWrite` pins 3,11 | Common use |
| P1 | External interrupts (INT0/1, PCINT) | `attachInterrupt` | Sensor/button input |
| P2 | ADC | `analogRead` | Sensor sketches |
| P2 | PWM (via timers) | `analogWrite` | LED dimming, motors |
| P3 | TWI/I2C | `Wire` library | Sensor communication |
| P3 | SPI | `SPI` library | Displays, SD cards |

### Sketch loading: Direct Intel HEX parsing

- Parse Intel HEX file (`.hex`) directly into simulated flash `Uint16Array`
- Skip bootloader simulation — load directly at flash address 0x0000
- ~50 lines of code for the HEX parser
- STK500 protocol handled in Rust backend; only flash data sent to worker

### Debugging support

- **Source maps**: Pre-build PC→source-line mapping from DWARF debug info at compile time using `avr-objdump --dwarf=decodedline`
- **Breakpoints**: `Set<number>` of PC addresses checked after each instruction (`Set.has()` is O(1), negligible overhead)
- **State inspection**: All state in typed arrays — registers, SRAM, SREG, SP, PC directly accessible for debugger display

---

## 3. Breadboard Canvas Rendering

### Decision: Canvas 2D via Konva.js (with react-konva)

**Rationale**: Konva.js provides scene graph, built-in drag-and-drop, event delegation, and layered rendering. Performance sufficient for 50-100 components + wires. TypeScript-native.

**Alternatives considered**:
- Raw Canvas 2D: must implement hit testing, DnD, scene graph from scratch
- SVG: DOM overhead past ~1000 elements, no layered rendering
- WebGL (PixiJS): overkill for 50-100 components, no built-in interaction model
- Fabric.js: heavier, more opinionated, better for image editing

### Architecture: Three Konva Layers

1. **Background layer** (rendered once): Breadboard graphic with 830 holes, labels, power rails
2. **Component layer** (redrawn on change): Placed components, wires, pin highlights
3. **Interaction layer** (redrawn every frame during interaction): Drag preview, rubber-band wire, selection rectangle

### Breadboard grid model

- Standard 830-point layout: rows a-e and f-j (terminal strip), power rails top/bottom
- Grid-first coordinate system with `gridToPixel()` transform
- Internal connections modeled as nets: each row of 5 holes = one net
- Snap-to-grid via `Math.round(pixel / gridSize)`

### Component rendering

- SVG path data stored in plugin assets, rendered via Canvas `Path2D` API
- Pin positions defined as grid-unit offsets from component origin
- Rotation: 0°, 90°, 180°, 270° via canvas transform

### Wire drawing

- Manhattan routing (right-angle segments only) — matches physical breadboard wire layout
- L-shaped routes: horizontal-first or vertical-first based on drag direction
- Rubber-band preview during creation with snap to grid holes
- Visual offset for overlapping wires

### Interaction

- Custom pointer event handling (NOT HTML5 Drag and Drop API)
- Pointer Events API unifies mouse and touch
- Snap-to-grid during drag with ghost preview at 70% opacity
- Rubber-band selection for multi-select

---

## 4. Plugin System Architecture

### Decision: ESM plugins with JSON Schema manifest + PluginContainer error isolation

**Rationale**: Follows patterns from VS Code, Grafana, and Figma. Dynamic `import()` for runtime loading. Typed `ComponentPlugin` interface for behavioral contract.

**Alternatives considered**:
- Iframe sandbox (Figma-style): too restrictive for full system access
- Separate process (VS Code-style): Tauri doesn't have a natural extension host process
- WASM plugins: too complex for component authors, overkill for pin I/O behavior

### Manifest format (`component.json`)

```json
{
  "name": "hc-sr04",
  "displayName": "Ultrasonic Distance Sensor HC-SR04",
  "version": "1.2.0",
  "description": "Simulates HC-SR04",
  "author": "community-dev",
  "license": "MIT",
  "engines": {
    "simulator": "^1.0.0",
    "pluginApi": "^1.0.0"
  },
  "hardware": {
    "pins": [
      { "id": "vcc", "type": "power", "voltage": 5 },
      { "id": "gnd", "type": "ground" },
      { "id": "trig", "type": "digital-input", "label": "Trigger" },
      { "id": "echo", "type": "digital-output", "label": "Echo" }
    ],
    "power": { "minVoltage": 5, "maxVoltage": 5, "typicalCurrent": "15mA" },
    "protocols": ["gpio"]
  },
  "assets": {
    "icon": "assets/icon.svg",
    "schematic": "assets/schematic.svg"
  },
  "main": "dist/index.js",
  "permissions": ["gpio:read", "gpio:write"],
  "category": "sensor",
  "tags": ["distance", "ultrasonic"],
  "checksum": "sha256:abc123..."
}
```

### Plugin loading

- ESM only. Dynamic `import()` with `@vite-ignore` from `file://` URLs
- Self-contained bundles (no external dependencies except plugin SDK)
- Import map for shared plugin SDK provided by host app
- Validated against JSON Schema (via `ajv`) at load time
- Semver range checking for `engines.simulator` and `engines.pluginApi`

### Plugin interface

```typescript
interface ComponentPlugin {
  readonly id: string;
  init(context: PluginContext): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
  onPinChange(pin: string, value: PinValue): void;
  onSerialData?(data: Uint8Array): void;
  render?(): PluginUIResult;
}
```

### Error isolation

- `PluginContainer` wrapper class with try/catch on every lifecycle and pin change call
- Plugin states: `loading` → `initialized` → `running` → `stopped` → `destroyed` (+ `error` from any state)
- Crashing/looping plugin enters `error` state, other components and main loop continue

### Installation

- `.zip` archives extracted to `{appDataDir}/plugins/{name}-{version}/`
- Schema validation + checksum verification before extraction
- Hot-load after install (no restart)
- Update: stop → replace directory → restart plugin

### Security

- Plugins have full system access (per user decision)
- Permission declarations in manifest for transparency and audit
- CSP on WebView to restrict script/style sources
- Audit logging of all plugin operations
- No `eval()` or `new Function()` — only `import()` from file URLs

---

## 5. Web Worker Communication (Tauri v2)

### Decision: SharedArrayBuffer double-buffer for hot path + postMessage for control

**Rationale**: SharedArrayBuffer enables zero-copy, zero-latency state reads from the UI thread. Double-buffering prevents torn reads. postMessage handles control commands and serial data.

**Alternatives considered**:
- postMessage only for everything: ~0.3ms latency per message, risk of frame drops under GC pressure
- Transferable objects only: ownership transfer complicates buffer lifecycle
- BroadcastChannel: adds overhead vs direct postMessage, same structured clone cost

### Architecture

```
Rust Backend ←→ Tauri Channel ←→ Main Thread ←→ Web Worker
                                      ↕ SharedArrayBuffer (double-buffer)
```

### Data paths

| Path | Mechanism | Latency | Use case |
|------|-----------|---------|----------|
| Worker → UI (state) | SharedArrayBuffer double-buffer | ~0ms | Pin states, registers at 60fps |
| Rust → Main → Worker (serial) | Tauri Channel + postMessage Transferable | ~1-2ms | Sketch upload bytes, serial data |
| UI → Worker (control) | postMessage | ~0.3ms | Start/stop/pause/step/breakpoint |
| Worker → UI (notifications) | postMessage | ~0.3ms | Breakpoint hit, error, serial output |

### SharedArrayBuffer layout (double-buffer)

```
[4 bytes: frameId (Int32, atomic)]
[4 bytes: bufferIndex (Int32, atomic, 0 or 1)]
--- Buffer A (front/back) ---
[32 bytes: registers R0-R31]
[2 bytes: SREG]
[2 bytes: SP]
[4 bytes: PC]
[1 byte: simState (0=stopped, 1=running, 2=paused, 3=stepping)]
[~30 bytes: digital pin states (20 pins × 1.5 bytes)]
[~40 bytes: analog pin values (6 pins × 2 bytes + extras)]
--- Buffer B (identical layout) ---
[... same as Buffer A ...]
```

Total per buffer: ~120 bytes. Double-buffer: ~250 bytes total. Trivially fits in a single cache line.

### Key constraints

- SharedArrayBuffer requires COOP/COEP headers configured in Tauri's CSP
- Workers CANNOT call Tauri commands directly (no `window.__TAURI__`)
- All Rust→Worker data must route through main thread
- Worker must yield periodically (every N instructions) to process control messages
- `Atomics.wait()` cannot be used on the main thread

### Debugging across threads

- Breakpoints: `Set<number>` in worker, checked after each instruction (O(1), negligible overhead)
- Pause: worker sets shared `simState` to PAUSED, posts notification to main thread
- State inspection: main thread reads SharedArrayBuffer directly (no stop needed)
- Resume: main thread sends postMessage, worker clears paused flag
- Step: worker executes one instruction (or to next source-line PC), re-enters paused state
