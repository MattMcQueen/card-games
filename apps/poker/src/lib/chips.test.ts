import { describe, expect, it } from 'vitest';
import { chipsFor } from './chips';

describe('chipsFor', () => {
  it('uses the fewest chips, largest first', () => {
    expect(chipsFor(137)).toEqual([100, 25, 5, 5, 1, 1]);
    expect(chipsFor(1000)).toEqual([500, 500]);
    expect(chipsFor(0)).toEqual([]);
  });

  it('never shows more chips than the limit', () => {
    expect(chipsFor(6000)).toHaveLength(8);
    expect(chipsFor(999, 3)).toEqual([500, 100, 100]);
  });
});
