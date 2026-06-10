import React, { useState, useCallback } from "react";
import {
  Group,
  Rect,
  Circle,
  Line,
  Text,
  Ellipse,
  Arc,
} from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type {
  PlacedComponent,
  PinConnectionPoint,
} from "./types";
import { PIN_RADIUS, PIN_HOVER_RADIUS, PIN_COLORS } from "./types";

interface ComponentItemProps {
  component: PlacedComponent;
  pins: PinConnectionPoint[];
  selected: boolean;
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
  onPinClick: (componentId: string, pinId: string) => void;
  onPinHover: (componentId: string, pinId: string | null) => void;
}

function getArduinoUnoPins(): PinConnectionPoint[] {
  const leftPins: Array<{
    label: string;
    type: PinConnectionPoint["type"];
  }> = [
    { label: "IREF", type: "power" },
    { label: "RESET", type: "digital" },
    { label: "3.3V", type: "power" },
    { label: "5V", type: "power" },
    { label: "GND", type: "ground" },
    { label: "GND", type: "ground" },
    { label: "VIN", type: "power" },
  ];

  const rightPins: Array<{
    label: string;
    type: PinConnectionPoint["type"];
  }> = [
    { label: "D0", type: "digital" },
    { label: "D1", type: "digital" },
    { label: "D2", type: "digital" },
    { label: "D3", type: "pwm" },
    { label: "D4", type: "digital" },
    { label: "D5", type: "pwm" },
    { label: "D6", type: "pwm" },
    { label: "D7", type: "digital" },
    { label: "D8", type: "digital" },
    { label: "D9", type: "pwm" },
    { label: "D10", type: "pwm" },
    { label: "D11", type: "pwm" },
    { label: "D12", type: "digital" },
    { label: "D13", type: "digital" },
  ];

  const bottomPins: Array<{
    label: string;
    type: PinConnectionPoint["type"];
  }> = [
    { label: "A0", type: "analog" },
    { label: "A1", type: "analog" },
    { label: "A2", type: "analog" },
    { label: "A3", type: "analog" },
    { label: "A4", type: "analog" },
    { label: "A5", type: "analog" },
  ];

  const pins: PinConnectionPoint[] = [];
  const boardW = 300;
  const boardH = 200;
  const margin = 15;
  const leftX = -boardW / 2 + margin;
  const rightX = boardW / 2 - margin;
  const pinSpacingY = 14;
  const topStartY = -boardH / 2 + 20;

  leftPins.forEach((p, i) => {
    pins.push({
      id: `power-left-${i}`,
      label: p.label,
      x: leftX,
      y: topStartY + i * pinSpacingY,
      type: p.type,
      connected: false,
    });
  });

  rightPins.forEach((p, i) => {
    pins.push({
      id: `digital-right-${i}`,
      label: p.label,
      x: rightX,
      y: topStartY + i * pinSpacingY,
      type: p.type,
      connected: false,
    });
  });

  const bottomStartX = -70;
  bottomPins.forEach((p, i) => {
    pins.push({
      id: `analog-bottom-${i}`,
      label: p.label,
      x: bottomStartX + i * 24,
      y: boardH / 2 - margin,
      type: p.type,
      connected: false,
    });
  });

  return pins;
}

function getLedPins(): PinConnectionPoint[] {
  return [
    {
      id: "anode",
      label: "Anode(+)",
      x: -8,
      y: 30,
      type: "digital",
      connected: false,
    },
    {
      id: "cathode",
      label: "Cathode(-)",
      x: 8,
      y: 40,
      type: "ground",
      connected: false,
    },
  ];
}

function getResistorPins(): PinConnectionPoint[] {
  return [
    {
      id: "leg1",
      label: "Leg 1",
      x: -50,
      y: 0,
      type: "digital",
      connected: false,
    },
    {
      id: "leg2",
      label: "Leg 2",
      x: 50,
      y: 0,
      type: "digital",
      connected: false,
    },
  ];
}

function getPushbuttonPins(): PinConnectionPoint[] {
  return [
    { id: "pin-a1", label: "A1", x: -20, y: -20, type: "digital", connected: false },
    { id: "pin-a2", label: "A2", x: 20, y: -20, type: "digital", connected: false },
    { id: "pin-b1", label: "B1", x: -20, y: 20, type: "digital", connected: false },
    { id: "pin-b2", label: "B2", x: 20, y: 20, type: "digital", connected: false },
  ];
}

function getPotentiometerPins(): PinConnectionPoint[] {
  return [
    { id: "vcc", label: "VCC", x: -20, y: 30, type: "power", connected: false },
    { id: "out", label: "OUT", x: 0, y: 30, type: "analog", connected: false },
    { id: "gnd", label: "GND", x: 20, y: 30, type: "ground", connected: false },
  ];
}

