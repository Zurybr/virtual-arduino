import React from "react";
import { Group, Line } from "react-konva";
import type { Wire } from "./types";

interface WireLayerProps {
  wires: Wire[];
  previewWire: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null;
}

function buildBezierPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number[] {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const offset = Math.max(40, Math.min(dx, dy) * 0.5);

  let cx1: number, cy1: number, cx2: number, cy2: number;

  if (dx > dy) {
    cx1 = x1 + offset;
    cy1 = y1;
    cx2 = x2 - offset;
    cy2 = y2;
    if (x2 < x1) {
      cx1 = x1 - offset;
      cx2 = x2 + offset;
    }
  } else {
    cx1 = x1;
    cy1 = y1 + offset;
    cx2 = x2;
    cy2 = y2 - offset;
    if (y2 < y1) {
      cy1 = y1 - offset;
      cy2 = y2 + offset;
    }
  }

  return [x1, y1, cx1, cy1, cx2, cy2, x2, y2];
}

const WireItem: React.FC<{ wire: Wire }> = ({ wire }) => {
  if (wire.points.length >= 8) {
    return (
      <Group>
        <Line
          points={wire.points}
          bezier
          stroke="#000000"
          strokeWidth={6}
          lineCap="round"
          lineJoin="round"
          opacity={0.3}
          listening={false}
        />
        <Line
          points={wire.points}
          bezier
          stroke={wire.color}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      </Group>
    );
  }

  if (wire.points.length >= 4) {
    return (
      <Group>
        <Line
          points={wire.points}
          stroke="#000000"
          strokeWidth={6}
          lineCap="round"
          lineJoin="round"
          opacity={0.3}
          listening={false}
        />
        <Line
          points={wire.points}
          stroke={wire.color}
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      </Group>
    );
  }

  return null;
};

export const WireLayer: React.FC<WireLayerProps> = ({ wires, previewWire }) => {
  const previewPoints = previewWire
    ? buildBezierPoints(
        previewWire.start.x,
        previewWire.start.y,
        previewWire.end.x,
        previewWire.end.y,
      )
    : null;

  return (
    <Group>
      {wires.map((wire) => (
        <WireItem key={wire.id} wire={wire} />
      ))}
      {previewPoints && (
        <Line
          points={previewPoints}
          bezier
          stroke="#4488ff"
          strokeWidth={2}
          lineCap="round"
          lineJoin="round"
          dash={[8, 6]}
          opacity={0.6}
          listening={false}
        />
      )}
    </Group>
  );
};
