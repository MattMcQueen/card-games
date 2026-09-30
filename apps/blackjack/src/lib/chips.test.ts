import { describe, expect, it } from 'vitest';
import { chipsFor } from './chips';

describe('chipsFor', () => {
  it('uses the largest chips first', () => {
    expect(chipsFor(37)).toEqual([20, 10, 5, 1, 1]);
    expect(chipsFor(20)).toEqual([20]);
    expect(chipsFor(40)).toEqual([20, 20]);
  });

  it('adds up to the amount', () => {
    for (let n = 0; n <= 60; n++) {
      expect(chipsFor(n).reduce((a, b) => a + b, 0)).toBe(n);
    }
  });

  it('gives nothing for zero or negative amounts', () => {
    expect(chipsFor(0)).toEqual([]);
    expect(chipsFor(-5)).toEqual([]);
  });
});
