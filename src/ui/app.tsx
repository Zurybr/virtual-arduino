import { useState, useCallback } from "react";
import type { SimulationStatus } from "../types";
import { SimControls } from "./toolbar/sim-controls";
import { PinInspector } from "./debugger/pin-inspector";
import { SerialMonitor } from "./serial-monitor";
import { Workspace } from "./workspace/Workspace";
import type { PlacedComponent, Wire } from "./workspace/types";

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

const PALETTE_ITEMS: Array<{ type: string; label: string; icon: string }> = [
  { type: "led", label: "LED", icon: "💡" },
  { type: "resistor", label: "Resistor", icon: "▬▬" },
  { type: "pushbutton", label: "Button", icon: "⬜" },
  { type: "potentiometer", label: "Potentiometer", icon: "🔘" },
  { type: "servo", label: "Servo", icon: "⚙" },
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
    id: "led-1",
    type: "led",
    x: 560,
    y: 260,
    rotation: 0,
    state: { on: false, color: "#ff0000" },
  },
  {
    id: "resistor-1",
    type: "resistor",
    x: 560,
    y: 360,
    rotation: 0,
    state: {},
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
  paletteHeader: {
    padding: "10px 12px",
    backgroundColor: "#2d2d2d",
    borderBottom: "1px solid #444",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#ccc",
  },
  paletteItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    fontSize: "12px",
    color: "#aaa",
    cursor: "grab",
    borderBottom: "1px solid #333",
    transition: "background-color 0.15s",
    userSelect: "none" as const,
  },
  paletteList: {
    flex: 1,
    overflowY: "auto",
  },
  paletteIcon: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#333",
    borderRadius: "3px",
    fontSize: "12px",
  },
};

let nextId = 100;

export function App() {
  const [status, setStatus] = useState<SimulationStatus>("STOPPED");
  const [serialOutput, setSerialOutput] = useState<string[]>(PLACEHOLDER_SERIAL);
  const [components, setComponents] = useState<PlacedComponent[]>(INITIAL_COMPONENTS);
  const [wires, setWires] = useState<Wire[]>(INITIAL_WIRES);

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
        endPin.pinId.includes("vin");
      const isGround =
        startPin.pinId.includes("gnd") ||
        endPin.pinId.includes("gnd") ||
        startPin.pinId.includes("cathode") ||
        endPin.pinId.includes("cathode");
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
            {PALETTE_ITEMS.map((item) => (
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
            <SerialMonitor
              output={serialOutput}
              onSend={handleSend}
              baudRate={9600}
              onClear={handleClear}
            />
          </div>
        </div>
        <div style={layoutStyles.rightPanel}>
          <PinInspector pins={PLACEHOLDER_PINS} />
        </div>
      </div>
    </div>
  );
}
