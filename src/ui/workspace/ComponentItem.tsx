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

/* ------------------------------------------------------------------ */
/*  PIN DEFINITIONS                                                    */
/* ------------------------------------------------------------------ */

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
  const boardH = 230;
  const margin = 15;
  const leftX = -boardW / 2 + margin;
  const rightX = boardW / 2 - margin;
  const pinSpacingY = 14;
  const topStartY = -boardH / 2 + 25;

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
      y: 35,
      type: "digital",
      connected: false,
    },
    {
      id: "cathode",
      label: "Cathode(-)",
      x: 8,
      y: 45,
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

function getBuzzerPins(): PinConnectionPoint[] {
  return [
    { id: "pos", label: "(+)", x: -8, y: 28, type: "power", connected: false },
    { id: "neg", label: "(-)", x: 8, y: 28, type: "ground", connected: false },
  ];
}

function getRgbLedPins(): PinConnectionPoint[] {
  return [
    { id: "red", label: "R", x: -12, y: 45, type: "pwm", connected: false },
    { id: "green", label: "G", x: -4, y: 45, type: "pwm", connected: false },
    { id: "blue", label: "B", x: 4, y: 45, type: "pwm", connected: false },
    { id: "common", label: "COM(-)", x: 12, y: 45, type: "ground", connected: false },
  ];
}

function getDcMotorPins(): PinConnectionPoint[] {
  return [
    { id: "pos", label: "(+)", x: -8, y: 32, type: "power", connected: false },
    { id: "neg", label: "(-)", x: 8, y: 32, type: "ground", connected: false },
  ];
}

function getPhotoresistorPins(): PinConnectionPoint[] {
  return [
    { id: "leg1", label: "Leg 1", x: -8, y: 28, type: "analog", connected: false },
    { id: "leg2", label: "Leg 2", x: 8, y: 28, type: "analog", connected: false },
  ];
}

function getTemperatureSensorPins(): PinConnectionPoint[] {
  return [
    { id: "vcc", label: "VCC", x: -10, y: 28, type: "power", connected: false },
    { id: "out", label: "OUT", x: 0, y: 28, type: "analog", connected: false },
    { id: "gnd", label: "GND", x: 10, y: 28, type: "ground", connected: false },
  ];
}

function getLcdDisplayPins(): PinConnectionPoint[] {
  return [
    { id: "vcc", label: "VCC", x: -25, y: 40, type: "power", connected: false },
    { id: "gnd", label: "GND", x: -15, y: 40, type: "ground", connected: false },
    { id: "rs", label: "RS", x: -5, y: 40, type: "digital", connected: false },
    { id: "en", label: "EN", x: 5, y: 40, type: "digital", connected: false },
    { id: "d4", label: "D4", x: 15, y: 40, type: "digital", connected: false },
    { id: "d5", label: "D5", x: 25, y: 40, type: "digital", connected: false },
  ];
}

function getShiftRegisterPins(): PinConnectionPoint[] {
  const leftDefs: Array<{ id: string; label: string; type: PinConnectionPoint["type"] }> = [
    { id: "q1", label: "Q1", type: "digital" },
    { id: "q2", label: "Q2", type: "digital" },
    { id: "q3", label: "Q3", type: "digital" },
    { id: "q4", label: "Q4", type: "digital" },
    { id: "q5", label: "Q5", type: "digital" },
    { id: "q6", label: "Q6", type: "digital" },
    { id: "q7", label: "Q7", type: "digital" },
    { id: "gnd", label: "GND", type: "ground" },
  ];
  const rightDefs: Array<{ id: string; label: string; type: PinConnectionPoint["type"] }> = [
    { id: "vcc", label: "VCC", type: "power" },
    { id: "q0", label: "Q0", type: "digital" },
    { id: "ds", label: "DS", type: "digital" },
    { id: "oe", label: "OE", type: "digital" },
    { id: "stcp", label: "STCP", type: "digital" },
    { id: "shcp", label: "SHCP", type: "digital" },
    { id: "mr", label: "MR", type: "digital" },
    { id: "q7s", label: "Q7'", type: "digital" },
  ];

  const pins: PinConnectionPoint[] = [];
  leftDefs.forEach((p, i) => {
    pins.push({
      id: p.id,
      label: p.label,
      x: -35,
      y: -28 + i * 8,
      type: p.type,
      connected: false,
    });
  });
  rightDefs.forEach((p, i) => {
    pins.push({
      id: p.id,
      label: p.label,
      x: 35,
      y: -28 + i * 8,
      type: p.type,
      connected: false,
    });
  });
  return pins;
}

function getTransistorPins(): PinConnectionPoint[] {
  return [
    { id: "emitter", label: "E", x: -10, y: 28, type: "digital", connected: false },
    { id: "base", label: "B", x: 0, y: 28, type: "digital", connected: false },
    { id: "collector", label: "C", x: 10, y: 28, type: "digital", connected: false },
  ];
}

function getDiodePins(): PinConnectionPoint[] {
  return [
    { id: "anode", label: "A(+)", x: -40, y: 0, type: "digital", connected: false },
    { id: "cathode", label: "K(-)", x: 40, y: 0, type: "digital", connected: false },
  ];
}

function getCapacitorPins(): PinConnectionPoint[] {
  return [
    { id: "pos", label: "(+)", x: -6, y: 32, type: "power", connected: false },
    { id: "neg", label: "(-)", x: 6, y: 32, type: "ground", connected: false },
  ];
}

function getUsbConnectorPins(): PinConnectionPoint[] {
  return [
    { id: "5v", label: "5V", x: -8, y: 28, type: "power", connected: false },
    { id: "gnd", label: "GND", x: 8, y: 28, type: "ground", connected: false },
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

/* ------------------------------------------------------------------ */
/*  PROTOBOARD HOLE DATA                                               */
/* ------------------------------------------------------------------ */

interface ProtoboardHoleDef {
  id: string;
  label: string;
  x: number;
  y: number;
  type: PinConnectionPoint["type"];
}

const PROTOBOARD_ROWS_TOP = ["a", "b", "c", "d", "e"] as const;
const PROTOBOARD_ROWS_BOT = ["f", "g", "h", "i", "j"] as const;
const PROTOBOARD_ROW_Y_TOP = [-75, -61, -47, -33, -19];
const PROTOBOARD_ROW_Y_BOT = [19, 33, 47, 61, 75];
const PROTOBOARD_COL_COUNT = 25;
const PROTOBOARD_COL_START_X = -160;
const PROTOBOARD_COL_SPACING = 14;

function buildProtoboardHoles(): ProtoboardHoleDef[] {
  const holes: ProtoboardHoleDef[] = [];

  for (let ri = 0; ri < PROTOBOARD_ROWS_TOP.length; ri++) {
    const row = PROTOBOARD_ROWS_TOP[ri];
    const y = PROTOBOARD_ROW_Y_TOP[ri];
    for (let col = 0; col < PROTOBOARD_COL_COUNT; col++) {
      holes.push({
        id: `hole-${row}${col + 1}`,
        label: `${row}${col + 1}`,
        x: PROTOBOARD_COL_START_X + col * PROTOBOARD_COL_SPACING,
        y,
        type: "digital",
      });
    }
  }

  for (let ri = 0; ri < PROTOBOARD_ROWS_BOT.length; ri++) {
    const row = PROTOBOARD_ROWS_BOT[ri];
    const y = PROTOBOARD_ROW_Y_BOT[ri];
    for (let col = 0; col < PROTOBOARD_COL_COUNT; col++) {
      holes.push({
        id: `hole-${row}${col + 1}`,
        label: `${row}${col + 1}`,
        x: PROTOBOARD_COL_START_X + col * PROTOBOARD_COL_SPACING,
        y,
        type: "digital",
      });
    }
  }

  for (let col = 0; col < PROTOBOARD_COL_COUNT; col++) {
    const x = PROTOBOARD_COL_START_X + col * PROTOBOARD_COL_SPACING;
    holes.push(
      { id: `rail-top-pos-${col + 1}`, label: `+${col + 1}`, x, y: -120, type: "power" },
      { id: `rail-top-neg-${col + 1}`, label: `-${col + 1}`, x, y: -106, type: "ground" },
      { id: `rail-bot-neg-${col + 1}`, label: `-${col + 1}`, x, y: 106, type: "ground" },
      { id: `rail-bot-pos-${col + 1}`, label: `+${col + 1}`, x, y: 120, type: "power" },
    );
  }

  return holes;
}

const PROTOBOARD_HOLES: ProtoboardHoleDef[] = buildProtoboardHoles();

const PROTOBOARD_RAIL_TOP_HOLES = PROTOBOARD_HOLES.filter(
  (h) => h.y === -120 || h.y === -106,
);
const PROTOBOARD_GRID_TOP_HOLES = PROTOBOARD_HOLES.filter((h) =>
  PROTOBOARD_ROWS_TOP.some((r) => h.id.startsWith(`hole-${r}`)),
);
const PROTOBOARD_GRID_BOT_HOLES = PROTOBOARD_HOLES.filter((h) =>
  PROTOBOARD_ROWS_BOT.some((r) => h.id.startsWith(`hole-${r}`)),
);
const PROTOBOARD_RAIL_BOT_HOLES = PROTOBOARD_HOLES.filter(
  (h) => h.y === 106 || h.y === 120,
);

export function getProtoboardHolePositions(): Array<{
  id: string;
  x: number;
  y: number;
  type: PinConnectionPoint["type"];
}> {
  return PROTOBOARD_HOLES.map(({ id, x, y, type }) => ({ id, x, y, type }));
}

function getProtoboardPins(): PinConnectionPoint[] {
  return PROTOBOARD_HOLES.map((h) => ({
    id: h.id,
    label: h.label,
    x: h.x,
    y: h.y,
    type: h.type,
    connected: false,
  }));
}

/* ------------------------------------------------------------------ */
/*  getComponentPins (exported)                                        */
/* ------------------------------------------------------------------ */

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
    case "buzzer":
      return getBuzzerPins();
    case "rgb-led":
      return getRgbLedPins();
    case "dc-motor":
      return getDcMotorPins();
    case "photoresistor":
      return getPhotoresistorPins();
    case "temperature-sensor":
      return getTemperatureSensorPins();
    case "lcd-display":
      return getLcdDisplayPins();
    case "shift-register":
      return getShiftRegisterPins();
    case "transistor":
      return getTransistorPins();
    case "diode":
      return getDiodePins();
    case "capacitor":
      return getCapacitorPins();
    case "usb-connector":
      return getUsbConnectorPins();
    case "protoboard":
      return getProtoboardPins();
    case "generic":
      return getGenericPins(
        typeof state?.["pinCount"] === "number" ? state.pinCount : 4,
      );
    default:
      return getGenericPins(4);
  }
}

/* ------------------------------------------------------------------ */
/*  BODY COMPONENTS                                                    */
/* ------------------------------------------------------------------ */

const ArduinoUnoBody: React.FC = React.memo(() => (
  <Group>
    <Rect
      x={-150}
      y={-115}
      width={300}
      height={230}
      fill="#2d5a27"
      cornerRadius={6}
      stroke="#1a3a15"
      strokeWidth={1.5}
    />
    <Rect
      x={-120}
      y={-100}
      width={50}
      height={35}
      fill="#888"
      cornerRadius={2}
      stroke="#666"
      strokeWidth={1}
    />
    <Text
      x={-116}
      y={-90}
      text="USB"
      fontSize={10}
      fill="#444"
      fontFamily="monospace"
    />
    <Rect
      x={90}
      y={-100}
      width={42}
      height={30}
      fill="#333"
      cornerRadius={3}
      stroke="#555"
      strokeWidth={1}
    />
    <Circle x={111} y={-85} radius={6} fill="#222" stroke="#444" strokeWidth={0.5} />
    <Rect x={-132} y={-65} width={22} height={22} fill="#333" cornerRadius={1} stroke="#555" strokeWidth={0.5} />
    <Circle x={-121} y={-54} radius={3} fill="#888" />
    <Rect x={108} y={-65} width={22} height={22} fill="#333" cornerRadius={1} stroke="#555" strokeWidth={0.5} />
    <Circle x={119} y={-54} radius={3} fill="#888" />
    <Text
      x={-55}
      y={-108}
      text="ARDUINO UNO"
      fontSize={11}
      fill="#c0d0b0"
      fontFamily="monospace"
      fontStyle="bold"
    />
    <Text
      x={-42}
      y={-95}
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
    <Circle x={-110} y={100} radius={7} fill="#333" stroke="#555" strokeWidth={0.5} />
    <Circle x={110} y={100} radius={7} fill="#333" stroke="#555" strokeWidth={0.5} />
    <Line points={[-90, -115, -90, -105]} stroke="#ffd700" strokeWidth={2} />
    <Line points={[90, -115, 90, -105]} stroke="#ffd700" strokeWidth={2} />
    <Line points={[-138, 40, -120, 40]} stroke="#888" strokeWidth={2} />
    <Line points={[-138, 54, -120, 54]} stroke="#888" strokeWidth={2} />
    <Line points={[-138, 68, -120, 68]} stroke="#888" strokeWidth={2} />
    <Line points={[-138, 82, -120, 82]} stroke="#888" strokeWidth={2} />
    <Line points={[-138, 96, -120, 96]} stroke="#888" strokeWidth={2} />
    <Line points={[120, 40, 138, 40]} stroke="#888" strokeWidth={2} />
    <Line points={[120, 54, 138, 54]} stroke="#888" strokeWidth={2} />
    <Line points={[120, 68, 138, 68]} stroke="#888" strokeWidth={2} />
    <Line points={[120, 82, 138, 82]} stroke="#888" strokeWidth={2} />
    <Line points={[120, 96, 138, 96]} stroke="#888" strokeWidth={2} />
  </Group>
));

const LedBody: React.FC<{ state: Record<string, unknown> }> = React.memo(({ state }) => {
  const isOn = state.on === true || state.value === "HIGH";
  const color = typeof state.color === "string" ? state.color : "#ff0000";

  return (
    <Group>
      <Line points={[-8, 35, -8, 12]} stroke="#bbb" strokeWidth={1.5} />
      <Line points={[8, 45, 8, 12]} stroke="#bbb" strokeWidth={1.5} />
      <Rect x={-4} y={8} width={8} height={6} fill="#ccc" stroke="#999" strokeWidth={0.5} cornerRadius={1} />
      <Ellipse
        x={0}
        y={-6}
        radiusX={11}
        radiusY={14}
        fill={isOn ? color : "#555"}
        stroke={isOn ? color : "#777"}
        strokeWidth={1}
        shadowColor={isOn ? color : undefined}
        shadowBlur={isOn ? 25 : 0}
        shadowOpacity={isOn ? 0.8 : 0}
      />
      <Ellipse
        x={0}
        y={-10}
        radiusX={5}
        radiusY={7}
        fill={isOn ? "#ffffff" : "#666"}
        opacity={isOn ? 0.45 : 0.15}
      />
      <Line points={[-3, 5, -3, -2]} stroke="#bbb" strokeWidth={1} />
      <Line points={[3, 5, 3, -2]} stroke="#bbb" strokeWidth={1} />
    </Group>
  );
});

const ResistorBody: React.FC = React.memo(() => (
  <Group>
    <Line points={[-50, 0, -30, 0]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[30, 0, 50, 0]} stroke="#bbb" strokeWidth={1.5} />
    <Rect
      x={-30}
      y={-8}
      width={60}
      height={16}
      fill="#d4b896"
      cornerRadius={8}
      stroke="#a08060"
      strokeWidth={1}
    />
    <Rect x={-24} y={-8} width={5} height={16} fill="#8B4513" />
    <Rect x={-14} y={-8} width={5} height={16} fill="#000" />
    <Rect x={-4} y={-8} width={5} height={16} fill="#ff0000" />
    <Rect x={6} y={-8} width={5} height={16} fill="#ffd700" />
    <Rect x={16} y={-8} width={5} height={16} fill="#d4b896" />
  </Group>
));

const PushbuttonBody: React.FC<{ state: Record<string, unknown> }> = React.memo(
  ({ state }) => {
    const pressed = state.pressed === true;

    return (
      <Group>
        <Rect
          x={-25}
          y={-18}
          width={50}
          height={36}
          fill="#222"
          cornerRadius={2}
          stroke="#555"
          strokeWidth={1}
        />
        <Rect
          x={-23}
          y={-16}
          width={46}
          height={32}
          fill="#333"
          cornerRadius={1}
        />
        <Rect
          x={-10}
          y={-8}
          width={20}
          height={16}
          fill={pressed ? "#777" : "#999"}
          cornerRadius={2}
          stroke="#bbb"
          strokeWidth={0.5}
        />
        <Line points={[-18, -15, 18, -15]} stroke="#aaa" strokeWidth={0.5} />
        <Circle cx={-20} cy={-18} r={2.5} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
        <Circle cx={20} cy={-18} r={2.5} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
        <Circle cx={-20} cy={18} r={2.5} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
        <Circle cx={20} cy={18} r={2.5} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
        <Line points={[-20, -20, -20, -24]} stroke="#aaa" strokeWidth={1.5} />
        <Line points={[20, -20, 20, -24]} stroke="#aaa" strokeWidth={1.5} />
        <Line points={[-20, 20, -20, 24]} stroke="#aaa" strokeWidth={1.5} />
        <Line points={[20, 20, 20, 24]} stroke="#aaa" strokeWidth={1.5} />
      </Group>
    );
  },
);

const PotentiometerBody: React.FC = React.memo(() => (
  <Group>
    <Circle x={0} y={-5} radius={20} fill="#444" stroke="#666" strokeWidth={1} />
    <Circle x={0} y={-5} radius={15} fill="#555" stroke="#777" strokeWidth={0.5} />
    <Circle x={0} y={-5} radius={4} fill="#888" stroke="#aaa" strokeWidth={0.5} />
    <Line points={[0, -5, 8, -18]} stroke="#ccc" strokeWidth={2} />
    <Line points={[-20, 30, -20, 15]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[0, 30, 0, 15]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[20, 30, 20, 15]} stroke="#bbb" strokeWidth={1.5} />
    <Text
      x={-8}
      y={-7}
      text="10k"
      fontSize={5}
      fill="#aaa"
      fontFamily="monospace"
    />
  </Group>
));

const ServoBody: React.FC<{ state: Record<string, unknown> }> = React.memo(({ state }) => {
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
      <Rect
        x={-25}
        y={30}
        width={50}
        height={5}
        fill="#2a5cdd"
        cornerRadius={[0, 0, 3, 3]}
      />
      <Circle x={0} y={-20} radius={8} fill="#666" stroke="#888" strokeWidth={1} />
      <Line
        points={[0, -20, 0, -30]}
        stroke="#ccc"
        strokeWidth={3}
        rotation={angle - 90}
        offsetX={0}
        offsetY={0}
      />
      <Rect x={-8} y={30} width={16} height={10} fill="#333" cornerRadius={1} stroke="#555" strokeWidth={0.5} />
      <Circle x={-5} y={35} radius={2} fill="#ffd700" stroke="#b8960f" strokeWidth={0.5} />
      <Circle x={0} y={35} radius={2} fill="#333" stroke="#666" strokeWidth={0.5} />
      <Circle x={5} y={35} radius={2} fill="#ff5722" stroke="#d43d15" strokeWidth={0.5} />
      <Text
        x={-15}
        y={5}
        text="SG90"
        fontSize={7}
        fill="#fff"
        fontFamily="monospace"
        fontStyle="bold"
      />
    </Group>
  );
});

