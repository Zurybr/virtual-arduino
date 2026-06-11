import { useState, useCallback } from "react";
import type { SimulationStatus } from "../types";
import { UndoProvider, useUndo } from "./undo/UndoContext";
import { TopBar } from "./layout/TopBar";
import { LeftPanel } from "./layout/LeftPanel";
import { RightPanel } from "./layout/RightPanel";
import { Workspace } from "./workspace/Workspace";
import { PropertyPanel } from "./properties/PropertyPanel";
import { TinkercadPalette } from "./palette/TinkercadPalette";
import { addRecentlyUsed } from "./palette/recentlyUsed";
import { ContextMenu } from "./context-menu/ContextMenu";
import {
  getCanvasMenuItems,
  getComponentMenuItems,
  getWireMenuItems,
  getPinMenuItems,
} from "./context-menu/menuConfigs";
import {
  ChangePropertyCommand,
  RotateComponentCommand,
  RemoveComponentCommand,
  RemoveWireCommand,
  AddComponentCommand,
} from "./undo/commands";
import type { PlacedComponent, Wire, ContextMenuState } from "./workspace/types";
import "../styles/layout.css";

const DEFAULT_SKETCH = `void setup() {
  pinMode(13, OUTPUT);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`;

const PLACEHOLDER_SERIAL = [
  "Arduino Virtual Bus Simulator v0.1.0",
  "Initializing...",
  "Ready.",
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

let nextId = 100;

const rootStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  width: "100vw",
  backgroundColor: "#1e1e1e",
  color: "#e0e0e0",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  overflow: "hidden",
};

const mainStyle: React.CSSProperties = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const centerStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  position: "relative",
};

function AppContent() {
  const [status, setStatus] = useState<SimulationStatus>("STOPPED");
  const [serialOutput, setSerialOutput] = useState<string[]>(PLACEHOLDER_SERIAL);
  const [components, setComponents] = useState<PlacedComponent[]>(INITIAL_COMPONENTS);
  const [wires, setWires] = useState<Wire[]>(INITIAL_WIRES);
  const [sketchCode, setSketchCode] = useState<string>(DEFAULT_SKETCH);
  const [circuitName, setCircuitName] = useState("Untitled Circuit");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const { canUndo, canRedo, undo, redo, execute } = useUndo();

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
    addRecentlyUsed(type);
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
    (id: string | null) => {
      setSelectedComponentId(id);
    },
    [],
  );

  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("component-type", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const selectedComponent = selectedComponentId
    ? components.find((c) => c.id === selectedComponentId) ?? null
    : null;

  const handlePropertyChange = useCallback(
    (componentId: string, key: string, value: unknown) => {
      const component = components.find((c) => c.id === componentId);
      if (!component) return;

      const oldValue = component.state[key];
      const command = new ChangePropertyCommand(
        componentId,
        key,
        oldValue,
        value,
        setComponents,
      );
      execute(command);
    },
    [components, execute],
  );

  const handleClosePropertyPanel = useCallback(() => {
    setSelectedComponentId(null);
  }, []);

  // Context menu action handler
  const handleContextMenuAction = useCallback(
    (action: string) => {
      if (!contextMenu) return;

      switch (action) {
        case "rotate": {
          if (contextMenu.targetId) {
            const comp = components.find((c) => c.id === contextMenu.targetId);
            if (comp) {
              const newRotation = ((comp.rotation + 90) % 360) as 0 | 90 | 180 | 270;
              const command = new RotateComponentCommand(
                comp.id,
                comp.rotation,
                newRotation,
                setComponents,
              );
              execute(command);
            }
          }
          break;
        }
        case "delete": {
          if (contextMenu.targetType === "component" && contextMenu.targetId) {
            const comp = components.find((c) => c.id === contextMenu.targetId);
            if (comp) {
              const connectedWires = wires.filter(
                (w) =>
                  w.startPin.componentId === comp.id ||
                  w.endPin.componentId === comp.id,
              );
              const command = new RemoveComponentCommand(
                comp,
                connectedWires,
                setComponents,
                setWires,
              );
              execute(command);
            }
          } else if (contextMenu.targetType === "wire" && contextMenu.targetId) {
            const wire = wires.find((w) => w.id === contextMenu.targetId);
            if (wire) {
              const command = new RemoveWireCommand(wire, setWires);
              execute(command);
            }
          }
          break;
        }
        case "duplicate": {
          if (contextMenu.targetId) {
            const comp = components.find((c) => c.id === contextMenu.targetId);
            if (comp) {
              const duplicate: PlacedComponent = {
                ...comp,
                id: `${comp.type}-${nextId++}`,
                x: comp.x + 20,
                y: comp.y + 20,
                state: { ...comp.state },
              };
              const command = new AddComponentCommand(
                duplicate,
                setComponents,
                setWires,
              );
              execute(command);
            }
          }
          break;
        }
        case "properties": {
          if (contextMenu.targetId) {
            setSelectedComponentId(contextMenu.targetId);
          }
          break;
        }
        case "start-wire": {
          // Handled at the workspace level
          break;
        }
        default:
          break;
      }

      setContextMenu(null);
    },
    [contextMenu, components, wires, execute, setComponents, setWires],
  );

  // Build context menu items based on target type
  const contextMenuItems = contextMenu
    ? (() => {
        switch (contextMenu.targetType) {
          case "canvas":
            return getCanvasMenuItems(false).map((item) => ({
              ...item,
              action: item.label === "Paste" ? undefined : undefined,
            }));
          case "component":
            return getComponentMenuItems().map((item) => {
              if (item.separator) return item;
              const actionMap: Record<string, string> = {
                "Rotate 90°": "rotate",
                "Duplicate": "duplicate",
                "Delete": "delete",
                "Properties": "properties",
              };
              return {
                ...item,
                action: actionMap[item.label]
                  ? () => handleContextMenuAction(actionMap[item.label])
                  : undefined,
              };
            });
          case "wire":
            return getWireMenuItems().map((item) => {
              if (item.separator) return item;
              const actionMap: Record<string, string> = {
                "Delete": "delete",
              };
              return {
                ...item,
                action: actionMap[item.label]
                  ? () => handleContextMenuAction(actionMap[item.label])
                  : undefined,
              };
            });
          case "pin":
            return getPinMenuItems().map((item) => ({
              ...item,
              action: () => handleContextMenuAction("start-wire"),
            }));
          default:
            return [];
        }
      })()
    : [];

  return (
    <div style={rootStyle}>
      <TopBar
        circuitName={circuitName}
        onCircuitNameChange={setCircuitName}
        status={status}
        onRun={handleRun}
        onStop={handleStop}
        onPause={handlePause}
        onResume={handleResume}
        onStep={handleStep}
        onReset={handleReset}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      <div style={mainStyle}>
        <LeftPanel>
          <TinkercadPalette onDragStart={handleDragStart} />
        </LeftPanel>
        <div style={centerStyle}>
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
            contextMenuState={contextMenu}
            onContextMenuChange={setContextMenu}
          />
        </div>
        {selectedComponent ? (
          <PropertyPanel
            selectedComponent={selectedComponent}
            onPropertyChange={handlePropertyChange}
            onClose={handleClosePropertyPanel}
          />
        ) : (
          <RightPanel
            code={sketchCode}
            onCodeChange={setSketchCode}
            serialOutput={serialOutput}
            onSerialSend={handleSend}
            baudRate={9600}
            onSerialClear={handleClear}
          />
        )}
      </div>
      {contextMenu && contextMenuItems.length > 0 && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <UndoProvider>
      <AppContent />
    </UndoProvider>
  );
}
