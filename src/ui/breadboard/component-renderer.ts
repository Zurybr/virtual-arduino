interface ComponentData {
  type: string;
  x: number;
  y: number;
  rotation: number;
  state: Record<string, unknown>;
}

interface PinPosition {
  x: number;
  y: number;
}

export class ComponentRenderer {
  drawComponent(
    ctx: CanvasRenderingContext2D,
    component: ComponentData,
  ): void {
    ctx.save();
    ctx.translate(component.x, component.y);
    ctx.rotate((component.rotation * Math.PI) / 180);

    switch (component.type.toLowerCase()) {
      case "led":
        this.drawLed(ctx, component);
        break;
      case "resistor":
        this.drawResistor(ctx, component);
        break;
      default:
        this.drawGeneric(ctx, component);
        break;
    }

    ctx.restore();
  }

  private drawLed(
    ctx: CanvasRenderingContext2D,
    component: ComponentData,
  ): void {
    const isOn = component.state.on === true;
    const brightness = typeof component.state.brightness === "number"
      ? component.state.brightness
      : isOn
        ? 1
        : 0;
    const radius = 8;

    if (isOn && brightness > 0) {
      const gradient = ctx.createRadialGradient(
        0,
        0,
        radius * 0.5,
        0,
        0,
        radius * 3,
      );
      const color =
        typeof component.state.color === "string"
          ? component.state.color
          : "#ff0000";
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, "transparent");
      ctx.globalAlpha = brightness * 0.6;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = isOn
      ? typeof component.state.color === "string"
        ? (component.state.color as string)
        : "#ff0000"
      : "#880000";
    ctx.globalAlpha = isOn ? Math.max(0.3, brightness) : 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.lineTo(-radius, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(15, 0);
    ctx.stroke();

    ctx.fillStyle = "#999";
    ctx.beginPath();
    ctx.arc(-15, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(15, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawResistor(
    ctx: CanvasRenderingContext2D,
    component: ComponentData,
  ): void {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(-12, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    ctx.fillStyle = "#d4a574";
    ctx.fillRect(-12, -5, 24, 10);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(-12, -5, 24, 10);

    const bands =
      Array.isArray(component.state.bands) &&
      component.state.bands.length > 0
        ? component.state.bands
        : ["#ff0000", "#ff0000", "#000000", "#gold"];
    const bandWidth = 4;
    const bandSpacing = 24 / (bands.length + 1);
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i] as string;
      ctx.fillRect(
        -12 + bandSpacing * (i + 1) - bandWidth / 2,
        -5,
        bandWidth,
        10,
      );
    }

    ctx.fillStyle = "#999";
    ctx.beginPath();
    ctx.arc(-20, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGeneric(
    ctx: CanvasRenderingContext2D,
    component: ComponentData,
  ): void {
    const width = 30;
    const height = 20;

    ctx.fillStyle = "#555";
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.strokeRect(-width / 2, -height / 2, width, height);

    const label =
      typeof component.state.label === "string"
        ? component.state.label
        : component.type;
    ctx.fillStyle = "#fff";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0, width - 4);

    const pinCount =
      typeof component.state.pinCount === "number"
        ? component.state.pinCount
        : 2;
    const pinSpacing = width / (pinCount + 1);
    for (let i = 0; i < pinCount; i++) {
      const px = -width / 2 + pinSpacing * (i + 1);
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, height / 2);
      ctx.lineTo(px, height / 2 + 8);
      ctx.stroke();

      ctx.fillStyle = "#aaa";
      ctx.beginPath();
      ctx.arc(px, height / 2 + 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPinConnections(
    ctx: CanvasRenderingContext2D,
    pins: PinPosition[],
  ): void {
    if (pins.length < 2) return;

    ctx.strokeStyle = "#4488ff";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pins[0].x, pins[0].y);

    for (let i = 1; i < pins.length; i++) {
      const prev = pins[i - 1];
      const curr = pins[i];
      const midX = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(midX, prev.y, midX, curr.y, curr.x, curr.y);
    }
    ctx.stroke();

    for (const pin of pins) {
      ctx.fillStyle = "#4488ff";
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#2266dd";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