const BuzzerBody: React.FC = React.memo(() => (
  <Group>
    <Line points={[-8, 28, -8, 15]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[8, 28, 8, 15]} stroke="#bbb" strokeWidth={1.5} />
    <Ellipse x={0} y={0} radiusX={14} radiusY={14} fill="#222" stroke="#444" strokeWidth={1} />
    <Ellipse x={0} y={-2} radiusX={10} radiusY={10} fill="#333" stroke="#555" strokeWidth={0.5} />
    <Ellipse x={0} y={-2} radiusX={4} radiusY={4} fill="#444" stroke="#555" strokeWidth={0.5} />
    <Text x={-4} y={-5} text="+" fontSize={8} fill="#999" fontFamily="monospace" />
  </Group>
));

const RgbLedBody: React.FC<{ state: Record<string, unknown> }> = React.memo(({ state }) => {
  const isOn =
    state.redOn === true ||
    state.greenOn === true ||
    state.blueOn === true ||
    state.on === true;

  return (
    <Group>
      <Line points={[-12, 45, -12, 12]} stroke="#bbb" strokeWidth={1.5} />
      <Line points={[-4, 45, -4, 12]} stroke="#bbb" strokeWidth={1.5} />
      <Line points={[4, 45, 4, 12]} stroke="#bbb" strokeWidth={1.5} />
      <Line points={[12, 45, 12, 12]} stroke="#bbb" strokeWidth={1.5} />
      <Rect x={-5} y={8} width={10} height={6} fill="#ccc" stroke="#999" strokeWidth={0.5} cornerRadius={1} />
      <Ellipse
        x={0}
        y={-6}
        radiusX={13}
        radiusY={16}
        fill={isOn ? "#ffffff" : "#555"}
        stroke={isOn ? "#ffffff" : "#777"}
        strokeWidth={1}
        shadowColor={isOn ? "#ffffff" : undefined}
        shadowBlur={isOn ? 20 : 0}
        shadowOpacity={isOn ? 0.5 : 0}
      />
      <Ellipse x={-4} y={-8} radiusX={3} radiusY={4} fill="#ff0000" opacity={0.5} />
      <Ellipse x={0} y={-10} radiusX={3} radiusY={4} fill="#00ff00" opacity={0.5} />
      <Ellipse x={4} y={-8} radiusX={3} radiusY={4} fill="#0066ff" opacity={0.5} />
    </Group>
  );
});

