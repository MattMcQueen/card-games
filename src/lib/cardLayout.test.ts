import { describe, expect, it } from 'vitest';
import { isFaceCard, pipsFor } from './cardLayout';

describe('pipsFor', () => {
  it('prints as many pips as the card is worth, from 2 to 10', () => {
    for (let n = 2; n <= 10; n++) {
      expect(pipsFor(String(n) as '2')).toHaveLength(n);
    }
  });

  it('has no pip layout for aces or picture cards', () => {
    expect(pipsFor('A')).toEqual([]);
    expect(pipsFor('K')).toEqual([]);
  });

  it('flips only the lower-half pips', () => {
    const three = pipsFor('3');
    expect(three.map((p) => p.flip)).toEqual([false, false, true]);
  });
});

describe('isFaceCard', () => {
  it('is true for J, Q and K only', () => {
    expect(['J', 'Q', 'K'].every((r) => isFaceCard(r as 'J'))).toBe(true);
    expect(['A', '10', '2'].some((r) => isFaceCard(r as 'A'))).toBe(false);
  });
});
