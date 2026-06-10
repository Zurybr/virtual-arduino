import { PinRef, GridCoord } from "../../types";

export class Wire {
  readonly id: string;
  readonly startPin: PinRef;
  readonly endPin: PinRef;
  path: GridCoord[];
  readonly color: string;

  constructor(id: string, startPin: PinRef, endPin: PinRef, path: GridCoord[], color: string) {
    this.id = id;
    this.startPin = startPin;
    this.endPin = endPin;
    this.path = path;
    this.color = color;
  }

  validate(): void {
    if (
      this.startPin.parentId === this.endPin.parentId &&
      this.startPin.pinId === this.endPin.pinId &&
      this.startPin.parentType === this.endPin.parentType
    ) {
      throw new Error("Wire start and end pins cannot be the same");
    }
    if (!this.startPin.pinId || !this.startPin.parentId) {
      throw new Error("Wire start pin reference is invalid");
    }
    if (!this.endPin.pinId || !this.endPin.parentId) {
      throw new Error("Wire end pin reference is invalid");
    }
  }

  static createManhattanPath(start: GridCoord, end: GridCoord): GridCoord[] {
    if (start.row === end.row || start.col === end.col) {
      return [{ ...start }, { ...end }];
    }

    const colDiff = Math.abs(end.col - start.col);
    const rowDiff = Math.abs(end.row - start.row);

    if (colDiff >= rowDiff) {
      const mid: GridCoord = { row: start.row, col: end.col };
      return [{ ...start }, mid, { ...end }];
    }

    const mid: GridCoord = { row: end.row, col: start.col };
    return [{ ...start }, mid, { ...end }];
  }
}