const DcMotorBody: React.FC = React.memo(() => (
  <Group>
    <Line points={[-8, 32, -8, 20]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[8, 32, 8, 20]} stroke="#bbb" strokeWidth={1.5} />
    <Rect x={-18} y={-18} width={36} height={38} fill="#888" cornerRadius={3} stroke="#666" strokeWidth={1} />
    <Rect x={-15} y={-15} width={30} height={32} fill="#999" cornerRadius={2} />
    <Circle x={0} y={-1} radius={10} fill="#777" stroke="#555" strokeWidth={1} />
    <Circle x={0} y={-1} radius={4} fill="#666" stroke="#444" strokeWidth={0.5} />
    <Rect x={-2} y={-22} width={4} height={8} fill="#bbb" stroke="#999" strokeWidth={0.5} />
    <Text x={-12} y={6} text="MOTOR" fontSize={5} fill="#444" fontFamily="monospace" />
  </Group>
));

const PhotoresistorBody: React.FC = React.memo(() => (
  <Group>
    <Line points={[-8, 28, -8, 15]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[8, 28, 8, 15]} stroke="#bbb" strokeWidth={1.5} />
    <Circle x={0} y={-2} radius={14} fill="#8B7355" stroke="#6B5335" strokeWidth={1} />
    <Circle x={0} y={-2} radius={10} fill="#9B8365" stroke="#7B6345" strokeWidth={0.5} />
    <Line points={[-6, -8, -2, -4, 2, -8, 6, -4, 2, 0, -2, 4, -6, 0]} stroke="#6B5335" strokeWidth={0.8} />
    <Line points={[-6, 0, -2, 4, 2, 0, 6, 4]} stroke="#6B5335" strokeWidth={0.8} />
  </Group>
));

