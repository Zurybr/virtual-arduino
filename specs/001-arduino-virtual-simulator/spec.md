# Feature Specification: Arduino Virtual Bus Simulator

**Feature Branch**: `001-arduino-virtual-simulator`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Un simulador de Arduino en Tauri + TypeScript que se conecta con el IDE de Arduino como si fuera un elemento físico. Si cierro la app se desconecta. Simula un bus de Arduino donde puedo conectar cosas como LEDs, servomotores, etc. Todos los componentes físicos imaginables, pero poder instalarle más. Incluso poder hacer placas con microchips o chips hechos aparte y después conectarlos a ese Arduino. Que sea modular."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Blink an LED (Priority: P1)

A user opens the Arduino IDE, writes a simple blink sketch, and uploads it.
The simulator appears as a board in the IDE's port list. After upload, an LED
component connected to pin 13 on the virtual breadboard blinks on and off.
When the user closes the simulator app, the board disappears from the IDE's
port list, exactly as if a USB cable were unplugged.

**Why this priority**: This is the "Hello World" of Arduino. If the simulator
cannot do this, nothing else matters. It validates the entire pipeline:
virtual serial port, sketch upload, instruction execution, pin state
propagation, and component rendering.

**Independent Test**: Upload any sketch from the Arduino IDE and observe
pin state changes on a connected LED. Delivers the core value of a
working virtual Arduino.

**Acceptance Scenarios**:

1. **Given** the simulator is running with an LED on pin 13, **When** the user uploads a blink sketch from the Arduino IDE, **Then** the LED toggles between on and off at the sketch's specified interval
2. **Given** the simulator is running and visible in the IDE, **When** the user closes the simulator application, **Then** the virtual port disappears from the IDE's board/port list within 2 seconds
3. **Given** the simulator was closed, **When** the user reopens the simulator, **Then** the virtual port reappears in the IDE and a new sketch can be uploaded without restarting the IDE
4. **Given** a blink sketch is running, **When** the user opens the Serial Monitor in the IDE, **Then** any Serial.print() output from the sketch appears in the Serial Monitor

---

### User Story 2 - Wire Multiple Components (Priority: P2)

A user drags an LED, a pushbutton, and a resistor onto the virtual
breadboard. They wire the pushbutton to pin 2 (with pull-down resistor) and
the LED to pin 9 (PWM). They upload a sketch that fades the LED when the
button is pressed. The simulation accurately reflects the wiring: pin 2 reads
LOW when the button is not pressed, HIGH when pressed, and pin 9 outputs a
PWM signal that visibly changes the LED brightness.

**Why this priority**: This validates multi-component wiring, GPIO input,
PWM output, and the breadboard/visual interface — the second most essential
capability after basic upload.

**Independent Test**: Connect two or more components with wires on the
breadboard, upload a sketch that reads input from one and controls another,
and observe correct signal propagation.

**Acceptance Scenarios**:

1. **Given** a pushbutton is wired to pin 2 and an LED to pin 9, **When** the user uploads a fade-on-press sketch, **Then** pressing the virtual button causes the LED to smoothly fade in
2. **Given** multiple components are placed on the breadboard, **When** the user draws wires between component pins, **Then** the connections are visually displayed and persist until removed
3. **Given** a component is connected to a PWM-capable pin, **When** the sketch writes analog values (0-255), **Then** the component responds proportionally (e.g., LED brightness, motor speed)

---

### User Story 3 - Install a New Component Plugin (Priority: P3)

A user wants to use an ultrasonic distance sensor (HC-SR04) that is not
included with the default simulator. They download a plugin package, install
it through the simulator's plugin manager, and the HC-SR04 appears in the
component palette. They drag it onto the breadboard, wire it, upload a sketch,
and receive distance readings via the simulated component.

**Why this priority**: The plugin system is what makes the simulator
extensible and sustainable long-term. Without it, the simulator is limited
to built-in components only.

**Independent Test**: Install a component that was not originally available,
place it on the breadboard, wire it, and verify it responds to sketch I/O
correctly.

**Acceptance Scenarios**:

1. **Given** the user has a plugin package file, **When** they install it through the plugin manager, **Then** the new component appears in the component palette immediately
2. **Given** a plugin component is installed, **When** the user places it on the breadboard and wires it, **Then** it behaves according to its specification (pin reads/writes respond as expected by the sketch)
3. **Given** the user no longer needs a plugin, **When** they uninstall it, **Then** the component is removed from the palette and any instances on the breadboard are flagged as missing

---

### User Story 4 - Build and Connect a Custom Sub-Board (Priority: P4)

A user creates a custom sub-board containing an ATtiny85 microcontroller, a
shift register, and some LEDs. They wire the sub-board's external pins and
save it as a reusable module. They then place this sub-board module onto the
main Arduino's breadboard and connect it via I2C. The main Arduino sketch
communicates with the sub-board, which executes its own firmware and controls
its local LEDs independently.