function getServoPins(): PinConnectionPoint[] {
  return [
    { id: "vcc", label: "VCC", x: -15, y: 40, type: "power", connected: false },
    { id: "gnd", label: "GND", x: 0, y: 40, type: "ground", connected: false },
    { id: "signal", label: "SIG", x: 15, y: 40, type: "pwm", connected: false },
  ];
}

function getGenericPins(count: number): PinConnectionPoint[] {
  const pins: PinConnectionPoint[] = [];
  for (let i = 0; i < count; i++) {
    const x = -30 + (60 / (count - 1 || 1)) * i;
    pins.push({
      id: `pin-${i}`,
      label: `P${i}`,
      x,
      y: 25,
      type: "digital",
      connected: false,
    });
  }
  return pins;
}

export function getComponentPins(
  type: string,
  state?: Record<string, unknown>,
): PinConnectionPoint[] {
  switch (type) {
    case "arduino-uno":
      return getArduinoUnoPins();
    case "led":
      return getLedPins();
    case "resistor":
      return getResistorPins();
    case "pushbutton":
      return getPushbuttonPins();
    case "potentiometer":
      return getPotentiometerPins();
    case "servo":
      return getServoPins();
    case "generic":
      return getGenericPins(
        typeof state?.["pinCount"] === "number" ? state.pinCount : 4,
      );
    default:
      return getGenericPins(4);
  }
}

const ArduinoUnoBody: React.FC = () => (
  <Group>
    <Rect
      x={-150}
      y={-100}
      width={300}
      height={200}
      fill="#2d5a27"
      cornerRadius={[6, 6, 6, 6]}
      stroke="#1a3a15"
      strokeWidth={1.5}
    />
    <Rect
      x={-120}
      y={-85}
      width={50}
      height={35}
      fill="#888"
      cornerRadius={2}
      stroke="#666"
      strokeWidth={1}
    />
    <Text
      x={-116}
      y={-75}
      text="USB"
      fontSize={10}
      fill="#444"
      fontFamily="monospace"
    />
    <Rect
      x={90}
      y={-85}
      width={42}
      height={30}
      fill="#333"
      cornerRadius={3}
      stroke="#555"
      strokeWidth={1}
    />
    <Circle x={111} y={-70} radius={6} fill="#222" stroke="#444" strokeWidth={0.5} />
    <Rect x={-132} y={-50} width={22} height={22} fill="#333" cornerRadius={1} stroke="#555" strokeWidth={0.5} />
    <Circle x={-121} y={-39} radius={3} fill="#888" />
    <Rect x={108} y={-50} width={22} height={22} fill="#333" cornerRadius={1} stroke="#555" strokeWidth={0.5} />
    <Circle x={119} y={-39} radius={3} fill="#888" />
    <Text
      x={-55}
      y={-93}
      text="ARDUINO UNO"
      fontSize={11}
      fill="#c0d0b0"
      fontFamily="monospace"
      fontStyle="bold"
    />
    <Text
      x={-42}
      y={-80}
      text="REV3"
      fontSize={8}
      fill="#8a9a7a"
      fontFamily="monospace"
    />
    <Rect x={-30} y={10} width={60} height={25} fill="#111" cornerRadius={1} />
    <Rect x={-27} y={13} width={54} height={19} fill="#1a1a2e" cornerRadius={1} />
    <Text
      x={-22}
      y={16}
      text="ATmega"
      fontSize={7}
      fill="#4a6"
      fontFamily="monospace"
    />
    <Text
      x={-22}
      y={24}
      text="328P"
      fontSize={7}
      fill="#4a6"
      fontFamily="monospace"
    />
    <Rect x={45} y={50} width={12} height={18} fill="#ff8800" cornerRadius={1} />
    <Circle x={-110} y={72} radius={7} fill="#333" stroke="#555" strokeWidth={0.5} />
    <Circle x={110} y={72} radius={7} fill="#333" stroke="#555" strokeWidth={0.5} />
    <Line points={[-90, -100, -90, -90]} stroke="#ffd700" strokeWidth={2} />
    <Line points={[90, -100, 90, -90]} stroke="#ffd700" strokeWidth={2} />
  </Group>
);

