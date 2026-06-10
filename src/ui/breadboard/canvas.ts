export const HOLE_SPACING = 10;
export const HOLE_RADIUS = 2.5;
export const MARGIN = 20;
export const TERMINAL_ROWS_LEFT = ["a", "b", "c", "d", "e"];
export const TERMINAL_ROWS_RIGHT = ["f", "g", "h", "i", "j"];
export const NUM_COLS = 63;
export const POWER_RAIL_COLS = 50;
export const NOTCH_HEIGHT = 20;

export const BOARD_WIDTH = MARGIN * 2 + (NUM_COLS - 1) * HOLE_SPACING;
export const BOARD_HEIGHT =
  MARGIN * 2 +
  POWER_RAIL_COLS * 0 +
  TERMINAL_ROWS_LEFT.length * HOLE_SPACING +
  NOTCH_HEIGHT +
  TERMINAL_ROWS_RIGHT.length * HOLE_SPACING +
  4 * HOLE_SPACING +
  10;

const POWER_RAIL_ROWS_TOP = 2;
const POWER_RAIL_GAP = 5;

export const SECTION_OFFSETS = {
  powerTopStart: MARGIN,
  terminalLeftStart:
    MARGIN + POWER_RAIL_ROWS_TOP * HOLE_SPACING + POWER_RAIL_GAP,
  notchStart:
    MARGIN +
    POWER_RAIL_ROWS_TOP * HOLE_SPACING +
    POWER_RAIL_GAP +
    TERMINAL_ROWS_LEFT.length * HOLE_SPACING,
  terminalRightStart:
    MARGIN +
    POWER_RAIL_ROWS_TOP * HOLE_SPACING +
    POWER_RAIL_GAP +
    TERMINAL_ROWS_LEFT.length * HOLE_SPACING +
    NOTCH_HEIGHT,
  powerBottomStart:
    MARGIN +
    POWER_RAIL_ROWS_TOP * HOLE_SPACING +
    POWER_RAIL_GAP +
    TERMINAL_ROWS_LEFT.length * HOLE_SPACING +
    NOTCH_HEIGHT +
    TERMINAL_ROWS_RIGHT.length * HOLE_SPACING +
    POWER_RAIL_GAP,
};

export function gridToPixel(
  row: string,
  col: number,
): { x: number; y: number } {
  const x = MARGIN + (col - 1) * HOLE_SPACING;

  const rowLower = row.toLowerCase();
  const allTerminalRows = [
    ...TERMINAL_ROWS_LEFT,
    ...TERMINAL_ROWS_RIGHT,
  ];
  const idx = allTerminalRows.indexOf(rowLower);

  if (idx >= 0 && idx < TERMINAL_ROWS_LEFT.length) {
    const y = SECTION_OFFSETS.terminalLeftStart + idx * HOLE_SPACING;
    return { x, y };
  }

  if (idx >= TERMINAL_ROWS_LEFT.length) {
    const rightIdx = idx - TERMINAL_ROWS_LEFT.length;
    const y = SECTION_OFFSETS.terminalRightStart + rightIdx * HOLE_SPACING;
    return { x, y };
  }

  if (row === "+" || row === "top+") {
    const y = SECTION_OFFSETS.powerTopStart;
    return { x, y };
  }
  if (row === "-" || row === "top-") {
    const y = SECTION_OFFSETS.powerTopStart + HOLE_SPACING;
    return { x, y };
  }
  if (row === "bot+" || row === "bottom+") {
    const y = SECTION_OFFSETS.powerBottomStart;
    return { x, y };
  }
  if (row === "bot-" || row === "bottom-") {
    const y = SECTION_OFFSETS.powerBottomStart + HOLE_SPACING;
    return { x, y };
  }

  return { x: MARGIN, y: MARGIN };
}

export function pixelToGrid(
  x: number,
  y: number,
): { row: string; col: number } | null {
  const col = Math.round((x - MARGIN) / HOLE_SPACING) + 1;
  if (col < 1 || col > NUM_COLS) return null;

  for (let i = 0; i < TERMINAL_ROWS_LEFT.length; i++) {
    const rowY = SECTION_OFFSETS.terminalLeftStart + i * HOLE_SPACING;
    if (Math.abs(y - rowY) < HOLE_SPACING / 2) {
      return { row: TERMINAL_ROWS_LEFT[i], col };
    }
  }

  for (let i = 0; i < TERMINAL_ROWS_RIGHT.length; i++) {
    const rowY = SECTION_OFFSETS.terminalRightStart + i * HOLE_SPACING;
    if (Math.abs(y - rowY) < HOLE_SPACING / 2) {
      return { row: TERMINAL_ROWS_RIGHT[i], col };
    }
  }

  const topPlusY = SECTION_OFFSETS.powerTopStart;
  if (Math.abs(y - topPlusY) < HOLE_SPACING / 2) {
    return { row: "top+", col };
  }
  const topMinusY = SECTION_OFFSETS.powerTopStart + HOLE_SPACING;
  if (Math.abs(y - topMinusY) < HOLE_SPACING / 2) {
    return { row: "top-", col };
  }
  const botPlusY = SECTION_OFFSETS.powerBottomStart;
  if (Math.abs(y - botPlusY) < HOLE_SPACING / 2) {
    return { row: "bot+", col };
  }
  const botMinusY = SECTION_OFFSETS.powerBottomStart + HOLE_SPACING;
  if (Math.abs(y - botMinusY) < HOLE_SPACING / 2) {
    return { row: "bot-", col };
  }

  return null;
}

