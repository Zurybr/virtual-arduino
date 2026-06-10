export class ZoomPanManager {
  static readonly MIN_SCALE = 0.25;
  static readonly MAX_SCALE = 4.0;

  scale: number = 1.0;
  offsetX: number = 0;
  offsetY: number = 0;

  zoom(delta: number, centerX: number, centerY: number): void {
    const prevScale = this.scale;
    const zoomFactor = delta > 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.max(
      ZoomPanManager.MIN_SCALE,
      Math.min(ZoomPanManager.MAX_SCALE, prevScale * zoomFactor),
    );

    this.offsetX = centerX - (centerX - this.offsetX) * (newScale / prevScale);
    this.offsetY = centerY - (centerY - this.offsetY) * (newScale / prevScale);
    this.scale = newScale;
  }

  pan(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  screenToGrid(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - this.offsetX) / this.scale,
      y: (y - this.offsetY) / this.scale,
    };
  }

  gridToScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: x * this.scale + this.offsetX,
      y: y * this.scale + this.offsetY,
    };
  }

  reset(): void {
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  pinchZoom(delta: number, centerX: number, centerY: number): void {
    this.zoom(delta, centerX, centerY);
  }
}