const TemperatureSensorBody: React.FC = React.memo(() => (
  <Group>
    <Line points={[-10, 28, -10, 14]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[0, 28, 0, 14]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[10, 28, 10, 14]} stroke="#bbb" strokeWidth={1.5} />
    <Rect x={-12} y={-12} width={24} height={26} fill="#222" cornerRadius={[0, 12, 12, 0]} stroke="#444" strokeWidth={0.5} />
    <Line points={[-12, -12, -12, 14]} stroke="#555" strokeWidth={2} />
    <Text x={-7} y={-2} text="TMP" fontSize={6} fill="#aaa" fontFamily="monospace" />
  </Group>
));

const LcdDisplayBody: React.FC = React.memo(() => (
  <Group>
    <Rect x={-45} y={-28} width={90} height={60} fill="#1a3a8a" cornerRadius={3} stroke="#0a2a6a" strokeWidth={1} />
    <Rect x={-38} y={-20} width={76} height={32} fill="#2a8a2a" cornerRadius={2} stroke="#1a7a1a" strokeWidth={0.5} />
    <Rect x={-35} y={-17} width={35} height={12} fill="#3a9a3a" opacity={0.3} />
    <Rect x={-35} y={-3} width={35} height={12} fill="#3a9a3a" opacity={0.3} />
    <Rect x={5} y={-17} width={35} height={12} fill="#3a9a3a" opacity={0.3} />
    <Rect x={5} y={-3} width={35} height={12} fill="#3a9a3a" opacity={0.3} />
    <Text x={-30} y={-14} text="Hello World!" fontSize={6} fill="#4aba4a" fontFamily="monospace" />
    <Text x={-30} y={0} text="LCD 16x2     " fontSize={6} fill="#4aba4a" fontFamily="monospace" />
    {Array.from({ length: 6 }, (_, i) => (
      <Line
        key={`lcd-pin-${i}`}
        points={[-25 + i * 10, 32, -25 + i * 10, 40]}
        stroke="#bbb"
        strokeWidth={1.5}
      />
    ))}
  </Group>
));

