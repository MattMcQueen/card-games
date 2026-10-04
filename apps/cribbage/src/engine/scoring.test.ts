import { describe, expect, it } from 'vitest';
import { createDeck, seededRandomInt, shuffle } from '@card-games/cards-core';
import { countHand, pegPoints, peggingScores, pipValue, quickCount, runRank, sortHand } from './scoring';
import { cards } from './testing';
import type { Card } from './types';

const card = (text: string) => cards(text)[0]!;
const count = (hand: string, starter: string, crib = false) => countHand(cards(hand), card(starter), crib);
/** The kinds of combination in a count, with how many of each: "fifteen 2, pair 1". */
const kinds = (hand: string, starter: string, crib = false) => {
  const seen = new Map<string, number>();
  for (const c of count(hand, starter, crib).combos) seen.set(c.kind, (seen.get(c.kind) ?? 0) + 1);
  return Object.fromEntries(seen);
};

describe('card values', () => {
  it('counts an ace as 1 and court cards as 10, and runs from ace to king', () => {
    expect(cards('AS 5H 10C JD QS KH').map(pipValue)).toEqual([1, 5, 10, 10, 10, 10]);
    expect(cards('AS JD QS KH').map(runRank)).toEqual([1, 11, 12, 13]);
  });

  it('sorts a hand from ace to king', () => {
    expect(sortHand(cards('KH 2C AS 10D')).map((c) => c.rank)).toEqual(['A', '2', '10', 'K']);
  });
});

describe('counting a hand', () => {
  it('scores the best hand there is, 29', () => {
    // Four fives (four fifteens of three fives, four of a five and the jack), six pairs, and his nob.
    expect(count('5H 5C 5S JD', '5D').total).toBe(29);
    expect(kinds('5H 5C 5S JD', '5D')).toEqual({ fifteen: 8, pair: 6, nob: 1 });
  });

  it('scores nothing at all for a hand with no combinations', () => {
    expect(count('2C 4D 6H 10S', 'QH')).toEqual({ combos: [], total: 0 });
  });

  it('counts a double run with its pair and fifteens', () => {
    // 7-8-8-9: fifteen two, fifteen four, a pair is six, and two runs of three is twelve.
    expect(count('7H 8H 8S 9C', 'KD').total).toBe(12);
    expect(kinds('7H 8H 8S 9C', 'KD')).toEqual({ fifteen: 2, pair: 1, run: 2 });
  });

  it('counts a double double run as four runs', () => {
    expect(count('3C 3D 4H 4S', '5C').total).toBe(20);
    expect(kinds('3C 3D 4H 4S', '5C')).toEqual({ fifteen: 2, pair: 2, run: 4 });
  });

  it('counts only the longest run', () => {
    expect(kinds('2C 3D 4H 5S', '9C')).toEqual({ run: 1, fifteen: 1 });
    expect(count('2C 3D 4H 5S', '9C').combos.find((c) => c.kind === 'run')?.points).toBe(4);
    expect(count('AC 2D 3H 4S', '5C').combos.filter((c) => c.kind === 'run').map((c) => c.points)).toEqual([5]);
  });

  it('never runs round the corner from king to ace', () => {
    expect(kinds('QC KD AH 6S', '7C')).toEqual({});
  });

  it('scores a flush of four in a hand, but in a crib only a flush of five', () => {
    expect(count('2H 4H 6H 8H', '10C').total).toBe(4);
    expect(count('2H 4H 6H 8H', '10C', true).total).toBe(0);
    expect(count('2H 4H 6H 8H', '10H').total).toBe(5);
    expect(count('2H 4H 6H 8H', '10H', true).total).toBe(5);
  });

  it('scores his nob for the jack of the starter’s suit, but not for a jack turned up', () => {
    expect(kinds('JH 2C 7D 9S', '4H')).toEqual({ fifteen: 1, nob: 1 });
    expect(count('JH 2C 7D 9S', '4H').total).toBe(3);
    expect(kinds('QH 2C 7D 9S', 'JH')).toEqual({});
  });

  it('lists the cards of each combination', () => {
    const run = count('7H 8H 8S 9C', 'KD').combos.filter((c) => c.kind === 'run');
    expect(run.map((r) => r.cards.map((c) => c.rank + c.suit).join(' '))).toEqual(['7H 8H 9C', '7H 8S 9C']);
  });
});

describe('the quick count', () => {
  it('agrees with the full count, for hands and cribs', () => {
    const random = seededRandomInt(7);
    for (let i = 0; i < 3000; i++) {
      const [a, b, c, d, starter] = shuffle(createDeck(), random) as [Card, Card, Card, Card, Card];
      const crib = i % 2 === 1;
      expect(quickCount([a, b, c, d], starter, crib)).toBe(countHand([a, b, c, d], starter, crib).total);
    }
    for (const [hand, starter] of [['5H 5C 5S JD', '5D'], ['3C 3D 4H 4S', '5C'], ['7H 8H 8S 9C', 'KD'], ['2H 4H 6H 8H', '10H']]) {
      expect(quickCount(cards(hand!), card(starter!))).toBe(count(hand!, starter!).total);
    }
  });
});

describe('pegging in the play', () => {
  const pegs = (text: string) => peggingScores(cards(text));

  it('pegs two for fifteen and two for thirty-one', () => {
    expect(pegs('5H 10C')).toEqual([{ kind: 'fifteen', points: 2 }]);
    expect(pegs('10C 10D 10H AC')).toEqual([{ kind: 'thirtyOne', points: 2 }]);
  });

  it('pegs a pair, three of a kind and four of a kind', () => {
    expect(pegs('7H 7C')).toEqual([{ kind: 'pair', points: 2, size: 2 }]);
    expect(pegs('2H 2C 2S')).toEqual([{ kind: 'pair', points: 6, size: 3 }]);
    expect(pegs('AH AC AS AD')).toEqual([{ kind: 'pair', points: 12, size: 4 }]);
    // Only cards played one after another make a pair.
    expect(pegs('7H 2C 7S')).toEqual([]);
  });

  it('pegs a run made by the last cards played, in any order', () => {
    expect(pegs('2C 4D 3H')).toEqual([{ kind: 'run', points: 3, size: 3 }]);
    expect(pegs('2C 4D 3H 5S')).toEqual([{ kind: 'run', points: 4, size: 4 }]);
    expect(pegs('KC QD JH')).toEqual([{ kind: 'run', points: 3, size: 3 }]);
    // A pair in the middle breaks a run.
    expect(pegs('2C 4D 4H 3S')).toEqual([]);
  });

  it('pegs fifteen and a run together', () => {
    expect(pegs('6C 4D 5H')).toEqual([{ kind: 'fifteen', points: 2 }, { kind: 'run', points: 3, size: 3 }]);
    expect(pegPoints(pegs('6C 4D 5H'))).toBe(5);
  });
});
