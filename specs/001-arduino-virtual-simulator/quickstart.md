# Quickstart Validation Guide: Arduino Virtual Bus Simulator

**Date**: 2026-06-09
**Purpose**: End-to-end validation scenarios to prove the feature works.

## Prerequisites

- Arduino IDE 2.x installed (https://www.arduino.cc/en/software)
- Rust toolchain installed (`rustup`)
- Node.js 20+ and npm installed
- Platform-specific serial driver access (admin on Windows for com0com)

## Setup

```bash
# Clone and install dependencies
git clone <repo-url> arduino-simulator && cd arduino-simulator
npm install

# Build and run in development mode
npm run tauri dev
```

The app window opens and a virtual serial port appears in the system within 3 seconds.

## Validation Scenarios

### VS-1: Virtual Port Lifecycle

Validates FR-001, SC-003.

1. Launch the simulator app
2. Open Arduino IDE → Tools → Port
3. **Verify**: A new serial port appears in the port list within 3 seconds
4. Close the simulator app
5. **Verify**: The port disappears from the Arduino IDE port list within 2 seconds
6. Relaunch the simulator
7. **Verify**: The port reappears without restarting the Arduino IDE

**Expected**: Port appears/disappears as described. No Arduino IDE restart needed.

### VS-2: Upload and Blink an LED

Validates FR-002, FR-003, FR-004, FR-006, SC-001, SC-004.

1. In the simulator, drag an LED from the component palette onto the breadboard
2. Drag a wire from the LED's anode to Arduino pin D13
3. Drag a wire from the LED's cathode to GND
4. In Arduino IDE, select the virtual port (Tools → Port)
5. Select board: Arduino Uno (Tools → Board)
6. Write a blink sketch:

```cpp
void setup() {
  pinMode(13, OUTPUT);
}
void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}
```

7. Click Upload
8. **Verify**: Upload completes within 5 seconds
9. **Verify**: The LED on the breadboard toggles on/off at ~1 second intervals
10. **Verify**: Pin 13 state indicator shows HIGH/LOW alternation in the debugger panel

**Expected**: LED blinks at the sketch's specified rate. Pin state visible in debugger.

### VS-3: Serial Monitor Communication

Validates FR-007.

1. Place an LED on pin 13 as in VS-2
2. Upload this sketch:

```cpp
void setup() {
  Serial.begin(9600);
  pinMode(13, OUTPUT);
}
void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED ON");
  delay(500);
  digitalWrite(13, LOW);
  Serial.println("LED OFF");
  delay(500);
}
```

3. Open Serial Monitor in Arduino IDE (Tools → Serial Monitor)
4. Set baud rate to 9600
5. **Verify**: "LED ON" and "LED OFF" messages appear alternating in Serial Monitor
6. Type "hello" in Serial Monitor send field and press Send
7. **Verify**: The bytes are received by the simulated sketch (if the sketch echoes input)

**Expected**: Bidirectional serial communication works through the virtual port.

### VS-4: Multi-Component Wiring with PWM

Validates FR-005, FR-006 (PWM), US2.

1. Place a pushbutton, resistor (10kΩ), and LED on the breadboard
2. Wire pushbutton → pin D2 (with pull-down resistor to GND)
3. Wire LED → pin D9 (PWM-capable)
4. Upload this sketch:

```cpp
void setup() {
  pinMode(2, INPUT);
  pinMode(9, OUTPUT);
}
void loop() {
  if (digitalRead(2) == HIGH) {
    for (int i = 0; i <= 255; i++) {
      analogWrite(9, i);
      delay(5);
    }
  } else {
    analogWrite(9, 0);
  }
}
```

5. Click the virtual pushbutton on the breadboard
6. **Verify**: LED smoothly fades from off to full brightness
7. Release the pushbutton
8. **Verify**: LED turns off immediately

**Expected**: PWM output controls LED brightness. Digital input reads button state correctly.

### VS-5: Debugging Controls

Validates FR-016, FR-017.

1. Upload any non-trivial sketch (e.g., the blink sketch from VS-2)
2. While running, click the **Pause** button in the toolbar
3. **Verify**: Simulation pauses. Pin states freeze at their current values.
4. **Verify**: Debugger panel shows current register values, PC, SREG flags
5. Click **Step** (instruction step)
6. **Verify**: One instruction executes. PC advances by the instruction size. Pin states may change.
7. Set a breakpoint on a source line (e.g., the `digitalWrite(13, HIGH)` line)
8. Click **Resume**
9. **Verify**: Simulation runs until the breakpoint is hit, then pauses
10. **Verify**: The current source line is highlighted in the debugger
11. Click **Reset**
12. **Verify**: Simulation stops, all pins reset to default, sketch ready to run again

**Expected**: All debug controls work. State inspection is accurate at each step.

### VS-6: Plugin Install and Use

Validates FR-008, FR-009, FR-019, SC-005, US3.

1. Open the Plugin Manager in the simulator
2. Click "Install Plugin" and select a plugin .zip file (e.g., HC-SR04 ultrasonic sensor)
3. **Verify**: Plugin installs in under 10 seconds
4. **Verify**: HC-SR04 appears in the component palette immediately
5. Drag HC-SR04 onto the breadboard
6. Wire it (VCC → 5V, GND → GND, Trig → D7, Echo → D8)
7. Upload a distance-reading sketch
8. **Verify**: The simulated sensor returns distance values as expected
9. Open Plugin Manager, uninstall the HC-SR04 plugin
10. **Verify**: Component is removed from palette; existing instances marked as missing

**Expected**: Plugin lifecycle works end-to-end without app restart.

### VS-7: Circuit Save and Load

Validates FR-015, SC-007.

1. Create a circuit with at least 3 components and multiple wires (as in VS-4)
2. Run the simulation briefly to verify it works
3. Save the circuit (File → Save, choose a filename)
4. Stop the simulation and clear the breadboard
5. Load the saved circuit (File → Open)
6. **Verify**: All components, wires, and positions are restored exactly
7. Start the simulation
8. **Verify**: The circuit behaves identically to before saving

**Expected**: Save/load preserves the complete circuit state including component positions and wiring.

### VS-8: Edge Case — Sketch Upload While Running

Validates FR-020.

1. Upload and run the blink sketch
2. While it is running, upload a different sketch (e.g., one that blinks twice as fast)
3. **Verify**: A notification appears: "Previous sketch replaced"
4. **Verify**: The new sketch starts running immediately (faster blink rate)
5. **Verify**: All pin states were reset to defaults before the new sketch started

**Expected**: New upload replaces running sketch cleanly with user notification.

## Validation Commands

```bash
# Run all TypeScript tests
npm run test

# Run Rust backend tests
cd src-tauri && cargo test

# Run linting
npm run lint
cd src-tauri && cargo clippy

# Type check
npm run typecheck
```

All tests MUST pass before declaring the feature complete.
