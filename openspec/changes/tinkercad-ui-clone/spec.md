# Spec: Tinkercad UI Clone — Slice 1

## CAP-001: Tinkercad Layout

### Purpose

Replaces the current IDE-like layout (inline palette + bottom-paned editor/serial) with a Tinkercad-style layout: top bar with circuit name and sim controls, collapsible left palette, center canvas workspace, right tabbed panel (Code Editor / Serial Monitor).

### Requirements

#### REQ-001-01: Top Bar

The system MUST render a top bar spanning the full window width containing:
- An editable text field showing the current circuit name (default: "Untitled Circuit")
- Simulation controls (Run, Stop, Pause, Resume, Step, Reset) grouped on the right side
- An Export button (placeholder, non-functional in this slice)

#### REQ-001-02: Left Sidebar — Palette

The system MUST render a collapsible left sidebar (default width 220px) containing the component palette. The sidebar MUST be resizable between 160px and 360px. A toggle button MUST allow collapsing the sidebar to a 40px icon-only strip.

#### REQ-001-03: Center Canvas Workspace

The system MUST render the Konva Stage canvas in the center area, filling all remaining horizontal space. The canvas MUST maintain the existing Workspace component props (components, wires, callbacks) without breaking current drag-drop and interaction behavior.

#### REQ-001-04: Right Panel — Tabbed

The system MUST render a right panel (default width 320px, resizable 240px–500px) with two tabs:
- "Code Editor" — contains the CodeEditor component
- "Serial Monitor" — contains the SerialMonitor component
The active tab MUST be switchable via tab headers. The previously separate PinInspector is replaced by the component property editor (CAP-002) which appears when a component is selected.

#### REQ-001-05: Bottom Panel Removal

The system MUST remove the bottom panel from the current layout. Code Editor and Serial Monitor content moves entirely to the right panel tabs.

#### REQ-001-06: Responsive Desktop Sizing

The layout MUST fill the full Tauri window (100vw x 100vh). All panels MUST resize correctly when the window is resized. The canvas area MUST NOT overflow or produce scrollbars.

### Scenarios

#### Scenario: Initial layout renders correctly

- GIVEN the application starts with default state
- WHEN the App component mounts
- THEN the top bar renders with "Untitled Circuit" text, sim controls, and an Export button
- AND the left sidebar shows the component palette at 220px width
- AND the center canvas fills remaining space with existing Workspace behavior
- AND the right panel shows two tabs (Code Editor, Serial Monitor) at 320px width

#### Scenario: Circuit name is editable

- GIVEN the top bar shows "Untitled Circuit"
- WHEN the user clicks the circuit name field and types "LED Blink"
- THEN the displayed name updates to "LED Blink" in real-time

#### Scenario: Sidebar collapse and expand

- GIVEN the left sidebar is expanded at 220px
- WHEN the user clicks the collapse toggle button
- THEN the sidebar shrinks to a 40px icon-only strip
- AND the canvas area expands to fill the freed space
- WHEN the user clicks the toggle again
- THEN the sidebar expands back to 220px

#### Scenario: Right panel tab switching

- GIVEN the right panel shows "Code Editor" tab as active
- WHEN the user clicks the "Serial Monitor" tab header
- THEN the Serial Monitor content is displayed
- AND the Code Editor content is hidden

#### Scenario: Window resize

- GIVEN the application is running in a Tauri window at 1280x800
- WHEN the user resizes the window to 960x600
- THEN all panels adjust proportionally
- AND no scrollbars appear on any panel
- AND the canvas stage re-renders to the new center dimensions

#### Scenario: Existing drag-drop preserved

- GIVEN the new layout is rendered
- WHEN the user drags a component from the palette and drops it on the canvas
- THEN the component is placed at the drop position exactly as before the layout refactor

---

## CAP-002: Component Property Editor

### Purpose

Provides a schema-driven property panel for editing component values. Appears in the right panel when a component is selected. Each component type defines its editable properties via a schema that maps to UI field types (dropdown, color picker, slider, text input).

### Requirements

