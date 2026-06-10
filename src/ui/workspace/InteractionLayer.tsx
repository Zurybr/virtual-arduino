import React, { useCallback } from "react";
import { Rect, Group } from "react-konva";
import type Konva from "konva";
import type { PlacedComponent, PinConnectionPoint, InteractionMode } from "./types";

interface InteractionLayerProps {
  stageX: number;
  stageY: number;
  scale: number;
  components: PlacedComponent[];
  componentPins: Record<string, PinConnectionPoint[]>;
  mode: InteractionMode;
  selectedIds: string[];
  wireDrawing: {
    startComponentId: string;
    startPinId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
  rubberBand: { x1: number; y1: number; x2: number; y2: number } | null;
  ghostComponent: { type: string; x: number; y: number } | null;
  onStageMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onStageMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

export const InteractionLayer: React.FC<InteractionLayerProps> = ({
  stageX,
  stageY,
  scale,
  ghostComponent,
  rubberBand,
}) => {
  const toScreen = useCallback(
    (wx: number, wy: number) => ({
      sx: wx * scale + stageX,
      sy: wy * scale + stageY,
    }),
    [scale, stageX, stageY],
  );

  return (
    <Group listening={false}>
      {rubberBand && (() => {
        const p1 = toScreen(rubberBand.x1, rubberBand.y1);
        const p2 = toScreen(rubberBand.x2, rubberBand.y2);
        return (
          <Rect
            x={Math.min(p1.sx, p2.sx)}
            y={Math.min(p1.sy, p2.sy)}
            width={Math.abs(p2.sx - p1.sx)}
            height={Math.abs(p2.sy - p1.sy)}
            fill="rgba(68,136,255,0.1)"
            stroke="#4488ff"
            strokeWidth={1}
            dash={[4, 4]}
          />
        );
      })()}
      {ghostComponent && (() => {
        const pos = toScreen(ghostComponent.x, ghostComponent.y);
        return (
          <Group x={pos.sx} y={pos.sy} scaleX={scale} scaleY={scale} opacity={0.5}>
            <Rect
              x={-30}
              y={-20}
              width={60}
              height={40}
              fill="#3c3c3c"
              cornerRadius={4}
              stroke="#4488ff"
              strokeWidth={1}
              dash={[4, 3]}
            />
          </Group>
        );
      })()}
    </Group>
  );
};
