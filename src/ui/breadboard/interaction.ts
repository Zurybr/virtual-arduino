import { GridCoord, PinRef } from "../../types";
import { Wire } from "../../simulation/core/wire";

const BREADBOARD_ROWS = 11;
const BREADBOARD_COLS = 30;
const NOTCH_ROW = 5;
const HOLE_SPACING = 20;

type ComponentDragState = "idle" | "dragging" | "placing" | "placed";
type WireDrawState = "idle" | "wireStarted" | "wirePreview" | "wireComplete";

function coordKey(coord: GridCoord): string {
  return `${coord.row},${coord.col}`;
}

export function snapToGrid(x: number, y: number): GridCoord {
  const col = Math.round(x / HOLE_SPACING);
  const row = Math.round(y / HOLE_SPACING);
  return {
    row: Math.max(0, Math.min(BREADBOARD_ROWS - 1, row)),
    col: Math.max(0, Math.min(BREADBOARD_COLS - 1, col)),
  };
}

export function isValidPlacement(grid: GridCoord): boolean {
  if (grid.row === NOTCH_ROW) return false;
  if (grid.row < 0 || grid.row >= BREADBOARD_ROWS) return false;
  if (grid.col < 0 || grid.col >= BREADBOARD_COLS) return false;
  return true;
}

export class InteractionManager {
  private componentState: ComponentDragState = "idle";
  private wireState: WireDrawState = "idle";
  private dragComponentType: string | null = null;
  private ghostPosition: GridCoord | null = null;
  private ghostValid = false;
  private occupiedPositions: Set<string> = new Set();
  private wireStartCoord: GridCoord | null = null;
  private wireStartPin: PinRef | null = null;
  private wirePreviewCoord: GridCoord | null = null;
  private wireIdCounter = 0;

  onComponentPlaced: ((componentType: string, position: GridCoord) => void) | null = null;
  onWireCreated:
    | ((wire: { startPin: PinRef; endPin: PinRef; path: GridCoord[] }) => void)
    | null = null;
  onPreviewUpdate: ((position: GridCoord | null) => void) | null = null;

  startDrag(componentType: string, event: PointerEvent): void {
    if (this.componentState !== "idle") return;
    this.componentState = "dragging";
    this.dragComponentType = componentType;
    const grid = snapToGrid(event.offsetX, event.offsetY);
    this.updateGhostPosition(grid);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.componentState === "dragging" || this.componentState === "placing") {
      this.componentState = "placing";
      const grid = snapToGrid(event.offsetX, event.offsetY);
      this.updateGhostPosition(grid);
    }

    if (this.wireState === "wireStarted" || this.wireState === "wirePreview") {
      this.wireState = "wirePreview";
      const grid = snapToGrid(event.offsetX, event.offsetY);
      this.updateWirePreview(grid);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.componentState === "placing" || this.componentState === "dragging") {
      const grid = snapToGrid(event.offsetX, event.offsetY);
      if (this.isValidForPlacement(grid)) {
        this.componentState = "placed";
        this.occupyPosition(grid);
        if (this.dragComponentType && this.onComponentPlaced) {
          this.onComponentPlaced(this.dragComponentType, grid);
        }
      }
      this.resetDrag();
    }
  }

  cancelDrag(): void {
    this.resetDrag();
  }

  startWire(startCoord: GridCoord, startPinRef: PinRef): void {
    if (this.wireState !== "idle") return;
    this.wireState = "wireStarted";
    this.wireStartCoord = { ...startCoord };
    this.wireStartPin = { ...startPinRef };
    this.wirePreviewCoord = null;
  }

  updateWirePreview(currentCoord: GridCoord): void {
    if (this.wireState !== "wireStarted" && this.wireState !== "wirePreview") return;
    this.wireState = "wirePreview";
    this.wirePreviewCoord = { ...currentCoord };
    if (this.onPreviewUpdate) {
      this.onPreviewUpdate(this.wirePreviewCoord);
    }
  }

  completeWire(endCoord: GridCoord, endPinRef: PinRef): Wire | null {
    if (this.wireState !== "wirePreview" || !this.wireStartCoord || !this.wireStartPin) {
      this.resetWire();
      return null;
    }

    const isSelfConnect =
      this.wireStartPin.parentId === endPinRef.parentId &&
      this.wireStartPin.pinId === endPinRef.pinId &&
      this.wireStartPin.parentType === endPinRef.parentType;

    if (isSelfConnect) {
      this.resetWire();
      return null;
    }

    const path = Wire.createManhattanPath(this.wireStartCoord, endCoord);
    const id = `wire-${++this.wireIdCounter}-${Date.now()}`;
    const wire = new Wire(id, { ...this.wireStartPin }, { ...endPinRef }, path, "#ff0000");

    try {
      wire.validate();
    } catch {
      this.resetWire();
      return null;
    }

    if (this.onWireCreated) {
      this.onWireCreated({
        startPin: wire.startPin,
        endPin: wire.endPin,
        path: wire.path,
      });
    }

    this.resetWire();
    return wire;
  }

  cancelWire(): void {
    this.resetWire();
  }

  markOccupied(coord: GridCoord): void {
    this.occupiedPositions.add(coordKey(coord));
  }

  markFree(coord: GridCoord): void {
    this.occupiedPositions.delete(coordKey(coord));
  }

  private updateGhostPosition(grid: GridCoord): void {
    this.ghostPosition = grid;
    this.ghostValid = this.isValidForPlacement(grid);
    if (this.onPreviewUpdate) {
      this.onPreviewUpdate(this.ghostValid ? grid : null);
    }
  }

  private isValidForPlacement(grid: GridCoord): boolean {
    return isValidPlacement(grid) && !this.occupiedPositions.has(coordKey(grid));
  }

  private occupyPosition(coord: GridCoord): void {
    this.occupiedPositions.add(coordKey(coord));
  }

  private resetDrag(): void {
    this.componentState = "idle";
    this.dragComponentType = null;
    this.ghostPosition = null;
    this.ghostValid = false;
    if (this.onPreviewUpdate) {
      this.onPreviewUpdate(null);
    }
  }

  private resetWire(): void {
    this.wireState = "idle";
    this.wireStartCoord = null;
    this.wireStartPin = null;
    this.wirePreviewCoord = null;
    if (this.onPreviewUpdate) {
      this.onPreviewUpdate(null);
    }
  }

  get isDragging(): boolean {
    return this.componentState === "dragging" || this.componentState === "placing";
  }

  get isDrawingWire(): boolean {
    return this.wireState === "wireStarted" || this.wireState === "wirePreview";
  }

  get currentGhostPosition(): GridCoord | null {
    return this.ghostPosition;
  }

  get currentGhostValid(): boolean {
    return this.ghostValid;
  }

  get currentWireStartCoord(): GridCoord | null {
    return this.wireStartCoord;
  }

  get currentWirePreviewCoord(): GridCoord | null {
    return this.wirePreviewCoord;
  }
}
