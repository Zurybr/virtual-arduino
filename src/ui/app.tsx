import { useState, useCallback } from "react";
import type { SimulationStatus } from "../types";
import { SimControls } from "./toolbar/sim-controls";
import { PinInspector } from "./debugger/pin-inspector";
import { SerialMonitor } from "./serial-monitor";
import { CodeEditor } from "./editor/code-editor";
import { Workspace } from "./workspace/Workspace";
import type { PlacedComponent, Wire } from "./workspace/types";

const DEFAULT_SKETCH = `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`;

const PLACEHOLDER_PINS = [
  { id: "d0", label: "D0", mode: "INPUT", value: "LOW", busId: null },
  { id: "d1", label: "D1", mode: "OUTPUT", value: "HIGH", busId: null },
  { id: "d2", label: "D2", mode: "INPUT_PULLUP", value: "FLOATING", busId: null },
  { id: "d3", label: "D3", mode: "PWM", value: "PWM:128", busId: "bus-pwm-1" },
  { id: "d4", label: "D4", mode: "OUTPUT", value: "LOW", busId: null },
  { id: "a0", label: "A0", mode: "ANALOG", value: "512", busId: null },
  { id: "a1", label: "A1", mode: "ANALOG", value: "ANALOG:255", busId: null },
  { id: "tx", label: "TX", mode: "UART_TX", value: "HIGH", busId: "bus-uart-1" },
  { id: "rx", label: "RX", mode: "UART_RX", value: "HIGH", busId: "bus-uart-1" },
];

const PLACEHOLDER_SERIAL = [
  "Arduino Virtual Bus Simulator v0.1.0",
  "Initializing...",
  "Ready.",
];

interface PaletteItem {
  type: string;
  label: string;
  icon: string;
}

interface PaletteCategory {
  name: string;
  items: PaletteItem[];
}

const PALETTE_CATEGORIES: PaletteCategory[] = [
  {
    name: "Boards",
    items: [
      { type: "protoboard", label: "Breadboard", icon: "\u{1F532}" },
    ],
  },
  {
    name: "Basic",
    items: [
      { type: "led", label: "LED", icon: "\u{1F4A1}" },
      { type: "resistor", label: "Resistor", icon: "\u{1F504}" },
      { type: "pushbutton", label: "Button", icon: "\u{2B1C}" },
      { type: "potentiometer", label: "Potentiometer", icon: "\u{1F518}" },
      { type: "capacitor", label: "Capacitor", icon: "\u{1F50B}" },
      { type: "diode", label: "Diode", icon: "\u{25B6}" },
      { type: "transistor", label: "Transistor", icon: "\u{1F53A}" },
    ],
  },
  {
    name: "Outputs",
    items: [
      { type: "rgb-led", label: "RGB LED", icon: "\u{1F308}" },
      { type: "buzzer", label: "Buzzer", icon: "\u{1F514}" },
      { type: "servo", label: "Servo", icon: "\u{2699}" },
      { type: "dc-motor", label: "DC Motor", icon: "\u{1F300}" },
      { type: "lcd-display", label: "LCD 16x2", icon: "\u{1F4FA}" },
    ],
  },
  {
    name: "Sensors",
    items: [
      { type: "photoresistor", label: "Photoresistor", icon: "\u{2600}" },
      { type: "temperature-sensor", label: "Temp Sensor", icon: "\u{1F321}" },
    ],
  },
  {
    name: "ICs",
    items: [
      { type: "shift-register", label: "Shift Register", icon: "\u{1F4E6}" },
    ],
  },
  {
    name: "Connectors",
    items: [
      { type: "usb-connector", label: "USB Power", icon: "\u{1F50C}" },
    ],
  },
];

const INITIAL_COMPONENTS: PlacedComponent[] = [
  {
    id: "arduino-1",
    type: "arduino-uno",
    x: 300,
    y: 300,
    rotation: 0,
    state: {},
  },
  {
    id: "protoboard-1",
    type: "protoboard",
    x: 750,
    y: 300,
    rotation: 0,
    state: {},
  },
  {
    id: "led-1",
    type: "led",
    x: 560,
    y: 260,
    rotation: 0,
    state: { on: false, color: "#ff0000" },
  },
];

