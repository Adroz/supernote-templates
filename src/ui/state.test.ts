import { describe, expect, it } from 'vitest';
import { decodeHash, encodeHash, merge } from './state';

const defaults = { days: 2, spacing: 8, divider: true, label: 'Left' };

describe('URL state', () => {
  it('writes only changed values and round-trips them', () => {
    const s = { ...defaults, spacing: 7.5, divider: false, label: 'Wins & woes' };
    const hash = encodeHash('lrg', s, defaults);
    expect(hash).not.toContain('days');
    const { id, params } = decodeHash(hash);
    expect(id).toBe('lrg');
    expect(merge(defaults, params)).toEqual(s);
  });

  it('is just the id when nothing changed', () => {
    expect(encodeHash('lrg', defaults, defaults)).toBe('#lrg');
    expect(decodeHash('#lrg')).toEqual({ id: 'lrg', params: {} });
  });

  it('drops unknown keys and values of the wrong type', () => {
    const s = merge(defaults, { spacing: 'wide', divider: 'yes', days: '', bogus: '1', label: 'Ok' });
    expect(s).toEqual({ ...defaults, label: 'Ok' });
  });
});
