import { grey, hline, notch, notchLabel, roundedRect } from '../core/draw';
import { PAGE, mm, toMm } from '../core/page';
import { defineTemplate, type Template } from '../core/types';

export type LrgSettings = {
  days: number; spacing: number; marginTop: number; marginBottom: number; marginSide: number; divider: boolean;
  tasks: number; extraRight: number; boxSep: number; boxRadius: number; ruleLeft: boolean;
  cbSize: number; cbRadius: number; cbWeight: number;
  showLabels: boolean; leftLabel: string; rightLabel: string; dateNotch: number;
  lineGrey: number; lineWeight: number; boxGrey: number; boxWeight: number; labelGrey: number;
};

export type LrgLayout = {
  sp: number; top: number; right: number; perDay: number; left: number; dayH: number; gap: number;
  dayTop: (d: number) => number;
};

/** Space kept between days so the next day's date notch has room to be written in. */
const MIN_DAY_GAP_MM = 5;

/**
 * Rows are fixed at the line spacing; whatever height is left over goes into the
 * gap between days, so the top and bottom margins stay exactly as set.
 */
export function layout(s: LrgSettings): LrgLayout {
  const sp = mm(s.spacing), top = mm(s.marginTop), avail = PAGE.height - top - mm(s.marginBottom);
  const right = s.tasks + s.extraRight;
  const minGap = s.days > 1 ? mm(MIN_DAY_GAP_MM) : 0;
  const perDay = Math.floor((avail - (s.days - 1) * minGap) / s.days / sp + 1e-6);
  const left = perDay - right;
  const dayH = perDay * sp;
  const gap = s.days > 1 ? (avail - s.days * dayH) / (s.days - 1) : 0;
  return { sp, top, right, perDay, left, dayH, gap, dayTop: d => top + d * (dayH + gap) };
}

function draw(ctx: CanvasRenderingContext2D, s: LrgSettings): void {
  const L = layout(s);
  if (L.left < 1) return;
  const { width: W } = PAGE;
  const x0 = mm(s.marginSide), x1 = W - mm(s.marginSide), r = mm(s.boxRadius);
  const half = mm(s.boxSep) / 2, inset = mm(2), labelEnd = x1 - mm(4);
  const lineC = grey(s.lineGrey), boxC = grey(s.boxGrey), labelC = grey(s.labelGrey);

  for (let d = 0; d < s.days; d++) {
    const yT = L.dayTop(d), row = (i: number) => yT + i * L.sp;
    const yMid = row(L.left), yEnd = row(L.perDay);

    if (d > 0 && s.divider) hline(ctx, 0, W, yT - L.gap / 2, s.boxWeight, boxC);

    // Left box, with a blank space in its top border for the date.
    const lBot = yMid - half;
    if (s.ruleLeft) for (let i = 1; i < L.left; i++) hline(ctx, x0 + inset, x1 - inset, row(i), s.lineWeight, lineC);
    roundedRect(ctx, x0, yT, x1 - x0, lBot - yT, r, s.boxWeight, boxC);
    if (s.dateNotch > 0) notch(ctx, yT, x0 + mm(3), mm(s.dateNotch), s.boxWeight);
    if (s.showLabels) notchLabel(ctx, s.leftLabel, labelEnd, yT, s.boxWeight, labelC);

    // Right box: checkbox rows, then any extra ruled rows.
    const rTop = yMid + half;
    for (let i = 1; i < L.right; i++) hline(ctx, x0 + inset, x1 - inset, row(L.left + i), s.lineWeight, lineC);
    const cb = mm(s.cbSize);
    for (let i = 0; i < s.tasks; i++) {
      const cy = row(L.left + i) + L.sp / 2 + (i === 0 ? half / 2 : 0);
      roundedRect(ctx, x0 + mm(3), cy - cb / 2, cb, cb, mm(s.cbRadius), s.cbWeight, boxC);
    }
    roundedRect(ctx, x0, rTop, x1 - x0, yEnd - rTop, r, s.boxWeight, boxC);
    if (s.showLabels) notchLabel(ctx, s.rightLabel, labelEnd, rTop, s.boxWeight, labelC);
  }
}

