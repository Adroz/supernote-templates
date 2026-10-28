import { describe, expect, it } from 'vitest';
import { PAGE, mm, toMm } from '../core/page';
import { layout, leftRightGoodnight, type LrgSettings } from './left-right-goodnight';

const base = leftRightGoodnight.defaults;
const at = (o: Partial<LrgSettings>): LrgSettings => ({ ...base, ...o });

describe('left-right-goodnight layout', () => {
  it('fits two days of 8 mm rows: 4 left, 5 right', () => {
    const L = layout(base);
    expect(L.left).toBe(4);
    expect(L.right).toBe(5);
    expect(toMm(L.gap)).toBeCloseTo(11, 0);
  });

  it('keeps the top and bottom margins exact, putting slack in the day gap', () => {
    for (const marginTop of [0, 2, 7.5]) {
      for (const marginBottom of [0, 1.5, 9]) {
        const s = at({ marginTop, marginBottom });
        const L = layout(s);
        expect(L.dayTop(0)).toBeCloseTo(mm(marginTop), 6);
        expect(L.dayTop(s.days - 1) + L.dayH).toBeCloseTo(PAGE.height - mm(marginBottom), 6);
        expect(L.gap).toBeGreaterThanOrEqual(mm(5) - 1e-6);
      }
    }
  });

  it('gives the left box whatever the right box does not use', () => {
    const more = layout(at({ extraRight: 4 }));
    expect(more.left).toBe(layout(base).left - 2);
    expect(more.perDay).toBe(layout(base).perDay);
  });

  it('has no gap with one day per page, and every row lies on the spacing grid', () => {
    const L = layout(at({ days: 1 }));
    expect(L.gap).toBe(0);
    expect(L.dayH).toBeCloseTo(L.perDay * mm(8), 6);
    expect(L.dayH).toBeLessThanOrEqual(PAGE.height - mm(base.marginTop) - mm(base.marginBottom));
  });

  it('reports an error when the right box crowds out the left', () => {
    const s = at({ tasks: 6, extraRight: 4 });
    expect(layout(s).left).toBeLessThan(1);
    expect(leftRightGoodnight.summary?.(s).error).toBe(true);
  });
});
