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