**Why this priority**: This is the advanced modularity feature — the ability
to compose circuits from smaller circuits. It differentiates the simulator
from simple single-board tools but is not needed for the core MVP.

**Independent Test**: Create a custom board with at least one chip, save it
as a module, place it on the main breadboard, connect via a bus protocol,
and verify bidirectional communication.

**Acceptance Scenarios**:

1. **Given** the user has placed chips and components on a sub-board canvas, **When** they save it as a module, **Then** it appears in the reusable modules library
2. **Given** a saved sub-board module, **When** the user places it on the main breadboard and connects its external pins via I2C/SPI/UART, **Then** the main Arduino sketch can send and receive data from the sub-board
3. **Given** a sub-board with its own microcontroller, **When** the simulation runs, **Then** the sub-board executes its firmware independently and concurrently with the main Arduino, and the sub-board's firmware can be uploaded via its own virtual serial port from the Arduino IDE

---

### Edge Cases

- When a sketch exceeds the simulated microcontroller's memory, the simulator MUST halt execution and display an error (FR-014). The simulation behaves as a real board (sketch fails) plus a warning overlay explaining the limit.
- When a component draws more current than the virtual power supply provides, the simulation MUST reflect the realistic voltage drop/brownout behavior AND display a warning indicator on the affected component and power rail.
- When two output pins are shorted together (both OUTPUT, writing different values), the simulation MUST emulate the real electrical conflict (undefined/erratic readings) AND display a visual short-circuit warning on the affected pins.
- When a plugin component crashes or enters an infinite loop, the simulator MUST isolate the fault to that component (other components and the sketch continue running) AND display an error notification identifying the failing plugin.
- When components are connected across incompatible bus protocols (e.g., I2C device to SPI bus), the simulation MUST behave as real hardware (no communication occurs, reads return noise/floating values) AND display a protocol mismatch warning.
- When a new sketch is uploaded while a previous sketch is running, the simulator MUST stop the current sketch, reset all pin states to defaults, and start the new sketch — mirroring real board behavior — AND notify the user that the previous sketch was replaced.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The simulator MUST present itself to the Arduino IDE as a virtual serial port that appears when the app launches and disappears when the app closes. Each simulated microcontroller (main board and sub-boards) MUST expose its own independent virtual serial port.
- **FR-002**: Users MUST be able to upload compiled sketches from the Arduino IDE to the simulator as they would to a physical board
- **FR-003**: The simulator MUST execute uploaded sketches and propagate pin state changes to connected virtual components in real time (within one animation frame)
- **FR-004**: Users MUST be able to place components (LEDs, resistors, pushbuttons, servos, etc.) on a free-form CAD-style workspace via drag-and-drop. The workspace uses an infinite dot grid background (similar to Figma/SolidWorks/AutoCAD) with pan and zoom. Components are rendered as realistic visual representations (Fritzing/Tinkercad style) with visible pin connection points. The Arduino Uno board itself is a component placed on the workspace.
- **FR-005**: Users MUST be able to draw wires between component pins and Arduino board pins to establish electrical connections. Wires are rendered as bezier curves between connection points
- **FR-006**: The simulator MUST support digital I/O (HIGH/LOW), analog read (0-1023), and PWM output (0-255) pin modes
- **FR-007**: Serial communication (UART) between the simulated sketch and the Arduino IDE Serial Monitor MUST work bidirectionally
- **FR-008**: Users MUST be able to install additional component plugins at runtime without rebuilding the application
- **FR-009**: Each plugin MUST declare its pin requirements, power draw, communication protocol, and visual representation in a standardized manifest. Plugins have full system access without sandboxing restrictions.
- **FR-010**: Users MUST be able to create custom sub-boards composed of multiple components and chips, and save them as reusable modules
- **FR-011**: Sub-board modules MUST be connectable to the main Arduino board via supported bus protocols (GPIO, I2C, SPI, UART)
- **FR-012**: The simulator MUST simulate the ATmega328P (Arduino Uno) as the initial supported microcontroller
- **FR-013**: The simulator MUST provide a visual representation of all pin states (HIGH/LOW, analog values, PWM duty cycle) for debugging
- **FR-014**: The simulator MUST halt execution and notify the user if a sketch exceeds the simulated microcontroller's memory limits
- **FR-015**: Users MUST be able to save and load complete circuit configurations (board + components + wiring)
- **FR-016**: The simulator MUST provide full debugging controls: Run, Stop, Pause, Resume, Reset, Step-through (execute one instruction at a time), and Breakpoints (pause execution at user-defined source lines)
- **FR-017**: When paused at a breakpoint or during step-through, the simulator MUST display the current values of all pin states, variable values, and the instruction pointer position
- **FR-018**: The simulator MUST emulate real hardware behavior for edge cases (short circuits, overcurrent, protocol mismatch) faithfully while simultaneously displaying non-intrusive warning indicators to the user
- **FR-019**: Plugin component failures MUST be isolated — a crashing or looping plugin MUST NOT affect the main simulation loop or other components, and the user MUST be notified which plugin failed
- **FR-020**: Uploading a new sketch while one is running MUST stop the current sketch, reset all pin states, and start the new sketch, with a notification that the previous sketch was replaced