const LedBody: React.FC<{ state: Record<string, unknown> }> = ({ state }) => {
  const isOn = state.on === true || state.value === "HIGH";
  const color = typeof state.color === "string" ? state.color : "#ff0000";

  return (
    <Group>
      <Line
        points={[-8, 30, -8, 10]}
        stroke="#aaa"
        strokeWidth={1.5}
      />
      <Line
        points={[8, 40, 8, 10]}
        stroke="#aaa"
        strokeWidth={1.5}
      />
      <Ellipse
        x={0}
        y={-5}
        radiusX={12}
        radiusY={15}
        fill={isOn ? color : "#444"}
        stroke={isOn ? color : "#666"}
        strokeWidth={1}
        shadowColor={isOn ? color : undefined}
        shadowBlur={isOn ? 20 : 0}
        shadowOpacity={isOn ? 0.8 : 0}
      />
      <Ellipse
        x={0}
        y={-8}
        radiusX={6}
        radiusY={8}
        fill={isOn ? "#ffffff" : "#555"}
        opacity={isOn ? 0.4 : 0.2}
      />
      <Text
        x={-8}
        y={-3}
        text="LED"
        fontSize={6}
        fill={isOn ? "#fff" : "#888"}
        fontFamily="monospace"
      />
    </Group>
  );
};

const ResistorBody: React.FC = () => (
  <Group>
    <Line
      points={[-50, 0, -30, 0]}
      stroke="#aaa"
      strokeWidth={1.5}
    />
    <Line
      points={[30, 0, 50, 0]}
      stroke="#aaa"
      strokeWidth={1.5}
    />
    <Rect
      x={-30}
      y={-8}
      width={60}
      height={16}
      fill="#d4b896"
      cornerRadius={3}
      stroke="#a08060"
      strokeWidth={1}
    />
    <Rect x={-22} y={-8} width={5} height={16} fill="#8B4513" />
    <Rect x={-12} y={-8} width={5} height={16} fill="#000" />
    <Rect x={-2} y={-8} width={5} height={16} fill="#ff0000" />
    <Rect x={8} y={-8} width={5} height={16} fill="#ffd700" />
    <Rect x={18} y={-8} width={5} height={16} fill="#d4b896" />
  </Group>
);

const PushbuttonBody: React.FC<{ state: Record<string, unknown> }> = ({
  state,
}) => {
  const pressed = state.pressed === true;

  return (
    <Group>
      <Rect
        x={-25}
        y={-18}
        width={50}
        height={36}
        fill="#333"
        cornerRadius={2}
        stroke="#555"
        strokeWidth={1}
      />
      <Rect
        x={-20}
        y={-13}
        width={40}
        height={26}
        fill="#444"
        cornerRadius={1}
      />
      <Rect
        x={-10}
        y={-8}
        width={20}
        height={16}
        fill={pressed ? "#666" : "#888"}
        cornerRadius={2}
        stroke="#aaa"
        strokeWidth={0.5}
      />
      <Circle x={-20} y={-18} radius={3} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
      <Circle x={20} y={-18} radius={3} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
      <Circle x={-20} y={18} radius={3} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
      <Circle x={20} y={18} radius={3} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
    </Group>
  );
};

const PotentiometerBody: React.FC = () => (
  <Group>
    <Circle x={0} y={-5} radius={20} fill="#333" stroke="#555" strokeWidth={1} />
    <Circle x={0} y={-5} radius={15} fill="#444" stroke="#666" strokeWidth={0.5} />
    <Circle x={0} y={-5} radius={5} fill="#666" stroke="#888" strokeWidth={0.5} />
    <Line points={[0, -5, 0, -18]} stroke="#aaa" strokeWidth={2} />
    <Line points={[-20, 30, -20, 15]} stroke="#aaa" strokeWidth={1.5} />
    <Line points={[0, 30, 0, 15]} stroke="#aaa" strokeWidth={1.5} />
    <Line points={[20, 30, 20, 15]} stroke="#aaa" strokeWidth={1.5} />
    <Text
      x={-10}
      y={-6}
      text="POT"
      fontSize={5}
      fill="#aaa"
      fontFamily="monospace"
    />
  </Group>
);

const ServoBody: React.FC<{ state: Record<string, unknown> }> = ({ state }) => {
  const angle = typeof state.angle === "number" ? state.angle : 90;

  return (
    <Group>
      <Rect
        x={-25}
        y={-20}
        width={50}
        height={55}
        fill="#4a7cff"
        cornerRadius={3}
        stroke="#2a5cdd"
        strokeWidth={1}
      />
      <Circle x={0} y={-20} radius={8} fill="#666" stroke="#888" strokeWidth={1} />
      <Arc
        x={0}
        y={-20}
        outerRadius={12}
        innerRadius={6}
        angle={angle}
        rotation={-90}
        fill="#aaa"
        stroke="#ccc"
        strokeWidth={0.5}
      />
      <Rect x={-8} y={30} width={16} height={8} fill="#333" cornerRadius={1} stroke="#555" strokeWidth={0.5} />
      <Circle x={-5} y={34} radius={2} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
      <Circle x={0} y={34} radius={2} fill="#333" stroke="#666" strokeWidth={0.5} />
      <Circle x={5} y={34} radius={2} fill="#ff5722" stroke="#d43d15" strokeWidth={0.5} />
      <Text
        x={-15}
        y={5}
        text="SERVO"
        fontSize={6}
        fill="#fff"
        fontFamily="monospace"
      />
    </Group>
  );
};