export function snapToGrid(
  x: number,
  y: number,
): { x: number; y: number } {
  const coord = pixelToGrid(x, y);
  if (!coord) return { x, y };
  return gridToPixel(coord.row, coord.col);
}

let cachedCanvas: HTMLCanvasElement | null = null;

export function createBreadboardBackground(
  width: number,
  height: number,
): HTMLCanvasElement {
  if (cachedCanvas) return cachedCanvas;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f5f5dc";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  const notchY = SECTION_OFFSETS.notchStart;
  const notchXStart = MARGIN - 5;
  const notchXEnd = MARGIN + (NUM_COLS - 1) * HOLE_SPACING + 5;
  ctx.fillStyle = "#333";
  ctx.fillRect(notchXStart, notchY, notchXEnd - notchXStart, NOTCH_HEIGHT);

  ctx.fillStyle = "#404040";
  for (const row of TERMINAL_ROWS_LEFT) {
    const rowIdx = TERMINAL_ROWS_LEFT.indexOf(row);
    const y = SECTION_OFFSETS.terminalLeftStart + rowIdx * HOLE_SPACING;
    for (let col = 0; col < NUM_COLS; col++) {
      const x = MARGIN + col * HOLE_SPACING;
      ctx.beginPath();
      ctx.arc(x, y, HOLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const row of TERMINAL_ROWS_RIGHT) {
    const rowIdx = TERMINAL_ROWS_RIGHT.indexOf(row);
    const y = SECTION_OFFSETS.terminalRightStart + rowIdx * HOLE_SPACING;
    for (let col = 0; col < NUM_COLS; col++) {
      const x = MARGIN + col * HOLE_SPACING;
      ctx.beginPath();
      ctx.arc(x, y, HOLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (let col = 0; col < NUM_COLS; col++) {
    const x = MARGIN + col * HOLE_SPACING;

    ctx.fillStyle = "#cc0000";
    ctx.beginPath();
    ctx.arc(
      x,
      SECTION_OFFSETS.powerTopStart,
      HOLE_RADIUS,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(
      x,
      SECTION_OFFSETS.powerTopStart + HOLE_SPACING,
      HOLE_RADIUS,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "#cc0000";
    ctx.beginPath();
    ctx.arc(
      x,
      SECTION_OFFSETS.powerBottomStart,
      HOLE_RADIUS,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(
      x,
      SECTION_OFFSETS.powerBottomStart + HOLE_SPACING,
      HOLE_RADIUS,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  ctx.strokeStyle = "#cc0000";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MARGIN, SECTION_OFFSETS.powerTopStart - 5);
  ctx.lineTo(
    MARGIN + (NUM_COLS - 1) * HOLE_SPACING,
    SECTION_OFFSETS.powerTopStart - 5,
  );
  ctx.stroke();
  ctx.fillStyle = "#cc0000";
  ctx.font = "8px monospace";
  ctx.fillText("+", MARGIN - 12, SECTION_OFFSETS.powerTopStart + 3);

  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(MARGIN, SECTION_OFFSETS.powerTopStart + HOLE_SPACING + 5);
  ctx.lineTo(
    MARGIN + (NUM_COLS - 1) * HOLE_SPACING,
    SECTION_OFFSETS.powerTopStart + HOLE_SPACING + 5,
  );
  ctx.stroke();
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "−",
    MARGIN - 12,
    SECTION_OFFSETS.powerTopStart + HOLE_SPACING + 3,
  );

  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(MARGIN, SECTION_OFFSETS.powerBottomStart + HOLE_SPACING + 5);
  ctx.lineTo(
    MARGIN + (NUM_COLS - 1) * HOLE_SPACING,
    SECTION_OFFSETS.powerBottomStart + HOLE_SPACING + 5,
  );
  ctx.stroke();
  ctx.fillStyle = "#000000";
  ctx.fillText(
    "−",
    MARGIN - 12,
    SECTION_OFFSETS.powerBottomStart + HOLE_SPACING + 3,
  );

  ctx.strokeStyle = "#cc0000";
  ctx.beginPath();
  ctx.moveTo(MARGIN, SECTION_OFFSETS.powerBottomStart - 5);
  ctx.lineTo(
    MARGIN + (NUM_COLS - 1) * HOLE_SPACING,
    SECTION_OFFSETS.powerBottomStart - 5,
  );
  ctx.stroke();
  ctx.fillStyle = "#cc0000";
  ctx.fillText("+", MARGIN - 12, SECTION_OFFSETS.powerBottomStart + 3);

  ctx.fillStyle = "#aaa";
  ctx.font = "7px monospace";
  for (let col = 0; col < NUM_COLS; col++) {
    if ((col + 1) % 5 === 0 || col === 0) {
      const x = MARGIN + col * HOLE_SPACING;
      ctx.fillText(
        String(col + 1),
        x - (col + 1 >= 10 ? 4 : 2),
        SECTION_OFFSETS.terminalLeftStart - 5,
      );
    }
  }

  ctx.fillStyle = "#aaa";
  ctx.font = "7px monospace";
  for (let i = 0; i < TERMINAL_ROWS_LEFT.length; i++) {
    const y = SECTION_OFFSETS.terminalLeftStart + i * HOLE_SPACING + 3;
    ctx.fillText(
      TERMINAL_ROWS_LEFT[i],
      MARGIN - 10,
      y,
    );
  }
  for (let i = 0; i < TERMINAL_ROWS_RIGHT.length; i++) {
    const y = SECTION_OFFSETS.terminalRightStart + i * HOLE_SPACING + 3;
    ctx.fillText(TERMINAL_ROWS_RIGHT[i], MARGIN - 10, y);
  }

  cachedCanvas = canvas;
  return canvas;
}
