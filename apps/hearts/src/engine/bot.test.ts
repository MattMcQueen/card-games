import { mulberry32, seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { choosePass, decide } from './bot';
import { cardKey, isGameOver, nextHand } from './game';
import { autoplay, playAll, seededGame, withHands } from './testing';
import type { GameState } from './types';

/** Never careless: the random number is always high. */
const sharp = () => 0.99;

/** The fourth hand (no passing), with seat 0 to lead the two of clubs and the given hands. */
function table(hands: Record<number, string>): GameState {
  let g = seededGame(3);
  for (let hand = 1; hand < 4; hand++) g = nextHand(autoplay(g, hand), seededRandomInt(hand));
  return { ...withHands(g, hands), toPlay: 0 };
}

const DEAL = {
  0: '2C 3C 4C 5C 2D 3D 4D 5D 2S 3S 4S 5S 2H',
  1: '6C 7C 8C 9C 6D 7D 8D 9D 6S 7S 8S 9S 3H',
  2: '10C JC QC KC 10D JD QD KD 10S JS QS KS 4H',
  3: 'AC AD AS 5H 6H 7H 8H 9H 10H JH QH KH AH',
};

describe('passing', () => {
  it('passes an unguarded queen of spades, the high spades and high hearts', () => {
    const g = withHands(seededGame(), { 1: 'QS AS KH 2C 3C 4C 5C 6D 7D 8D 9D 10D 3S' });
    expect(choosePass(g, 1, sharp).map(cardKey).sort()).toEqual(['AS', 'KH', 'QS']);
  });

  it('keeps a queen of spades guarded by plenty of low spades', () => {
    const g = withHands(seededGame(), { 1: 'QS 2S 3S 4S 5S AH KH 2C 3C 4D 5D 6D 7D' });
    expect(choosePass(g, 1, sharp).map(cardKey)).not.toContain('QS');
  });

  it('always passes three different cards from its own hand', () => {
    const g = seededGame(9);
    const random = mulberry32(1);
    for (let i = 0; i < 50; i++) {
      for (const seat of [1, 2, 3]) {
        const pick = choosePass(g, seat, random).map(cardKey);
        expect(new Set(pick).size).toBe(3);
        expect(pick.every((k) => g.players[seat]!.hand.some((c) => cardKey(c) === k))).toBe(true);
      }
    }
  });
});

describe('playing', () => {
  it('drops the queen of spades on a king or ace of spades', () => {
    const g = playAll(table({ ...DEAL, 2: 'QS 3S 10C JC QC KC 10D JD QD KD 10S JS 4H', 1: 'KS 6C 7C 8C 9C 6D 7D 8D 9D 6S 7S 8S 3H' }), '2C 6C 10C AC  AS 2S KS');
    expect(g.toPlay).toBe(2);
    expect(cardKey(decide(g, sharp))).toBe('QS');
  });

  it('throws the queen of spades away when it cannot follow suit', () => {
    const g = playAll(table({ ...DEAL, 1: 'QS 6C 7C 8C 9C 6S 7S 8S 9S 3H 2H 4H 5H', 3: 'AC AD AS 6D 6H 7H 8H 9H 10H JH QH KH AH' }), '2C 6C 10C AC  AD 2D');
    expect(g.toPlay).toBe(1);
    expect(cardKey(decide(g, sharp))).toBe('QS');
  });

  it('ducks under the winning card when it can', () => {
    const g = playAll(table(DEAL), '2C 6C 10C AC  AD 2D');
    expect(cardKey(decide(g, sharp))).toBe('9D'); // the highest that still loses to the ace
  });

  it('plays a high club on the first trick, when no points can be played', () => {
    const g = playAll(table(DEAL), '2C');
    expect(cardKey(decide(g, sharp))).toBe('9C');
  });

  it('only ever plays a card it may play', () => {
    let g = seededGame(21);
    for (let hand = 1; hand <= 40 && !isGameOver(g); hand++) {
      g = autoplay(g, hand); // passCards and playCard throw on anything not allowed
      if (!isGameOver(g)) g = nextHand(g, seededRandomInt(hand));
    }
    expect(isGameOver(g)).toBe(true);
  });
});

describe('skill', () => {
  it('the more skilled players take fewer points over many hands', () => {
    const totals = [0, 0, 0, 0];
    let g = seededGame(1);
    for (let hand = 1; hand <= 400; hand++) {
      g = autoplay(g, hand);
      g.result!.points.forEach((p, seat) => (totals[seat]! += p));
      // Keep playing past 100: only the hands matter here.
      g = nextHand({ ...g, players: g.players.map((p) => ({ ...p, score: 0 })) }, seededRandomInt(hand));
    }
    const [, terry, margaret, priya] = totals as [number, number, number, number];
    expect(terry).toBeGreaterThan(margaret);
    expect(margaret).toBeGreaterThan(priya);
  });
});
