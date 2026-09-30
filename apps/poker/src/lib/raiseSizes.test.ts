import { describe, expect, it } from 'vitest';
import type { LegalActions } from '../engine';
import { raiseSizes } from './raiseSizes';

const legal = (over: Partial<LegalActions> = {}): LegalActions => ({
  canCheck: false, canCall: true, toCall: 10, canRaise: true, minRaiseTo: 20, maxRaiseTo: 1000, ...over,
});
const to = (sizes: ReturnType<typeof raiseSizes>) => sizes.map((s) => s.to);

describe('raiseSizes', () => {
  it('sizes a raise by the pot after you have called', () => {
    // Blinds only: a pot of 15, 10 to call. A pot-sized raise is to 10 + (15 + 10) = 35.
    expect(to(raiseSizes(10, 15, legal()))).toEqual([20, 25, 30, 35, 1000]);
  });

  it('sizes an opening bet by the pot', () => {
    expect(to(raiseSizes(0, 100, legal({ canCall: false, canCheck: true, toCall: 0, minRaiseTo: 10 })))).toEqual([10, 50, 75, 100, 1000]);
  });

  it('keeps every size between the smallest raise and all-in', () => {
    const short = legal({ minRaiseTo: 90, maxRaiseTo: 120 });
    expect(to(raiseSizes(50, 400, short))).toEqual([90, 120, 120, 120, 120]);
    expect(to(raiseSizes(50, 5, short))[1]).toBe(90);
  });
});