const ShiftRegisterBody: React.FC = React.memo(() => (
  <Group>
    <Rect x={-28} y={-30} width={56} height={60} fill="#222" cornerRadius={3} stroke="#444" strokeWidth={1} />
    <Arc x={-28} y={-30} outerRadius={6} innerRadius={0} angle={90} rotation={180} fill="#222" stroke="#444" strokeWidth={1} />
    <Circle x={-20} y={-22} radius={3} fill="#333" stroke="#555" strokeWidth={0.5} />
    <Text x={-14} y={-6} text="74HC" fontSize={6} fill="#aaa" fontFamily="monospace" />
    <Text x={-14} y={2} text="595" fontSize={6} fill="#aaa" fontFamily="monospace" />
    {Array.from({ length: 8 }, (_, i) => (
      <Line key={`sr-l-${i}`} points={[-35, -24 + i * 8, -28, -24 + i * 8]} stroke="#bbb" strokeWidth={1.5} />
    ))}
    {Array.from({ length: 8 }, (_, i) => (
      <Line key={`sr-r-${i}`} points={[28, -24 + i * 8, 35, -24 + i * 8]} stroke="#bbb" strokeWidth={1.5} />
    ))}
  </Group>
));

const TransistorBody: React.FC = React.memo(() => (
  <Group>
    <Line points={[-10, 28, -10, 14]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[0, 28, 0, 14]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[10, 28, 10, 14]} stroke="#bbb" strokeWidth={1.5} />
    <Rect x={-12} y={-12} width={24} height={26} fill="#222" cornerRadius={[0, 12, 12, 0]} stroke="#444" strokeWidth={0.5} />
    <Line points={[-12, -12, -12, 14]} stroke="#555" strokeWidth={2} />
    <Text x={-7} y={-2} text="NPN" fontSize={6} fill="#aaa" fontFamily="monospace" />
  </Group>
));