const INITIAL_WIRES: Wire[] = [];

const layoutStyles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    backgroundColor: "#1e1e1e",
    color: "#ccc",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    overflow: "hidden",
  },
  main: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  leftPanel: {
    width: "180px",
    minWidth: "180px",
    backgroundColor: "#252526",
    borderRight: "1px solid #444",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  centerPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  rightPanel: {
    width: "280px",
    minWidth: "280px",
    backgroundColor: "#1e1e1e",
    borderLeft: "1px solid #444",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  bottomPanel: {
    height: "220px",
    minHeight: "120px",
    display: "flex",
    flexDirection: "column",
    borderTop: "1px solid #444",
  },
  tabHeader: {
    display: "flex",
    backgroundColor: "#252526",
    borderBottom: "1px solid #444",
  },
  tab: {
    padding: "4px 16px",
    fontSize: "12px",
    color: "#888",
    cursor: "pointer",
    border: "none",
    background: "none",
    borderBottom: "2px solid transparent",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  tabActive: {
    padding: "4px 16px",
    fontSize: "12px",
    color: "#ccc",
    cursor: "pointer",
    border: "none",
    background: "none",
    borderBottom: "2px solid #4488ff",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  paletteHeader: {
    padding: "10px 12px",
    backgroundColor: "#2d2d2d",
    borderBottom: "1px solid #444",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#ccc",
  },
  categoryHeader: {
    padding: "6px 12px",
    backgroundColor: "#2a2a2a",
    borderBottom: "1px solid #383838",
    fontSize: "10px",
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  paletteItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    fontSize: "12px",
    color: "#aaa",
    cursor: "grab",
    borderBottom: "1px solid #2e2e2e",
    transition: "background-color 0.15s",
    userSelect: "none" as const,
  },
  paletteList: {
    flex: 1,
    overflowY: "auto",
  },
  paletteIcon: {
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    borderRadius: "3px",
    fontSize: "11px",
  },
};

let nextId = 100;

export function App() {
  const [status, setStatus] = useState<SimulationStatus>("STOPPED");
  const [serialOutput, setSerialOutput] = useState<string[]>(PLACEHOLDER_SERIAL);
  const [components, setComponents] = useState<PlacedComponent[]>(INITIAL_COMPONENTS);
  const [wires, setWires] = useState<Wire[]>(INITIAL_WIRES);
  const [sketchCode, setSketchCode] = useState<string>(DEFAULT_SKETCH);
  const [bottomTab, setBottomTab] = useState<"serial" | "editor">("serial");

  const handleRun = useCallback(() => setStatus("RUNNING"), []);
  const handleStop = useCallback(() => setStatus("STOPPED"), []);
  const handlePause = useCallback(() => setStatus("PAUSED"), []);
  const handleResume = useCallback(() => setStatus("RUNNING"), []);
  const handleStep = useCallback(() => {
    setStatus("PAUSED");
  }, []);
  const handleReset = useCallback(() => {
    setStatus("STOPPED");
    setSerialOutput(PLACEHOLDER_SERIAL);
  }, []);

  const handleSend = useCallback(
    (data: string) => {
      setSerialOutput((prev) => [...prev, `> ${data}`]);
    },
    [],
  );

  const handleClear = useCallback(() => {
    setSerialOutput([]);
  }, []);

  const handleComponentPlaced = useCallback((type: string, x: number, y: number) => {
    const id = `${type}-${nextId++}`;
    setComponents((prev) => [
      ...prev,
      { id, type, x, y, rotation: 0, state: {} },
    ]);
  }, []);

  const handleComponentMoved = useCallback((id: string, x: number, y: number) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, x, y } : c)),
    );
  }, []);

  const handleComponentRotated = useCallback(
    (id: string, rotation: number) => {
      setComponents((prev) =>
        prev.map((c) => (c.id === id ? { ...c, rotation } : c)),
      );
    },
    [],
  );

  const handleComponentDeleted = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setWires((prev) =>
      prev.filter(
        (w) => w.startPin.componentId !== id && w.endPin.componentId !== id,
      ),
    );
  }, []);

  const handleWireCreated = useCallback(
    (
      startPin: { componentId: string; pinId: string },
      endPin: { componentId: string; pinId: string },
    ) => {
      const id = `wire-${nextId++}`;
      const isPower =
        startPin.pinId.includes("power") ||
        endPin.pinId.includes("power") ||
        startPin.pinId.includes("vcc") ||
        endPin.pinId.includes("vcc") ||
        startPin.pinId.includes("vin") ||
        endPin.pinId.includes("vin") ||
        startPin.pinId.includes("pos") ||
        endPin.pinId.includes("pos") ||
        startPin.pinId.includes("5v") ||
        endPin.pinId.includes("5v");
      const isGround =
        startPin.pinId.includes("gnd") ||
        endPin.pinId.includes("gnd") ||
        startPin.pinId.includes("cathode") ||
        endPin.pinId.includes("cathode") ||
        startPin.pinId.includes("neg") ||
        endPin.pinId.includes("neg");
      const color = isPower ? "#e53935" : isGround ? "#424242" : "#1e88e5";

      setWires((prev) => [
        ...prev,
        {
          id,
          startPin,
          endPin,
          color,
          points: [],
        },
      ]);
    },
    [],
  );

  const handleWireDeleted = useCallback((id: string) => {
    setWires((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleComponentSelected = useCallback(
    (_id: string | null) => {
    },
    [],
  );

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("component-type", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div style={layoutStyles.root}>
      <SimControls
        status={status}
        onRun={handleRun}
        onStop={handleStop}
        onPause={handlePause}
        onResume={handleResume}
        onStep={handleStep}
        onReset={handleReset}
      />
      <div style={layoutStyles.main}>
        <div style={layoutStyles.leftPanel}>
          <div style={layoutStyles.paletteHeader}>Components</div>
          <div style={layoutStyles.paletteList}>
            {PALETTE_CATEGORIES.map((category) => (
              <div key={category.name}>
                <div style={layoutStyles.categoryHeader}>{category.name}</div>
                {category.items.map((item) => (
                  <div
                    key={item.type}
                    style={layoutStyles.paletteItem}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.type)}
                  >
                    <span style={layoutStyles.paletteIcon}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={layoutStyles.centerPanel}>
          <Workspace
            components={components}
            wires={wires}
            onComponentPlaced={handleComponentPlaced}
            onComponentMoved={handleComponentMoved}
            onComponentRotated={handleComponentRotated}
            onComponentDeleted={handleComponentDeleted}
            onWireCreated={handleWireCreated}
            onWireDeleted={handleWireDeleted}
            onComponentSelected={handleComponentSelected}
          />
          <div style={layoutStyles.bottomPanel}>
            <div style={layoutStyles.tabHeader}>
              <button
                style={bottomTab === "serial" ? layoutStyles.tabActive : layoutStyles.tab}
                onClick={() => setBottomTab("serial")}
              >
                Serial Monitor
              </button>
              <button
                style={bottomTab === "editor" ? layoutStyles.tabActive : layoutStyles.tab}
                onClick={() => setBottomTab("editor")}
              >
                Code Editor
              </button>
            </div>
            {bottomTab === "serial" ? (
              <SerialMonitor
                output={serialOutput}
                onSend={handleSend}
                baudRate={9600}
                onClear={handleClear}
              />
            ) : (
              <CodeEditor code={sketchCode} onCodeChange={setSketchCode} />
            )}
          </div>
        </div>
        <div style={layoutStyles.rightPanel}>
          <PinInspector pins={PLACEHOLDER_PINS} />
        </div>
      </div>
    </div>
  );
}
