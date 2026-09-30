import { describe, expect, it } from 'vitest';
import { buildPots } from './pots';
import type { Seat } from './types';

const seat = (id: number, total: number, folded = false): Seat => ({
  id, name: `S${id}`, human: false, chips: 0, bet: 0, total, hole: [], folded, allIn: false, acted: true, last: null,
});

describe('buildPots', () => {
  it('makes one pot when everyone put in the same', () => {
    expect(buildPots([seat(0, 50), seat(1, 50), seat(2, 50)])).toEqual([
      { amount: 150, eligible: [0, 1, 2], uncalled: false },
    ]);
  });

  it('makes a side pot for each all-in level', () => {
    const pots = buildPots([seat(0, 100), seat(1, 300), seat(2, 300), seat(3, 500)]);
    expect(pots.map((p) => [p.amount, p.eligible])).toEqual([
      [400, [0, 1, 2, 3]],
      [600, [1, 2, 3]],
      [200, [3]],
    ]);
    expect(pots[2]?.uncalled).toBe(true);
  });

  it('keeps chips from folded seats in the pot, but they cannot win it', () => {
    const pots = buildPots([seat(0, 20, true), seat(1, 50), seat(2, 50)]);
    expect(pots).toEqual([{ amount: 120, eligible: [1, 2], uncalled: false }]);
  });

  it('hands back a bet nobody called', () => {
    const pots = buildPots([seat(0, 10, true), seat(1, 60), seat(2, 40)]);
    expect(pots.map((p) => [p.amount, p.eligible, p.uncalled])).toEqual([
      [90, [1, 2], false],
      [20, [1], true],
    ]);
  });

  it('always adds up to everything put in', () => {
    const seats = [seat(0, 5, true), seat(1, 10, true), seat(2, 75), seat(3, 200), seat(4, 200), seat(5, 90, true)];
    expect(buildPots(seats).reduce((sum, p) => sum + p.amount, 0)).toBe(580);
  });
});