#### REQ-002-01: Schema-Driven Property Definitions

The system MUST define a `PropertySchema` per component type. Each schema entry specifies: property key, display label, field type (dropdown, color, slider, text), default value, and validation rules. The system MUST support schemas for: resistor, capacitor, led, potentiometer, buzzer, rgb-led, servo, dc-motor, photoresistor, temperature-sensor, lcd-display, power-supply.

#### REQ-002-02: Property Panel Display

The system MUST display the property editor in the right panel when a component is selected. When no component is selected, the panel MUST show a "Select a component to edit properties" placeholder. The panel header MUST show the component type label (e.g., "Resistor", "LED").

#### REQ-002-03: Resistor Properties

The system MUST provide a dropdown with E12 series values: 1Ω, 10Ω, 100Ω, 220Ω, 330Ω, 470Ω, 1kΩ, 2.2kΩ, 4.7kΩ, 10kΩ, 47kΩ, 100kΩ, 1MΩ. The system MUST also provide a custom value input that accepts numeric values with unit suffix (Ω, kΩ, MΩ). Invalid inputs MUST display an inline validation error.

#### REQ-002-04: Capacitor Properties

The system MUST provide a dropdown with standard values: 1pF, 10pF, 100pF, 1nF, 10nF, 100nF, 1μF, 10μF, 100μF, 1000μF. A custom input MUST accept values with unit suffix (pF, nF, μF, mF). Invalid inputs MUST display inline validation error.

#### REQ-002-05: LED Properties

