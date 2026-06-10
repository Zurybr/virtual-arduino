import React, { useMemo } from "react";
import { Circle, Group } from "react-konva";
import { GRID_SPACING, DOT_RADIUS } from "./types";

interface DotGridProps {
  stageWidth: number;
  stageHeight: number;
  stageX: number;
  stageY: number;
  scale: number;
}

export const DotGrid: React.FC<DotGridProps> = React.memo(
  ({ stageWidth, stageHeight, stageX, stageY, scale }) => {
    const dots = useMemo(() => {
      let spacing = GRID_SPACING;
      if (scale < 0.25) {
        spacing = GRID_SPACING * 4;
      } else if (scale < 0.5) {
        spacing = GRID_SPACING * 2;
      }

      const effectiveRadius = DOT_RADIUS / scale;

      const topLeftX = -stageX / scale;
      const topLeftY = -stageY / scale;
      const bottomRightX = (stageWidth - stageX) / scale;
      const bottomRightY = (stageHeight - stageY) / scale;

      const startX = Math.floor(topLeftX / spacing) * spacing;
      const startY = Math.floor(topLeftY / spacing) * spacing;
      const endX = Math.ceil(bottomRightX / spacing) * spacing;
      const endY = Math.ceil(bottomRightY / spacing) * spacing;

      const result: Array<{ x: number; y: number; key: string }> = [];

      for (let x = startX; x <= endX; x += spacing) {
        for (let y = startY; y <= endY; y += spacing) {
          result.push({ x, y, key: `${x},${y}` });
        }
      }

      return { result, effectiveRadius };
    }, [stageWidth, stageHeight, stageX, stageY, scale]);

    return (
      <Group>
        {dots.result.map((dot) => (
          <Circle
            key={dot.key}
            x={dot.x}
            y={dot.y}
            radius={dots.effectiveRadius}
            fill="#333333"
            perfectDrawEnabled={false}
            listening={false}
          />
        ))}
      </Group>
    );
  },
);

DotGrid.displayName = "DotGrid";