const DiodeBody: React.FC = React.memo(() => (
  <Group>
    <Line points={[-50, 0, -30, 0]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[30, 0, 50, 0]} stroke="#bbb" strokeWidth={1.5} />
    <Rect x={-30} y={-6} width={60} height={12} fill="#c8e0c8" cornerRadius={6} stroke="#90b090" strokeWidth={1} />
    <Rect x={18} y={-6} width={12} height={12} fill="#999" cornerRadius={[6, 6, 6, 6]} stroke="#777" strokeWidth={0.5} />
    <Rect x={15} y={-7} width={3} height={14} fill="#fff" stroke="#ccc" strokeWidth={0.5} opacity={0.5} />
  </Group>
));

const CapacitorBody: React.FC = React.memo(() => (
  <Group>
    <Line points={[-6, 32, -6, 12]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[6, 32, 6, 12]} stroke="#bbb" strokeWidth={1.5} />
    <Rect x={-8} y={-20} width={16} height={32} fill="#2222aa" cornerRadius={3} stroke="#1111aa" strokeWidth={1} />
    <Rect x={-6} y={-16} width={12} height={4} fill="#3333cc" />
    <Text x={-4} y={-10} text="+" fontSize={7} fill="#ccc" fontFamily="monospace" />
    <Text x={-5} y={-2} text="100" fontSize={5} fill="#aaa" fontFamily="monospace" />
    <Text x={-6} y={4} text="uF" fontSize={5} fill="#aaa" fontFamily="monospace" />
    <Line points={[-8, -8, 8, -8]} stroke="#4444cc" strokeWidth={1} />
  </Group>
));

const UsbConnectorBody: React.FC = React.memo(() => (
  <Group>
    <Line points={[-8, 28, -8, 15]} stroke="#bbb" strokeWidth={1.5} />
    <Line points={[8, 28, 8, 15]} stroke="#bbb" strokeWidth={1.5} />
    <Rect x={-15} y={-18} width={30} height={33} fill="#888" cornerRadius={2} stroke="#666" strokeWidth={1} />
    <Rect x={-12} y={-22} width={24} height={10} fill="#999" cornerRadius={[4, 4, 0, 0]} stroke="#777" strokeWidth={1} />
    <Rect x={-8} y={-20} width={16} height={6} fill="#666" />
    <Circle x={8} y={-8} radius={2.5} fill="#00ff00" shadowColor="#00ff00" shadowBlur={4} shadowOpacity={0.6} />
    <Text x={-8} y={4} text="USB" fontSize={6} fill="#444" fontFamily="monospace" />
    <Text x={-8} y={12} text="5V" fontSize={7} fill="#444" fontFamily="monospace" fontStyle="bold" />
  </Group>
));

