import { describe, expect, it } from 'vitest';
import { cardOverlap } from './handLayout';

/** A hand's width in card widths. */
const width = (count: number) => 1 + (count - 1) * (1 + cardOverlap(count));

describe('cardOverlap', () => {
  it('spreads small hands and overlaps larger ones', () => {
    expect(cardOverlap(2)).toBe(0.08);
    expect(cardOverlap(3)).toBe(-0.3);
    expect(cardOverlap(4)).toBe(-0.5);
  });

  it('never lets a hand grow wider than four cards', () => {
    for (let count = 4; count <= 11; count++) expect(width(count)).toBeCloseTo(2.5);
  });

  it('shows at least a quarter of each card, so its corner can be read, in hands of up to seven', () => {
    for (let count = 2; count <= 7; count++) expect(1 + cardOverlap(count)).toBeGreaterThanOrEqual(0.25);
  });
});