### Key Entities

- **Board**: The virtual Arduino board with a microcontroller, digital/analog pins, power rails, and communication buses. Has a specific chip model (e.g., ATmega328P) that defines memory, speed, and pin capabilities.
- **Component**: A virtual electronic part (LED, resistor, servo, sensor, display) that connects to pins and reacts to electrical signals. Defined by its plugin manifest and simulated behavior.
- **Pin**: An electrical connection point on a board or component. Has a mode (INPUT, OUTPUT, PWM, etc.), a current value (digital, analog, or PWM), and belongs to a specific bus.
- **Wire**: An electrical connection between two pins. Propagates voltage/current signals between the source and destination pin.
- **Bus**: A communication channel (GPIO, I2C, SPI, UART, PWM) that governs how signals propagate between connected pins.
- **Plugin**: An installable package that adds one or more Components to the simulator. Contains a manifest, behavioral logic, and visual assets.
- **Sub-Board**: A reusable circuit module composed of components and optionally a secondary microcontroller, with exposed external pins for connection to other boards.
- **Circuit**: A saved configuration of a board, placed components, wires, and optionally sub-boards.
- **Simulation State**: The current execution state of the simulator: Stopped, Running, Paused, or Stepping. Includes the instruction pointer, active breakpoints, and a snapshot of all pin/variable values at the current tick.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can upload a blink sketch from the Arduino IDE and see the LED toggle within 5 seconds of clicking upload
- **SC-002**: Pin state changes propagate to connected components within 16 milliseconds (one animation frame at 60fps)
- **SC-003**: The virtual serial port appears in the Arduino IDE within 3 seconds of launching the simulator and disappears within 2 seconds of closing it
- **SC-004**: A new user can go from opening the simulator to blinking an LED (including downloading the simulator, placing an LED, and uploading a sketch) in under 10 minutes
- **SC-005**: Plugin installation completes in under 10 seconds and the new component is immediately available in the palette
- **SC-006**: The simulator supports at least 15 distinct component types at launch (LED, resistor, pushbutton, potentiometer, servo, DC motor, buzzer, RGB LED, photoresistor, temperature sensor, LCD display, shift register, transistor, diode, capacitor)
- **SC-007**: Users can save and reload a complete circuit configuration with all components, wiring, and sub-boards intact

## Clarifications

### Session 2026-06-09

- Q: ¿Qué controles de simulación debe tener el usuario? → A: Depuración completa: Ejecutar, Detener, Pausar, Reanudar, Reiniciar, Paso a paso y Breakpoints
- Q: ¿Cómo manejar casos límite (cortocircuitos, exceso de corriente, etc.)? → A: Emular hardware real fielmente Y mostrar advertencias/protecciones visuales simultáneamente (comportamiento dual)
- Q: ¿Qué nivel de acceso al sistema deben tener los plugins? → A: Acceso completo al sistema sin restricciones
- Q: ¿Cómo se sube firmware a microcontroladores de sub-placas? → A: Puertos serie virtuales separados por cada microcontrolador
- Q: ¿Múltiples placas Arduino o una sola? → A: Una sola placa principal + sub-placas (no múltiples placas independientes)
- Q: ¿Estilo de interfaz? → A: Estilo Fritzing/Tinkercad — workspace libre tipo CAD con fondo de puntitos (dot grid), drag & drop libre, componentes con representación visual realista tipo Fritzing, Arduino Uno como componente más en el canvas con pines visibles, cables tipo bezier curves

## Assumptions

- Target users are familiar with the Arduino IDE and basic electronics concepts
- The simulator runs on Windows, macOS, and Linux desktop platforms
- Users have the Arduino IDE already installed on their machine
- Initial release supports only the Arduino Uno (ATmega328P); other boards are future scope
- The simulator supports exactly one main Arduino board at a time. Multiple independent Arduino boards running simultaneously are out of scope. Multi-microcontroller scenarios are handled exclusively through sub-board modules connected to the single main board.
- The simulation does not need to be cycle-accurate to the real ATmega328P; functional equivalence is sufficient (same observable behavior as a real board for standard sketches)
- Plugin packages are distributed as files or via a future marketplace; a curated built-in library ships with the app
- Sub-boards with secondary microcontrollers execute their own independent firmware uploaded separately from the main board
- The virtual workspace uses an infinite dot grid canvas with free-form component placement (similar to Fritzing/Tinkercad), not a rigid breadboard grid. The Arduino Uno board is rendered as a component on the workspace with visible pin connection points. Components are positioned freely and snap to a configurable grid for alignment.
- I2C and SPI support are included in initial scope given their ubiquity in Arduino projects, but secondary to GPIO/PWM/UART in priority
