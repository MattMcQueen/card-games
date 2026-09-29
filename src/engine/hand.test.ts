import { describe, expect, it } from 'vitest';
import { handValue, isBlackjack, isBust, isPair } from './hand';
import { card } from './testing';
import type { Rank } from './types';

const hand = (...ranks: Rank[]) => ranks.map(card);

describe('handValue', () => {
  it('scores number cards at face value and picture cards as 10', () => {
    expect(handValue(hand('2', '9'))).toEqual({ total: 11, soft: false });
    expect(handValue(hand('10', 'J'))).toEqual({ total: 20, soft: false });
    expect(handValue(hand('Q', 'K'))).toEqual({ total: 20, soft: false });
  });

  it('counts an ace as 11 when that does not bust, making the hand soft', () => {
    expect(handValue(hand('A', '6'))).toEqual({ total: 17, soft: true });
    expect(handValue(hand('A', 'K'))).toEqual({ total: 21, soft: true });
  });

  it('drops an ace to 1 when 11 would bust', () => {
    expect(handValue(hand('A', '6', '10'))).toEqual({ total: 17, soft: false });
    expect(handValue(hand('A', '5', '5', '9'))).toEqual({ total: 20, soft: false });
  });

  it('only ever counts one ace as 11', () => {
    expect(handValue(hand('A', 'A'))).toEqual({ total: 12, soft: true });
    expect(handValue(hand('A', 'A', 'A'))).toEqual({ total: 13, soft: true });
    expect(handValue(hand('A', 'A', '9'))).toEqual({ total: 21, soft: true });
  });
});

describe('isBust', () => {
  it('is true only above 21', () => {
    expect(isBust(hand('10', '6', '6'))).toBe(true);
    expect(isBust(hand('10', '6', '5'))).toBe(false);
    expect(isBust(hand('A', 'A', 'K'))).toBe(false);
    expect(isBust(hand('A', 'A', 'K', 'K'))).toBe(true);
  });
});

describe('isBlackjack', () => {
  it('needs exactly two cards totalling 21', () => {
    expect(isBlackjack(hand('A', 'K'))).toBe(true);
    expect(isBlackjack(hand('10', 'A'))).toBe(true);
    expect(isBlackjack(hand('7', '7', '7'))).toBe(false);
    expect(isBlackjack(hand('10', '9'))).toBe(false);
  });
});

describe('isPair', () => {
  it('needs the same rank, so K and Q are not a pair', () => {
    expect(isPair(hand('8', '8'))).toBe(true);
    expect(isPair(hand('K', 'K'))).toBe(true);
    expect(isPair(hand('K', 'Q'))).toBe(false);
    expect(isPair(hand('10', 'J'))).toBe(false);
    expect(isPair(hand('8', '8', '8'))).toBe(false);
  });
});