The system MUST provide a color selector for LEDs with predefined colors: red (#ff0000), green (#00ff00), blue (#0000ff), yellow (#ffff00), white (#ffffff), orange (#ff8800). Selecting a color MUST update the component's visual rendering on canvas.

#### REQ-002-06: Potentiometer Properties

The system MUST provide: (a) a max resistance value input, (b) a current position slider from 0% to 100%. The slider MUST update the component state in real-time as it is dragged.

#### REQ-002-07: Buzzer Properties

The system MUST provide: (a) a frequency input (Hz, numeric), (b) a tone type selector (active or passive).

#### REQ-002-08: RGB LED Properties

The system MUST provide individual color selectors for red, green, and blue channels, each with the same predefined palette as LED properties.

#### REQ-002-09: Servo Properties

The system MUST provide min angle and max angle inputs (0–360 range, validated).

#### REQ-002-10: DC Motor Properties

The system MUST display RPM as a read-only field derived from simulation state.

#### REQ-002-11: Photoresistor Properties

The system MUST provide dark resistance and light resistance inputs with unit suffix.

#### REQ-002-12: Temperature Sensor Properties

The system MUST provide a type selector dropdown: TMP36, DHT11.

#### REQ-002-13: LCD Properties

The system MUST provide rows and columns configuration inputs (default 16x2).

#### REQ-002-14: Power Supply Properties

The system MUST provide a voltage selector dropdown: 3.3V, 5V, 9V, 12V, Custom. Custom selection MUST reveal a numeric voltage input.

#### REQ-002-15: Property Change Re-render

When a property value changes, the system MUST immediately update the component's `state` object and re-render the component visual on the Konva canvas.

#### REQ-002-16: Undo/Redo Integration

Property changes MUST be executed through the Command pattern (CAP-003) as `ChangeProperty` commands. Each change MUST be individually undoable and redoable.

### Scenarios

#### Scenario: Selecting a resistor shows E12 dropdown

- GIVEN a resistor component exists on the canvas
- WHEN the user clicks the resistor
- THEN the right panel shows "Resistor" header with a dropdown containing E12 values
- AND a custom value input field is visible below the dropdown

#### Scenario: Changing resistor value updates canvas

- GIVEN a resistor is selected and its property panel shows "1kΩ"
- WHEN the user selects "470Ω" from the dropdown
- THEN the resistor's `state.resistance` updates to 470
- AND the resistor visual on canvas re-renders with the new value label

#### Scenario: Custom resistor value with validation

- GIVEN a resistor is selected and the user types "3.3k" in the custom input
- WHEN the input loses focus or Enter is pressed
- THEN the value is accepted as 3300Ω
- WHEN the user types "abc" in the custom input
- THEN an inline error "Invalid value" is displayed
- AND the previous valid value is preserved

#### Scenario: LED color change

- GIVEN an LED is selected with default color red
- WHEN the user clicks the green color swatch
- THEN the LED's `state.color` changes to "#00ff00"
- AND the LED visual on canvas re-renders in green

#### Scenario: Potentiometer slider

- GIVEN a potentiometer is selected
- WHEN the user drags the position slider from 0% to 75%
- THEN `state.position` updates to 75 continuously during drag
- AND the canvas visual reflects the updated position

#### Scenario: No component selected

- GIVEN no component is selected on the canvas
- WHEN the right panel is visible
- THEN it displays "Select a component to edit properties" placeholder text

#### Scenario: Power supply custom voltage

- GIVEN a power supply is selected
- WHEN the user selects "Custom" from the voltage dropdown
- THEN a numeric input field appears
- WHEN the user enters "7.5" and confirms
- THEN `state.voltage` is set to 7.5

#### Scenario: Undo property change

- GIVEN a resistor value was changed from "1kΩ" to "470Ω"
- WHEN the user presses Ctrl+Z
- THEN the resistor value reverts to "1kΩ"
- AND the canvas visual and property panel both reflect the old value

---

## CAP-003: Undo/Redo System

### Purpose

Implements a Command pattern for all workspace mutations. Provides undo/redo with a maximum stack depth of 50, keyboard shortcuts, and toolbar buttons.

### Requirements

#### REQ-003-01: Command Interface

The system MUST define a `Command` interface with `execute()` and `undo()` methods. Each command MUST capture all data needed to both perform and reverse its operation.

#### REQ-003-02: Supported Commands

The system MUST implement commands for: `AddComponent`, `RemoveComponent`, `MoveComponent`, `RotateComponent`, `AddWire`, `RemoveWire`, `ChangeProperty`.

#### REQ-003-03: Command Manager

The system MUST provide a `CommandManager` with `execute(command)`, `undo()`, and `redo()` methods. The `execute` method MUST push the command onto the undo stack and clear the redo stack.

#### REQ-003-04: Stack Depth Limit

The undo stack MUST hold a maximum of 50 commands. When a 51st command is executed, the oldest entry MUST be discarded (FIFO eviction).

#### REQ-003-05: Keyboard Shortcuts

The system MUST handle: Ctrl+Z for undo, Ctrl+Shift+Z or Ctrl+Y for redo. These shortcuts MUST NOT trigger when focus is in a text input or code editor.

#### REQ-003-06: Toolbar Buttons

The top bar MUST display undo (left arrow icon) and redo (right arrow icon) buttons. Undo button MUST be visually disabled (greyed out, non-interactive) when the undo stack is empty. Redo button MUST be visually disabled when the redo stack is empty.

#### REQ-003-07: AddComponent Undo Cascading

Undoing an `AddComponent` command MUST also remove any wires connected to that component.

#### REQ-003-08: RemoveComponent Undo Restores Wires

Undoing a `RemoveComponent` command MUST restore the component AND its connected wires that were removed with it.

#### REQ-003-09: ChangeProperty Undo

Undoing a `ChangeProperty` command MUST revert the property to its previous value.

#### REQ-003-10: Redo Stack Clear on New Action

When a new command is executed after an undo, the redo stack MUST be cleared. Subsequent redo operations MUST NOT restore the cleared commands.

### Scenarios

#### Scenario: Undo a component addition

- GIVEN the canvas has 3 components and no undo history
- WHEN the user adds a 4th component (an LED)
- AND presses Ctrl+Z
- THEN the LED is removed from the canvas
- AND the component count returns to 3
- AND any wires connected to that LED are also removed

#### Scenario: Redo after undo

- GIVEN the user just undid an AddComponent action
- WHEN the user presses Ctrl+Shift+Z
- THEN the component is re-added to the canvas at its original position
- AND the undo stack has one entry (the re-executed AddComponent)

#### Scenario: Redo clears on new action

- GIVEN the user has undone 2 actions (redo stack has 2 entries)
- WHEN the user performs a new action (move a component)
- THEN the redo stack is cleared to empty
- AND pressing Ctrl+Shift+Z does nothing

#### Scenario: Stack depth limit

- GIVEN the undo stack contains 50 commands
- WHEN the user performs a 51st action
- THEN the oldest command is evicted from the stack
- AND the stack still contains exactly 50 entries
- AND pressing Ctrl+Z 50 times undoes the 50 most recent actions

#### Scenario: Undo property change

- GIVEN a resistor value was changed from "1kΩ" to "470Ω"
- WHEN the user presses Ctrl+Z
- THEN the resistor value reverts to "1kΩ"
- WHEN the user presses Ctrl+Y
- THEN the resistor value changes back to "470Ω"

#### Scenario: Undo remove restores wires

- GIVEN a component has 2 connected wires
- WHEN the user deletes the component (which also removes the 2 wires)
- AND presses Ctrl+Z
- THEN the component is restored at its original position
- AND both wires are restored with their original connections

#### Scenario: Shortcuts disabled in text input

- GIVEN the user is typing in the code editor or a property input field
- WHEN the user presses Ctrl+Z
- THEN the browser/editor native undo handles the event
- AND the CommandManager does NOT process it

#### Scenario: Toolbar button states

- GIVEN no actions have been performed
- WHEN the top bar renders
- THEN the undo button is visually disabled (greyed out)
- AND the redo button is visually disabled
- WHEN the user adds a component
- THEN the undo button becomes active (colored)
- AND the redo button remains disabled

---

## CAP-004: Context Menu

### Purpose

Provides right-click context menus for the canvas, components, wires, and pins. Menus are React portals rendered above the Konva canvas.

### Requirements

#### REQ-004-01: React Portal Rendering

The context menu MUST be rendered as a React portal attached to `document.body`. This ensures it renders above the Konva Stage without z-index conflicts.

#### REQ-004-02: Canvas Empty Space Menu

Right-clicking on empty canvas space MUST show: Paste (enabled only if clipboard has content), Select All, Fit to Screen, Grid Settings.

#### REQ-004-03: Component Menu

Right-clicking on a component MUST show: Rotate 90°, Duplicate, Delete, Properties (opens/focuses property editor), Bring to Front, Send to Back.

#### REQ-004-04: Wire Menu

Right-clicking on a wire MUST show: Delete, Change Color (with submenu showing color picker).

#### REQ-004-05: Pin Menu

Right-clicking on a pin MUST show: Start Wire from Here.

#### REQ-004-06: Cursor Positioning

The context menu MUST appear at the mouse cursor position. If the menu would overflow the viewport, it MUST reposition to remain fully visible within the window bounds.

#### REQ-004-07: Menu Dismissal

The context menu MUST close on: click outside the menu, Escape key press, or selection of a menu item.

#### REQ-004-08: Menu Actions Dispatch

Menu actions MUST execute through the CommandManager (CAP-003). Delete dispatches `RemoveComponent`/`RemoveWire`. Duplicate dispatches `AddComponent`. Rotate dispatches `RotateComponent`.

### Scenarios

#### Scenario: Right-click on component

- GIVEN an LED component is on the canvas
- WHEN the user right-clicks on the LED
- THEN a context menu appears at cursor position with: Rotate 90°, Duplicate, Delete, Properties, Bring to Front, Send to Back

#### Scenario: Rotate 90° from context menu

- GIVEN a component is at rotation 0
- WHEN the user right-clicks and selects "Rotate 90°"
- THEN the component rotation changes to 90°
- AND the action is pushed onto the undo stack

#### Scenario: Duplicate component

- GIVEN a resistor with value "470Ω" is on the canvas
- WHEN the user right-clicks and selects "Duplicate"
- THEN a new resistor appears offset (20px, 20px) from the original
- AND the new resistor has the same property values
- AND the action is undoable

#### Scenario: Right-click on empty canvas

- GIVEN the user right-clicks on empty canvas space
- THEN a menu shows: Paste (disabled if no clipboard), Select All, Fit to Screen, Grid Settings

#### Scenario: Right-click on wire with color submenu

- GIVEN a wire exists on the canvas
- WHEN the user right-clicks on the wire
- THEN a menu shows: Delete, Change Color
- WHEN the user hovers on "Change Color"
- THEN a color picker submenu appears with color options

#### Scenario: Context menu viewport repositioning

- GIVEN the user right-clicks near the bottom-right edge of the window
- WHEN the context menu would overflow the viewport
- THEN the menu repositions upward and/or leftward to stay fully visible

#### Scenario: Escape closes menu

- GIVEN a context menu is open
- WHEN the user presses Escape
- THEN the menu closes without performing any action

#### Scenario: Click outside closes menu

- GIVEN a context menu is open
- WHEN the user clicks on empty canvas space
- THEN the menu closes

---

## CAP-005: Hover Highlights

### Purpose

Provides visual feedback on hover for components, pins, and during wire-drawing mode using Konva effects.

### Requirements

#### REQ-005-01: Component Hover Glow

When the mouse hovers over a component, the system MUST render a blue/cyan outline glow around the component using Konva `shadowBlur` and `stroke` properties. The glow MUST be removed on mouseleave.

#### REQ-005-02: Pin Hover Enlargement and Tooltip

When the mouse hovers over a pin circle, the pin MUST enlarge from `PIN_RADIUS` (5px) to `PIN_HOVER_RADIUS` (8px). A tooltip MUST appear near the pin showing the pin label (e.g., "D7", "A0", "5V", "GND").

#### REQ-005-03: Wire-Drawing Pin Highlighting

During wire-drawing mode, valid target pins (those not connected to the source pin's component) MUST glow green. The source pin MUST glow green. Invalid targets (same component as source, or same pin) MUST glow red.

#### REQ-005-04: Transition Timing

All hover transitions (glow appearance, pin enlargement) MUST animate with a 150ms ease-in-out transition.

#### REQ-005-05: Event-Based Detection

The system MUST use Konva `mouseenter` and `mouseleave` events for hover detection. Continuous polling (requestAnimationFrame or interval-based checking) MUST NOT be used.

#### REQ-005-06: Performance Guard

Non-interactive Konva layers (grid layer, static wire layer) MUST have `listening: false` set to prevent unnecessary hit detection. Shadow updates MUST be batched per component (only the hovered component updates).

### Scenarios

#### Scenario: Hover over component shows glow

- GIVEN a resistor component is on the canvas
- WHEN the user hovers the mouse over the resistor
- THEN a blue/cyan outline glow appears around the resistor body with 150ms fade-in
- WHEN the mouse leaves the resistor
- THEN the glow fades out over 150ms

#### Scenario: Hover over pin shows tooltip

- GIVEN the Arduino Uno component is on the canvas
- WHEN the user hovers over a pin labeled "D7"
- THEN the pin circle enlarges from 5px to 8px radius
- AND a tooltip appears near the pin showing "D7"
- WHEN the mouse leaves the pin
- THEN the pin shrinks back and the tooltip disappears

#### Scenario: Wire-drawing valid target highlight

- GIVEN the user is in wire-drawing mode, having started from pin "D2" on the Arduino
- WHEN the mouse hovers over pin "A0" on the Arduino
- THEN pin "A0" glows green (valid target, different pin)
- WHEN the mouse hovers over pin "D2" (the source pin)
- THEN pin "D2" glows green (source indicator)
- WHEN the mouse hovers over a pin on a resistor
- THEN the pin glows green (valid target, different component)

#### Scenario: Wire-drawing same-pin highlight

- GIVEN the user started wire-drawing from pin "D2"
- WHEN the mouse hovers over pin "D2" again (the exact source)
- THEN the pin glows red (invalid: same pin)

#### Scenario: Performance with many components

- GIVEN 30 components are on the canvas
- WHEN the user hovers over one component
- THEN only the hovered component's shadow updates
- AND the frame rate remains at 60fps (no full-scene redraw)

---

## CAP-006: Palette Improvements

### Purpose

Enhances the component palette with collapsible categories, search/filter, component thumbnails, drag-to-canvas, and recently used tracking.

### Requirements

#### REQ-006-01: Collapsible Categories

The palette MUST organize components into collapsible categories. Clicking a category header toggles its expanded/collapsed state. Default state: all categories expanded. Categories are:
- **Basic**: LED, Resistor, Capacitor, Pushbutton, Diode, Transistor
- **Inputs**: Potentiometer, Photoresistor, Temp Sensor, Pushbutton
- **Outputs**: LED, RGB LED, Buzzer, Servo, DC Motor
- **Displays**: LCD 16x2, 7-Segment Display
- **ICs**: Shift Register, Op-Amp
- **Power**: Power Supply, Battery
- **Prototyping**: Breadboard (half), Breadboard (full), Jumper Wire

#### REQ-006-02: Search/Filter Bar

The palette MUST include a search input at the top. As the user types, components across ALL categories (including collapsed ones) MUST be filtered to match the query against component name. Matching categories MUST auto-expand. Clearing the search MUST restore the previous collapse state.

#### REQ-006-03: Component Thumbnails

Each palette item MUST display a small thumbnail (SVG or Konva-rendered icon) representing the component visual alongside its name.

#### REQ-006-04: Drag from Palette to Canvas

The user MUST be able to drag a palette item onto the canvas to place a new component. The drag operation MUST set `dataTransfer` with the component type. On drop, the Workspace handles placement as per existing behavior.

#### REQ-006-05: Recently Used Section

The palette MUST display a "Recently Used" section at the top (above categories) showing the last 5 distinct component types placed. This list MUST be persisted to `localStorage` under key `"palette-recently-used"` and survive page reloads.

#### REQ-006-06: Palette Item Display

Each palette item MUST show: (a) component thumbnail, (b) component display name. Items MUST have a hover highlight effect.

### Scenarios

#### Scenario: Collapse and expand category

- GIVEN the palette shows all categories expanded
- WHEN the user clicks the "Basic" category header
- THEN only the "Basic" category collapses (items hidden)
- WHEN the user clicks "Basic" again
- THEN the category expands and items are visible

#### Scenario: Search filters across categories

- GIVEN the palette shows all categories
- WHEN the user types "res" in the search bar
- THEN only "Resistor" is visible across all categories
- AND the containing category ("Basic") is auto-expanded if collapsed
- AND the search results count is shown

#### Scenario: Search with no results

- GIVEN the user types "xyz123" in the search bar
- THEN a "No components found" message is displayed
- AND no categories are shown

#### Scenario: Clear search restores state

- GIVEN the user searched for "LED" (filtering to LED items)
- WHEN the user clears the search input
- THEN all categories and items are visible
- AND the collapse state matches what it was before the search

#### Scenario: Drag component to canvas

- GIVEN the palette shows the "Outputs" category with "Buzzer"
- WHEN the user drags "Buzzer" from the palette and drops it on the canvas
- THEN a new buzzer component is created at the drop position
- AND "buzzer" is added to the recently used list

#### Scenario: Recently used persists across reloads

- GIVEN the user has placed LED, Resistor, and Buzzer (in that order)
- WHEN the application reloads
- THEN the "Recently Used" section shows: Buzzer, Resistor, LED (most recent first)
- AND the data is loaded from localStorage

#### Scenario: Recently used caps at 5

- GIVEN the recently used list has 5 entries
- WHEN the user places a 6th distinct component type
- THEN the oldest entry is removed
- AND the list still contains exactly 5 entries

#### Scenario: Duplicate placement does not duplicate recently used

- GIVEN "Resistor" is already in the recently used list
- WHEN the user places another Resistor
- THEN "Resistor" moves to the top of the recently used list
- AND the list does not contain duplicate entries
