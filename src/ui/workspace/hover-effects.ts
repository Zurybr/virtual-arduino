/**
 * Pure utility functions for Konva hover effects.
 * These functions mutate Konva node properties directly for performance —
 * they do NOT trigger React re-renders.
 *
 * REQ-005-01: Component hover glow (blue/cyan shadow)
 * REQ-005-02: Pin hover enlargement
 * REQ-005-03: Wire-drawing pin highlighting (green valid, red invalid)
 * REQ-005-05: Event-based detection (these are called from Konva events)
 */

import {
  HOVER_SHADOW,
  WIRE_MODE_VALID_COLOR,
  WIRE_MODE_INVALID_COLOR,
} from "./types";

const PIN_DEFAULT_RADIUS = 5;
const PIN_HOVER_RADIUS = 8;

// Minimal interface for any Konva-compatible node with shadow properties
interface KonvaNodeLike {
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  shadowEnabled: boolean;
}

// Minimal interface for a circle-like node
interface CircleLike {
  radius: number;
  stroke: string;
  fill: string;
  strokeWidth: number;
  _defaultStroke?: string;
  _defaultFill?: string;
}

/**
 * Apply hover glow to a component Group node.
 * Sets a blue/cyan shadow via Konva shadow properties.
 */
export function applyComponentHover(node: KonvaNodeLike): void {
  node.shadowColor = HOVER_SHADOW.color;
  node.shadowBlur = HOVER_SHADOW.blur;
  node.shadowOffsetX = HOVER_SHADOW.offset.x;
  node.shadowOffsetY = HOVER_SHADOW.offset.y;
  node.shadowOpacity = HOVER_SHADOW.opacity;
  node.shadowEnabled = true;
}

/**
 * Remove hover glow from a component Group node.
 */
export function removeComponentHover(node: KonvaNodeLike): void {
  node.shadowEnabled = false;
  node.shadowBlur = 0;
  node.shadowOpacity = 0;
}

/**
 * Apply hover enlargement to a pin Circle.
 * Enlarges radius and highlights stroke.
 */
export function applyPinHover(circle: CircleLike): void {
  circle.radius = PIN_HOVER_RADIUS;
  circle.stroke = "#ffffff";
  circle.strokeWidth = 2;
}

/**
 * Remove hover enlargement from a pin Circle.
 * Restores to default radius and original stroke color.
 */
export function removePinHover(circle: CircleLike): void {
  circle.radius = PIN_DEFAULT_RADIUS;
  circle.strokeWidth = 1;
  if (circle._defaultStroke) {
    circle.stroke = circle._defaultStroke;
  }
}

/**
 * Apply wire-drawing mode highlight to a pin Circle.
 * Green for valid targets, red for invalid.
 */
export function applyWireModeHighlight(circle: CircleLike, isValid: boolean): void {
  circle.fill = isValid ? WIRE_MODE_VALID_COLOR : WIRE_MODE_INVALID_COLOR;
  circle.strokeWidth = 3;
}

/**
 * Remove wire-drawing mode highlight from a pin Circle.
 * Restores default appearance.
 */
export function removeWireModeHighlight(circle: CircleLike): void {
  circle.radius = PIN_DEFAULT_RADIUS;
  circle.strokeWidth = 1;
  if (circle._defaultFill) {
    circle.fill = circle._defaultFill;
  }
  if (circle._defaultStroke) {
    circle.stroke = circle._defaultStroke;
  }
}
