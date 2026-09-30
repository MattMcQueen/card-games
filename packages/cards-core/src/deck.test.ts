import { describe, expect, it } from 'vitest';
import { RANKS, SUITS } from './cards';
import { createDeck, secureRandomInt, shuffle } from './deck';
import { seededRandomInt } from './random';

describe('createDeck', () => {
  it('is one of each card', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((c) => c.rank + c.suit)).size).toBe(52);
  });

  it('can be a shoe of six full decks', () => {
    const shoe = createDeck(6);
    expect(shoe).toHaveLength(312);
    for (const rank of RANKS) {
      expect(shoe.filter((c) => c.rank === rank)).toHaveLength(24);
    }
    for (const suit of SUITS) {
      expect(shoe.filter((c) => c.suit === suit)).toHaveLength(78);
    }
  });
});

describe('shuffle', () => {
  const key = (cards: { rank: string; suit: string }[]) => cards.map((c) => c.rank + c.suit);

  it('keeps every card and does not change the input', () => {
    const ordered = createDeck(6);
    const before = key(ordered);
    const shuffled = shuffle(ordered, seededRandomInt(7));
    expect(key(ordered)).toEqual(before);
    expect(key(shuffled).sort()).toEqual([...before].sort());
  });

  it('actually reorders the cards, and differently for different seeds', () => {
    const ordered = createDeck(6);
    const a = key(shuffle(ordered, seededRandomInt(1)));
    const b = key(shuffle(ordered, seededRandomInt(2)));
    expect(a).not.toEqual(key(ordered));
    expect(a).not.toEqual(b);
  });

  it('is repeatable for the same seed', () => {
    const ordered = createDeck(6);
    expect(shuffle(ordered, seededRandomInt(5))).toEqual(shuffle(ordered, seededRandomInt(5)));
  });

  it('puts each card in each position about equally often (small deck, many shuffles)', () => {
    const counts = Array.from({ length: 4 }, () => new Array(4).fill(0) as number[]);
    const random = seededRandomInt(99);
    const runs = 20000;
    for (let i = 0; i < runs; i++) {
      shuffle([0, 1, 2, 3], random).forEach((value, position) => {
        (counts[value] as number[])[position]!++;
      });
    }
    for (const row of counts) {
      for (const count of row) expect(Math.abs(count - runs / 4)).toBeLessThan(runs * 0.03);
    }
  });
});

describe('secureRandomInt', () => {
  it('stays within range and reaches every value', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const n = secureRandomInt(6);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
      seen.add(n);
    }
    expect(seen.size).toBe(6);
  });

  it('rejects impossible ranges', () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);
  });
});
