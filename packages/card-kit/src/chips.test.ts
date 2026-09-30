import { describe, expect, it } from 'vitest';
import { chipsFor, type ChipSet } from './chips';

const small: ChipSet = { values: [20, 10, 5, 1] };
const large: ChipSet = { values: [500, 100, 25, 5, 1], limit: 8 };

describe('chipsFor', () => {
  it('uses the fewest chips, largest first', () => {
    expect(chipsFor(37, small)).toEqual([20, 10, 5, 1, 1]);
    expect(chipsFor(20, small)).toEqual([20]);
    expect(chipsFor(40, small)).toEqual([20, 20]);
    expect(chipsFor(137, large)).toEqual([100, 25, 5, 5, 1, 1]);
    expect(chipsFor(1000, large)).toEqual([500, 500]);
  });

  it('adds up to the amount', () => {
    for (let n = 0; n <= 60; n++) {
      expect(chipsFor(n, small).reduce((a, b) => a + b, 0)).toBe(n);
    }
  });

  it('gives nothing for zero or negative amounts', () => {
    expect(chipsFor(0, small)).toEqual([]);
    expect(chipsFor(-5, small)).toEqual([]);
    expect(chipsFor(0, large)).toEqual([]);
  });

  it('never shows more chips than the limit', () => {
    expect(chipsFor(6000, large)).toHaveLength(8);
    expect(chipsFor(999, { ...large, limit: 3 })).toEqual([500, 100, 100]);
  });
});
