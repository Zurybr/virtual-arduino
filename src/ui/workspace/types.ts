export interface WorkspacePosition {
  x: number;
  y: number;
}

export interface PlacedComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  state: Record<string, unknown>;
}

export interface PinConnectionPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  type:
    | "power"
    | "ground"
    | "digital"
    | "analog"
    | "pwm"
    | "i2c"
    | "spi"
    | "uart";
  connected: boolean;
}

export interface Wire {
  id: string;
  startPin: { componentId: string; pinId: string };
  endPin: { componentId: string; pinId: string };
  color: string;
  points: number[];
}

export interface ProtoboardHolePosition {
  id: string;
  x: number;
  y: number;
  type: PinConnectionPoint["type"];
}

export const GRID_SPACING = 20;
export const DOT_RADIUS = 1.5;
export const PIN_RADIUS = 5;
export const PIN_HOVER_RADIUS = 8;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;

export type InteractionMode = "select" | "wire" | "pan";

export const PIN_COLORS: Record<string, string> = {
  power: "#e53935",
  ground: "#424242",
  digital: "#1e88e5",
  analog: "#43a047",
  pwm: "#8e24aa",
  i2c: "#00acc1",
  spi: "#f4511e",
  uart: "#6d4c41",
};

export function snapToGrid(value: number, spacing: number = GRID_SPACING): number {
  return Math.round(value / spacing) * spacing;
}

export function getConnectedHoles(holeId: string): string[] {
  const mainTopMatch = holeId.match(/^hole-([a-e])(\d+)$/);
  if (mainTopMatch) {
    const col = mainTopMatch[2];
    return ["a", "b", "c", "d", "e"]
      .map((r) => `hole-${r}${col}`)
      .filter((id) => id !== holeId);
  }

  const mainBotMatch = holeId.match(/^hole-([f-j])(\d+)$/);
  if (mainBotMatch) {
    const col = mainBotMatch[2];
    return ["f", "g", "h", "i", "j"]
      .map((r) => `hole-${r}${col}`)
      .filter((id) => id !== holeId);
  }

  const railMatch = holeId.match(/^rail-(top|bot)-(pos|neg)-(\d+)$/);
  if (railMatch) {
    const pos = railMatch[1];
    const pol = railMatch[2];
    return Array.from({ length: 25 }, (_, i) => `rail-${pos}-${pol}-${i + 1}`).filter(
      (id) => id !== holeId,
    );
  }

  return [];
}
