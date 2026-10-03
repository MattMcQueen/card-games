import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { chooseCall, evaluate, picturesOf } from './bidding';
import { decide } from './bot';
import { cardKey, isGameOver, newGame, nextHand } from './game';
import { auction, autoplay, calls, cards, playAll, seededGame, withHands } from './testing';
import type { Call, GameState } from './types';

/** Never careless: the random number is always high. */
const sharp = () => 0.99;

/** Your call with this hand after the calls in `text` (you deal, so the first call is yours). */
function yourCall(hand: string, text = '', others: Record<number, string> = {}): Call {
  const g = withHands(seededGame(), { 0: hand, ...others });
  const before = text ? auction(g, text) : g;
  return chooseCall(before);
}

describe('bidding', () => {
  it('counts high-card points and length', () => {
    expect(evaluate(cards('AS KS QS JS 2H 3H 4H 2D 3D 4D 2C 3C 4C'))).toMatchObject({ hcp: 10, pts: 10, balanced: true });
    expect(evaluate(cards('AS KS QS JS 10S 9S 4H 2D 3D 4D 2C 3C 4C')).pts).toBe(12);
  });

  it('opens 1NT, a five-card major, the longer minor, 2♣ or a weak two', () => {
    expect(yourCall('AS KS 4S 3S AH 5H 4H KD 3D 2D QC 3C 2C')).toEqual(calls('1NT')[0]);
    expect(yourCall('AS KS 5S 4S 3S AH 5H 4H KD 3D 2D 3C 2C')).toEqual(calls('1S')[0]);
    expect(yourCall('AS KS 4S 3S 5H 4H KD QD 3D 2D QC 3C 2C')).toEqual(calls('1D')[0]);
    expect(yourCall('AS KS QS 3S AH KH QH KD QD 2D AC 3C 2C')).toEqual(calls('2C')[0]);
    expect(yourCall('KS QS 10S 8S 5S 3S 5H 4H 3D 2D 4C 3C 2C')).toEqual(calls('2S')[0]);
    expect(yourCall('9S 8S 4S 5H 4H 3H 7D 3D 2D 5C 4C 3C 2C')).toEqual(calls('P')[0]);
  });

  it('raises partner’s major with support, and passes with nothing', () => {
    // Helen (seat 2) opens 1♥ after two passes.
    expect(yourCall('KS 4S 3S QH 5H 4H KD 3D 2D 5C 4C 3C 2C', 'P P 1H P')).toEqual(calls('2H')[0]);
    expect(yourCall('KS 4S 3S AH 5H 4H KD QD 2D AC 4C 3C 2C', 'P P 1H P')).toEqual(calls('4H')[0]);
    expect(yourCall('5S 4S 3S 6H 5H 4H 7D 3D 2D 5C 4C 3C 2C', 'P P 1H P')).toEqual(calls('P')[0]);
  });

  it('overcalls a good suit, and doubles for takeout when short in theirs', () => {
    // Mei, on your right, has opened 1♣.
    expect(yourCall('AS KS QS 5S 3S 5H 4H 2H KD 3D 2D 3C 2C', 'P P P 1C')).toEqual(calls('1S')[0]);
    expect(yourCall('AS KS 5S 3S AH 5H 4H 2H KD 3D 2D QD 2C', 'P P P 1C')).toEqual(calls('X')[0]);
  });

  it('reads partner’s calls: 1NT is 15 to 17 and balanced', () => {
    const p = picturesOf(auction(seededGame(), 'P P 1NT P').auction)[2]!;
    expect(p).toMatchObject({ min: 15, max: 17, balanced: true });
  });

  it('reaches game with enough points between the hands', () => {
    // Helen opens 1NT; you have 11 and a balanced hand.
    expect(yourCall('AS 4S 3S 2S KH 5H 4H KD 3D 2D JC 3C 2C', 'P P 1NT P')).toEqual(calls('3NT')[0]);
  });

  it('always makes a legal call, and every auction ends', () => {
    for (let seed = 1; seed < 60; seed++) {
      const g = autoplay(newGame(seededRandomInt(seed)), seed); // makeCall throws on anything illegal
      expect(g.phase).toBe('settled');
    }
  });
});

describe('playing', () => {
  const HANDS = {
    0: 'AS KS QS JS 10S 9S 8S 7S 6S 5S 4S 3S 2S',
    1: 'AH KH QH JH 10H 9H 8H 7H 6H 5H 4H 3H 2H',
    2: 'AD KD QD JD 10D 9D 8D 7D 6D 5D 4D 3D 2D',
    3: 'AC KC QC JC 10C 9C 8C 7C 6C 5C 4C 3C 2C',
  };

  it('leads the top of touching honours', () => {
    const g = auction(withHands(seededGame(), { ...HANDS, 1: 'KH QH JH 4H 3H 2H 9D 8D 7D 5C 4C 3C 2C', 2: 'AH AD KD QD JD 10D 6D 5D 4D 3D 2D 6C 7C' }), '1S P P P');
    expect(cardKey(decide(g, sharp))).toBe('KH');
  });

  it('third hand takes the trick as cheaply as is sure, and does not overtake its partner', () => {
    const g = auction(withHands(seededGame(), HANDS), '1S P P P');
    // Arjun leads a small heart: Helen and Mei have none, you trump it cheaply.
    const ruff = playAll(g, '2H 2D 2C');
    expect(cardKey(decide(ruff, sharp))).toBe('2S');
  });

  it('only ever plays a card it may play, over whole rubbers', () => {
    let g = seededGame(21);
    for (let hand = 1; hand <= 40 && !isGameOver(g); hand++) {
      g = autoplay(g, hand); // playCard throws on anything not allowed
      if (!isGameOver(g)) g = nextHand(g, seededRandomInt(hand));
    }
    expect(isGameOver(g)).toBe(true);
  });

  it('makes most contracts it bids', () => {
    let made = 0;
    let played = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const g: GameState = autoplay(newGame(seededRandomInt(seed)), seed);
      if (!g.result!.contract) continue;
      played++;
      if (g.result!.margin >= 0) made++;
    }
    expect(made / played).toBeGreaterThan(0.5);
  }, 30_000);
});