const GenericBody: React.FC<{ label: string }> = React.memo(({ label }) => (
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
));

/* ------------------------------------------------------------------ */
/*  PROTOBOARD BODY                                                    */
/* ------------------------------------------------------------------ */

const ProtoboardBody: React.FC<{
  componentId: string;
  onPinClick: (componentId: string, pinId: string) => void;
}> = React.memo(({ componentId, onPinClick }) => {
  const handleHoleClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const name = e.target.name();
      if (name && (name.startsWith("hole-") || name.startsWith("rail-"))) {
        onPinClick(componentId, name);
      }
    },
    [componentId, onPinClick],
  );

  const holeR = 2.8;
  const holeFill = "#555";
  const holeStroke = "#444";
  const holeStrokeW = 0.3;

  return (
    <Group onClick={handleHoleClick}>
      <Rect
        x={-200}
        y={-140}
        width={400}
        height={280}
        fill="#f5f0e6"
        cornerRadius={4}
        stroke="#d5d0c6"
        strokeWidth={1}
        shadowColor="#000"
        shadowBlur={6}
        shadowOpacity={0.12}
      />
      <Circle x={-185} y={-125} radius={5} fill="#b0a898" stroke="#908878" strokeWidth={0.5} />
      <Circle x={185} y={-125} radius={5} fill="#b0a898" stroke="#908878" strokeWidth={0.5} />
      <Circle x={-185} y={125} radius={5} fill="#b0a898" stroke="#908878" strokeWidth={0.5} />
      <Circle x={185} y={125} radius={5} fill="#b0a898" stroke="#908878" strokeWidth={0.5} />

      <Line points={[-160, -123, 176, -123]} stroke="#cc0000" strokeWidth={1.5} />
      <Line points={[-160, -103, 176, -103]} stroke="#0044cc" strokeWidth={1.5} />
      <Text x={-178} y={-125} text="+" fontSize={8} fill="#cc0000" fontFamily="monospace" fontStyle="bold" />
      <Text x={-178} y={-110} text="-" fontSize={8} fill="#0044cc" fontFamily="monospace" fontStyle="bold" />

      {PROTOBOARD_RAIL_TOP_HOLES.map((h) => (
        <Circle
          key={h.id}
          x={h.x}
          y={h.y}
          radius={holeR}
          fill={h.type === "power" ? "#cc4444" : holeFill}
          stroke={holeStroke}
          strokeWidth={holeStrokeW}
          name={h.id}
          hitStrokeWidth={8}
        />
      ))}

      {PROTOBOARD_ROWS_TOP.map((row, ri) => (
        <Text
          key={`lbl-top-${row}`}
          x={-178}
          y={PROTOBOARD_ROW_Y_TOP[ri] - 4}
          text={row}
          fontSize={7}
          fill="#888"
          fontFamily="monospace"
        />
      ))}

      {PROTOBOARD_GRID_TOP_HOLES.map((h) => (
        <Circle
          key={h.id}
          x={h.x}
          y={h.y}
          radius={holeR}
          fill={holeFill}
          stroke={holeStroke}
          strokeWidth={holeStrokeW}
          name={h.id}
          hitStrokeWidth={8}
        />
      ))}

      {Array.from({ length: PROTOBOARD_COL_COUNT }, (_, i) => (
        <Text
          key={`col-${i}`}
          x={PROTOBOARD_COL_START_X + i * PROTOBOARD_COL_SPACING - 3}
          y={-83}
          text={`${i + 1}`}
          fontSize={5}
          fill="#999"
          fontFamily="monospace"
        />
      ))}

      <Rect
        x={-175}
        y={-8}
        width={350}
        height={16}
        fill="#e8e0d0"
        stroke="#d5d0c6"
        strokeWidth={0.5}
        cornerRadius={2}
      />
      <Rect
        x={-175}
        y={-5}
        width={350}
        height={10}
        fill="#e0d8c8"
        cornerRadius={1}
      />

      {PROTOBOARD_ROWS_BOT.map((row, ri) => (
        <Text
          key={`lbl-bot-${row}`}
          x={-178}
          y={PROTOBOARD_ROW_Y_BOT[ri] - 4}
          text={row}
          fontSize={7}
          fill="#888"
          fontFamily="monospace"
        />
      ))}

      {PROTOBOARD_GRID_BOT_HOLES.map((h) => (
        <Circle
          key={h.id}
          x={h.x}
          y={h.y}
          radius={holeR}
          fill={holeFill}
          stroke={holeStroke}
          strokeWidth={holeStrokeW}
          name={h.id}
          hitStrokeWidth={8}
        />
      ))}

      <Line points={[-160, 103, 176, 103]} stroke="#0044cc" strokeWidth={1.5} />
      <Line points={[-160, 123, 176, 123]} stroke="#cc0000" strokeWidth={1.5} />
      <Text x={-178} y={101} text="-" fontSize={8} fill="#0044cc" fontFamily="monospace" fontStyle="bold" />
      <Text x={-178} y={116} text="+" fontSize={8} fill="#cc0000" fontFamily="monospace" fontStyle="bold" />

      {PROTOBOARD_RAIL_BOT_HOLES.map((h) => (
        <Circle
          key={h.id}
          x={h.x}
          y={h.y}
          radius={holeR}
          fill={h.type === "power" ? "#cc4444" : holeFill}
          stroke={holeStroke}
          strokeWidth={holeStrokeW}
          name={h.id}
          hitStrokeWidth={8}
        />
      ))}
    </Group>
  );
});

