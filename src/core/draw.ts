import { mm } from './page';

export const LABEL_FONT = '"IBM Plex Sans Condensed", "Arial Narrow", sans-serif';

export const grey = (g: number): string => `rgb(${g},${g},${g})`;

/** Snap a coordinate so a stroke of width `w` lands on whole device pixels. */
export const snap = (v: number, w: number): number => Math.round(v) + (w % 2) / 2;

export function hline(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, w: number, colour: string): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, snap(y, w));
  ctx.lineTo(x1, snap(y, w));
  ctx.stroke();
}

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  radius: number, lineWidth: number, colour: string,
): void {
  ctx.strokeStyle = colour;
  ctx.lineWidth = lineWidth;
  const x0 = snap(x, lineWidth), y0 = snap(y, lineWidth);
  const x1 = snap(x + w, lineWidth), y1 = snap(y + h, lineWidth);
  ctx.beginPath();
  ctx.roundRect(x0, y0, x1 - x0, y1 - y0, Math.min(radius, (x1 - x0) / 2, (y1 - y0) / 2));
  ctx.stroke();
}

export function setLabelFont(ctx: CanvasRenderingContext2D, sizeMm: number): void {
  const px = Math.round(mm(sizeMm));
  ctx.font = `600 ${px}px ${LABEL_FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(px * 0.12)}px`;
}

/** Blank a stretch of a horizontal border so something can be written there. */
export function notch(ctx: CanvasRenderingContext2D, y: number, x: number, w: number, borderWidth: number): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y - borderWidth - 2, w, borderWidth * 2 + 4);
}

/** Uppercase label set into a border, right-aligned to `xEnd`. */
export function notchLabel(
  ctx: CanvasRenderingContext2D,
  text: string, xEnd: number, y: number, borderWidth: number, colour: string,
): void {
  if (!text.trim()) return;
  setLabelFont(ctx, 2.4);
  const t = text.toUpperCase(), w = ctx.measureText(t).width, pad = mm(1.2);
  notch(ctx, y, xEnd - w - pad, w + pad * 2, borderWidth);
  ctx.fillStyle = colour;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  ctx.fillText(t, xEnd, y + 1);
  ctx.textAlign = 'start';
}
