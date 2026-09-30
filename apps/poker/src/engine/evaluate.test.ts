import { describe, expect, it } from 'vitest';
import { evaluate, rankHand } from './evaluate';
import { cards } from './testing';

const score = (text: string) => evaluate(cards(text));
const name = (text: string) => rankHand(cards(text)).name;

describe('evaluate', () => {
  it('orders the nine hand categories', () => {
    const ladder = [
      '2c 5d 9h Jc Ks', // king high
      '2c 2d 9h Jc Ks', // pair
      '2c 2d 9h 9c Ks', // two pair
      '2c 2d 2h Jc Ks', // three of a kind
      '5c 6d 7h 8c 9s', // straight
      '2c 5c 9c Jc Kc', // flush
      '2c 2d 2h Jc Js', // full house
      '2c 2d 2h 2s Ks', // four of a kind
      '5c 6c 7c 8c 9c', // straight flush
    ].map(score);
    expect([...ladder].sort((a, b) => a - b)).toEqual(ladder);
    expect(new Set(ladder).size).toBe(9);
  });

  it('finds the best five of seven cards', () => {
    expect(name('As Ad 2c 7d 9h Jc 4s')).toBe('Pair of Aces');
    expect(name('As Ad 7c 7d 9h Jc 4s')).toBe('Two pair, Aces and Sevens');
    expect(name('As Ad Ac 7d 9h Jc 4s')).toBe('Three of a kind, Aces');
    expect(name('9s 8d 7c 6d 5h Kc 2s')).toBe('Straight, Nine high');
    expect(name('2s 8s 7s 6s Ks Kc 2c')).toBe('Flush, King high');
    expect(name('Ks Kd Kc 2d 2h 9c 4s')).toBe('Full house, Kings full of Twos');
    expect(name('Ks Kd Kc Kh 2h 9c 4s')).toBe('Four of a kind, Kings');
    expect(name('As Ks Qs Js 10s 2c 3d')).toBe('Royal flush');
    expect(name('9s 8s 7s 6s 5s Ac 3d')).toBe('Straight flush, Nine high');
    expect(name('Ah 5d 9c 2s 3h')).toBe('Ace high');
  });

  it('treats the ace as low in a wheel, and as the lowest straight', () => {
    expect(name('As 2d 3c 4d 5h')).toBe('Straight, Five high');
    expect(score('As 2d 3c 4d 5h')).toBeLessThan(score('2s 3d 4c 5d 6h'));
    expect(name('As 2s 3s 4s 5s')).toBe('Straight flush, Five high');
  });

  it('does not wrap a straight around the ace', () => {
    expect(name('Qs Kd As 2d 3h')).toBe('Ace high');
  });

  it('plays a second set of three as the pair in a full house', () => {
    expect(name('Ks Kd Kc 9d 9h 9c 4s')).toBe('Full house, Kings full of Nines');
  });

  it('picks the best pair when there are three', () => {
    expect(name('Ks Kd 9c 9d 4h 4c 2s')).toBe('Two pair, Kings and Nines');
    // The kicker can come from the third pair.
    expect(score('Ks Kd 9c 9d 4h 4c 2s')).toBeGreaterThan(score('Ks Kd 9c 9d 3h 3c 2s'));
  });

  it('breaks ties with kickers', () => {
    expect(score('As Ad Kc 7d 4h')).toBeGreaterThan(score('As Ad Qc 7d 4h'));
    expect(score('As Ad Kc 7d 4h')).toBeGreaterThan(score('Ks Kd Ac 7d 4h'));
    expect(score('As Ad Kc Jd 4h')).toBeGreaterThan(score('As Ad Kc 10d 9h'));
    expect(score('As Kd Qc Jd 9h')).toBeGreaterThan(score('As Kd Qc Jd 8h'));
  });

  it('gives equal scores to hands that play the same five cards', () => {
    expect(score('As Ks Qs Js 10s 2c 3d')).toBe(score('As Ks Qs Js 10s 9c 9d'));
    expect(score('2s 2d 9h Jc Ks 3c 4d')).toBe(score('2h 2c 9d Jd Kh 3s 4c'));
  });

  it('returns the five cards that make the hand', () => {
    const hand = rankHand(cards('As Ad 2c 7d 9h Jc 4s'));
    expect(hand.best).toHaveLength(5);
    expect(hand.best.filter((c) => c.rank === 'A')).toHaveLength(2);
    expect(hand.category).toBe('pair');
  });
});
