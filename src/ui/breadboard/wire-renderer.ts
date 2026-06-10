import { GridCoord } from "../../types";

const GRID_SIZE = 10;
const WIRE_WIDTH = 3;
const OVERLAP_OFFSET = 4;
const PREVIEW_DASH = [6, 4];
const PREVIEW_ALPHA = 0.5;

export class WireRenderer {
  private wireOffsets: Map<string, number> = new Map();

  drawWire(
    ctx: CanvasRenderingContext2D,
    path: GridCoord[],
    color: string,
  ): void {
    if (path.length < 2) return;

    const route = path.length === 2
      ? this.calculateManhattanRoute(path[0], path[1])
      : path;

    const offset = this.getWireOffset(route);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = WIRE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    const first = route[0];
    ctx.moveTo(first.col * GRID_SIZE + offset, first.row * GRID_SIZE + offset);

    for (let i = 1; i < route.length; i++) {
      const pt = route[i];
      ctx.lineTo(pt.col * GRID_SIZE + offset, pt.row * GRID_SIZE + offset);
    }
    ctx.stroke();

    this.drawEndpoint(ctx, route[0], color, offset);
    this.drawEndpoint(ctx, route[route.length - 1], color, offset);
    ctx.restore();
  }

  drawWirePreview(
    ctx: CanvasRenderingContext2D,
    start: GridCoord,
    current: GridCoord,
  ): void {
    const route = this.calculateManhattanRoute(start, current);

    ctx.save();
    ctx.globalAlpha = PREVIEW_ALPHA;
    ctx.strokeStyle = "#4488ff";
    ctx.lineWidth = WIRE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(PREVIEW_DASH);

    ctx.beginPath();
    ctx.moveTo(start.col * GRID_SIZE, start.row * GRID_SIZE);

    for (let i = 1; i < route.length; i++) {
      const pt = route[i];
      ctx.lineTo(pt.col * GRID_SIZE, pt.row * GRID_SIZE);
    }
    ctx.stroke();
    ctx.restore();
  }

  calculateManhattanRoute(start: GridCoord, end: GridCoord): GridCoord[] {
    if (start.row === end.row && start.col === end.col) {
      return [{ ...start }];
    }

    if (start.row === end.row || start.col === end.col) {
      return [{ ...start }, { ...end }];
    }

    const dx = Math.abs(end.col - start.col);
    const dy = Math.abs(end.row - start.row);

    if (dx > dy) {
      return [
        { ...start },
        { row: start.row, col: end.col },
        { ...end },
      ];
    }

    return [
      { ...start },
      { row: end.row, col: start.col },
      { ...end },
    ];
  }

  private getWireOffset(route: GridCoord[]): number {
    const key = route
      .map((p) => `${p.row},${p.col}`)
      .join("|");
    const count = this.wireOffsets.get(key) ?? 0;
    this.wireOffsets.set(key, count + 1);
    return count * OVERLAP_OFFSET;
  }

  private drawEndpoint(
    ctx: CanvasRenderingContext2D,
    coord: GridCoord,
    color: string,
    offset: number,
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      coord.col * GRID_SIZE + offset,
      coord.row * GRID_SIZE + offset,
      WIRE_WIDTH + 1,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  resetOffsets(): void {
    this.wireOffsets.clear();
  }
}