const GenericBody: React.FC<{ label: string }> = ({ label }) => (
  <Group>
    <Rect
      x={-35}
      y={-20}
      width={70}
      height={40}
      fill="#3c3c3c"
      cornerRadius={4}
      stroke="#666"
      strokeWidth={1}
    />
    <Text
      x={-25}
      y={-6}
      text={label}
      fontSize={9}
      fill="#ccc"
      fontFamily="monospace"
      width={50}
      align="center"
    />
  </Group>
);

const ComponentVisual: React.FC<{
  type: string;
  state: Record<string, unknown>;
}> = ({ type, state }) => {
  switch (type) {
    case "arduino-uno":
      return <ArduinoUnoBody />;
    case "led":
      return <LedBody state={state} />;
    case "resistor":
      return <ResistorBody />;
    case "pushbutton":
      return <PushbuttonBody state={state} />;
    case "potentiometer":
      return <PotentiometerBody />;
    case "servo":
      return <ServoBody state={state} />;
    default:
      return <GenericBody label={type} />;
  }
};

const PinPoint: React.FC<{
  pin: PinConnectionPoint;
  componentId: string;
  onPinClick: (componentId: string, pinId: string) => void;
  onPinHover: (componentId: string, pinId: string | null) => void;
}> = ({ pin, componentId, onPinClick, onPinHover }) => {
  const [hovered, setHovered] = useState(false);
  const color = PIN_COLORS[pin.type] ?? "#999";

  return (
    <Group>
      <Circle
        x={pin.x}
        y={pin.y}
        radius={hovered ? PIN_HOVER_RADIUS : PIN_RADIUS}
        fill={color}
        stroke={hovered ? "#fff" : color}
        strokeWidth={hovered ? 2 : 1}
        opacity={hovered ? 1 : 0.85}
        hitStrokeWidth={12}
        onMouseEnter={(e: KonvaEventObject<MouseEvent>) => {
          setHovered(true);
          onPinHover(componentId, pin.id);
          const stage = e.target.getStage();
          if (stage?.container()) {
            stage.container().style.cursor = "crosshair";
          }
        }}
        onMouseLeave={(e: KonvaEventObject<MouseEvent>) => {
          setHovered(false);
          onPinHover(componentId, null);
          const stage = e.target.getStage();
          if (stage?.container()) {
            stage.container().style.cursor = "default";
          }
        }}
        onClick={() => onPinClick(componentId, pin.id)}
      />
      {hovered && (
        <Text
          x={pin.x + PIN_HOVER_RADIUS + 4}
          y={pin.y - 6}
          text={pin.label}
          fontSize={10}
          fill="#fff"
          fontFamily="monospace"
        />
      )}
    </Group>
  );
};

export const ComponentItem: React.FC<ComponentItemProps> = ({
  component,
  pins,
  selected,
  onDragStart,
  onDragEnd,
  onSelect,
  onPinClick,
  onPinHover,
}) => {
  const handleDragStart = useCallback(() => {
    onDragStart(component.id);
  }, [component.id, onDragStart]);

  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      onDragEnd(component.id, e.target.x(), e.target.y());
    },
    [component.id, onDragEnd],
  );

  const handleClick = useCallback(() => {
    onSelect(component.id);
  }, [component.id, onSelect]);

  return (
    <Group
      x={component.x}
      y={component.y}
      rotation={component.rotation}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
    >
      <ComponentVisual type={component.type} state={component.state} />
      {pins.map((pin) => (
        <PinPoint
          key={pin.id}
          pin={pin}
          componentId={component.id}
          onPinClick={onPinClick}
          onPinHover={onPinHover}
        />
      ))}
      {selected && (
        <Rect
          x={component.type === "arduino-uno" ? -155 : -40}
          y={component.type === "arduino-uno" ? -105 : -25}
          width={component.type === "arduino-uno" ? 310 : 80}
          height={component.type === "arduino-uno" ? 210 : 55}
          stroke="#4488ff"
          strokeWidth={1.5}
          dash={[6, 4]}
          listening={false}
        />
      )}
    </Group>
  );
};