/* ------------------------------------------------------------------ */
/*  ComponentVisual                                                    */
/* ------------------------------------------------------------------ */

const ComponentVisual: React.FC<{
  type: string;
  state: Record<string, unknown>;
  componentId?: string;
  onPinClick?: (componentId: string, pinId: string) => void;
}> = React.memo(({ type, state, componentId, onPinClick }) => {
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
    case "buzzer":
      return <BuzzerBody />;
    case "rgb-led":
      return <RgbLedBody state={state} />;
    case "dc-motor":
      return <DcMotorBody />;
    case "photoresistor":
      return <PhotoresistorBody />;
    case "temperature-sensor":
      return <TemperatureSensorBody />;
    case "lcd-display":
      return <LcdDisplayBody />;
    case "shift-register":
      return <ShiftRegisterBody />;
    case "transistor":
      return <TransistorBody />;
    case "diode":
      return <DiodeBody />;
    case "capacitor":
      return <CapacitorBody />;
    case "usb-connector":
      return <UsbConnectorBody />;
    case "protoboard":
      if (componentId && onPinClick) {
        return (
          <ProtoboardBody componentId={componentId} onPinClick={onPinClick} />
        );
      }
      return (
        <ProtoboardBody
          componentId=""
          onPinClick={() => {}}
        />
      );
    default:
      return <GenericBody label={type} />;
  }
});

/* ------------------------------------------------------------------ */
/*  PinPoint                                                           */
/* ------------------------------------------------------------------ */

const PinPoint: React.FC<{
  pin: PinConnectionPoint;
  componentId: string;
  onPinClick: (componentId: string, pinId: string) => void;
  onPinHover: (componentId: string, pinId: string | null) => void;
}> = React.memo(({ pin, componentId, onPinClick, onPinHover }) => {
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
});

/* ------------------------------------------------------------------ */
/*  Selection rect helper                                              */
/* ------------------------------------------------------------------ */

function getSelectionBounds(
  type: string,
): { x: number; y: number; w: number; h: number } {
  switch (type) {
    case "arduino-uno":
      return { x: -155, y: -120, w: 310, h: 240 };
    case "protoboard":
      return { x: -205, y: -145, w: 410, h: 290 };
    case "led":
      return { x: -18, y: -25, w: 36, h: 75 };
    case "rgb-led":
      return { x: -18, y: -28, w: 36, h: 80 };
    case "resistor":
      return { x: -55, y: -15, w: 110, h: 30 };
    case "pushbutton":
      return { x: -28, y: -22, w: 56, h: 44 };
    case "potentiometer":
      return { x: -25, y: -30, w: 50, h: 65 };
    case "servo":
      return { x: -30, y: -25, w: 60, h: 70 };
    case "buzzer":
      return { x: -18, y: -20, w: 36, h: 54 };
    case "dc-motor":
      return { x: -22, y: -28, w: 44, h: 65 };
    case "photoresistor":
      return { x: -18, y: -20, w: 36, h: 54 };
    case "temperature-sensor":
      return { x: -18, y: -18, w: 36, h: 52 };
    case "lcd-display":
      return { x: -50, y: -32, w: 100, h: 78 };
    case "shift-register":
      return { x: -40, y: -35, w: 80, h: 70 };
    case "transistor":
      return { x: -18, y: -18, w: 36, h: 52 };
    case "diode":
      return { x: -55, y: -12, w: 110, h: 24 };
    case "capacitor":
      return { x: -14, y: -25, w: 28, h: 62 };
    case "usb-connector":
      return { x: -18, y: -28, w: 36, h: 62 };
    default:
      return { x: -40, y: -25, w: 80, h: 55 };
  }
}

/* ------------------------------------------------------------------ */
/*  ComponentItem (exported)                                           */
/* ------------------------------------------------------------------ */

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

  const isProtoboard = component.type === "protoboard";
  const sel = selected ? getSelectionBounds(component.type) : null;

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
      {isProtoboard ? (
        <ProtoboardBody componentId={component.id} onPinClick={onPinClick} />
      ) : (
        <ComponentVisual
          type={component.type}
          state={component.state}
          componentId={component.id}
          onPinClick={onPinClick}
        />
      )}
      {!isProtoboard &&
        pins.map((pin) => (
          <PinPoint
            key={pin.id}
            pin={pin}
            componentId={component.id}
            onPinClick={onPinClick}
            onPinHover={onPinHover}
          />
        ))}
      {sel && (
        <Rect
          x={sel.x}
          y={sel.y}
          width={sel.w}
          height={sel.h}
          stroke="#4488ff"
          strokeWidth={1.5}
          dash={[6, 4]}
          listening={false}
        />
      )}
    </Group>
  );
};