export const leftRightGoodnight: Template<LrgSettings> = {
  id: 'left-right-goodnight',
  name: 'Left Right Goodnight',
  description: 'Two days per page: a ruled Left box, then a Right box of top-three checkboxes.',
  defaults: {
    days: 2, spacing: 8, marginTop: 2, marginBottom: 1.5, marginSide: 2, divider: true,
    tasks: 3, extraRight: 2, boxSep: 1.5, boxRadius: 1.5, ruleLeft: true,
    cbSize: 4, cbRadius: 3.5, cbWeight: 2,
    showLabels: true, leftLabel: 'Left', rightLabel: 'Right', dateNotch: 32,
    lineGrey: 150, lineWeight: 2, boxGrey: 40, boxWeight: 2, labelGrey: 90,
  },
  groups: [
    { title: 'Page', fields: [
      { key: 'days', label: 'Days per page', type: 'choice', options: [{ value: 1, label: 'One' }, { value: 2, label: 'Two' }] },
      { key: 'spacing', label: 'Line spacing', type: 'range', min: 6, max: 10, step: 0.5, unit: 'mm' },
      { key: 'marginTop', label: 'Top margin', type: 'range', min: 0, max: 20, step: 0.5, unit: 'mm' },
      { key: 'marginBottom', label: 'Bottom margin', type: 'range', min: 0, max: 20, step: 0.5, unit: 'mm' },
      { key: 'marginSide', label: 'Side margins', type: 'range', min: 0, max: 20, step: 0.5, unit: 'mm' },
      { key: 'divider', label: 'Full-width line between days', type: 'check' },
    ] },
    { title: 'Left box', fields: [
      { key: 'ruleLeft', label: 'Ruled lines inside', type: 'check' },
      { key: 'boxSep', label: 'Space between boxes', type: 'range', min: 0, max: 4, step: 0.5, unit: 'mm' },
      { key: 'boxRadius', label: 'Corner radius', type: 'range', min: 0, max: 5, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Right box', fields: [
      { key: 'tasks', label: 'Checkboxes', type: 'range', min: 1, max: 6, step: 1 },
      { key: 'extraRight', label: 'Extra lines after them', type: 'range', min: 0, max: 4, step: 1, unit: 'rows' },
      { key: 'cbSize', label: 'Checkbox size', type: 'range', min: 3, max: 7, step: 0.5, unit: 'mm' },
      { key: 'cbRadius', label: 'Checkbox rounding', type: 'range', min: 0, max: 3.5, step: 0.1, unit: 'mm' },
      { key: 'cbWeight', label: 'Checkbox stroke', type: 'range', min: 1, max: 6, step: 1, unit: 'px' },
    ] },
    { title: 'Labels', fields: [
      { key: 'showLabels', label: 'Print labels on the page', type: 'check' },
      { key: 'leftLabel', label: 'Left box label', type: 'text', maxLength: 24 },
      { key: 'rightLabel', label: 'Right box label', type: 'text', maxLength: 24 },
      { key: 'dateNotch', label: 'Blank date space on left box', type: 'range', min: 0, max: 60, step: 1, unit: 'mm' },
    ] },
    { title: 'Ink', fields: [
      { key: 'lineGrey', label: 'Ruled line grey', type: 'range', min: 0, max: 220, step: 5, unit: '/ 255' },
      { key: 'lineWeight', label: 'Ruled line weight', type: 'range', min: 1, max: 5, step: 1, unit: 'px' },
      { key: 'boxGrey', label: 'Box border grey', type: 'range', min: 0, max: 200, step: 5, unit: '/ 255' },
      { key: 'boxWeight', label: 'Box border weight', type: 'range', min: 1, max: 6, step: 1, unit: 'px' },
      { key: 'labelGrey', label: 'Label grey', type: 'range', min: 0, max: 180, step: 5, unit: '/ 255' },
    ] },
  ],
  draw,
  summary(s) {
    const L = layout(s);
    if (L.left < 1) {
      return { error: true, text: 'Too many rows: the right box leaves no room for the left box. Reduce checkboxes, extra lines or margins.' };
    }
    const gap = s.days > 1 ? ` · gap between days ${toMm(L.gap).toFixed(1)} mm` : '';
    return { text: `${s.spacing.toFixed(1)} mm rows · per day: left ${L.left} · right ${L.right}${gap}` };
  },
  fileName: s => `left-right-goodnight-${s.days}day-${String(s.spacing).replace('.', '_')}mm.png`,
};

export const leftRightGoodnightTemplate = defineTemplate(leftRightGoodnight);
