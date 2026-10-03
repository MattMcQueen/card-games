import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { GAME_OVER_SCORE, HAND_SIZE, PLAYERS, POINTS_PER_HAND } from './constants';
import {
  cardKey,
  collect,
  directionFor,
  hasWon,
  isGameOver,
  leaders,
  legalCards,
  nextHand,
  passCards,
  passSource,
  passTarget,
  playCard,
  pointsIn,
  trickWinner,
} from './game';
import { autoplay, cards, playAll, seededGame, withHands } from './testing';
import type { Card, GameState } from './types';

const keys = (list: readonly Card[]) => list.map(cardKey).sort();

/** Four hands of thirteen that make for easy tricks: each seat holds one rank of every suit, more or less. */
const HANDS = {
  0: '2C 3C 4C 5C 2D 3D 4D 5D 2S 3S 4S 5S 2H',
  1: '6C 7C 8C 9C 6D 7D 8D 9D 6S 7S 8S 9S 3H',
  2: '10C JC QC KC 10D JD QD KD 10S JS QS KS 4H',
  3: 'AC AD AS 5H 6H 7H 8H 9H 10H JH QH KH AH',
};

/** A hand ready to play: no passing (the fourth hand), and the rigged cards above. */
function rigged(): GameState {
  let g = seededGame(3);
  for (let hand = 1; hand < 4; hand++) g = nextHand(autoplay(g, hand), seededRandomInt(hand));
  expect(g.direction).toBe('keep');
  return { ...withHands(g, HANDS), toPlay: 0 };
}

describe('dealing', () => {
  it('deals thirteen cards to each of the four players, all different', () => {
    const g = seededGame();
    expect(g.players).toHaveLength(PLAYERS);
    for (const p of g.players) expect(p.hand).toHaveLength(HAND_SIZE);
    expect(new Set(g.players.flatMap((p) => p.hand.map(cardKey))).size).toBe(52);
  });

  it('sorts each hand by suit, then rank with aces high', () => {
    const g = withHands(seededGame(), { 0: 'AH 2H KS 3C AC 10D' });
    expect(g.players[0]!.hand.map(cardKey)).toEqual(['3C', 'AC', '10D', 'KS', '2H', 'AH']);
  });

  it('passes left, right, across, then not at all, and round again', () => {
    expect([1, 2, 3, 4, 5].map(directionFor)).toEqual(['left', 'right', 'across', 'keep', 'left']);
    expect(passTarget(0, 'left')).toBe(1);
    expect(passTarget(0, 'right')).toBe(3);
    expect(passTarget(1, 'across')).toBe(3);
    expect(passSource(1, 'left')).toBe(0);
    expect(passSource(0, 'right')).toBe(1);
  });
});

describe('passing', () => {
  it('gives each player the three cards passed to them, and the holder of the two of clubs leads', () => {
    const g = seededGame();
    expect(g.phase).toBe('passing');
    const picks = g.players.map((p) => p.hand.slice(0, 3));
    const after = passCards(g, picks);
    expect(after.phase).toBe('playing');
    for (const p of after.players) {
      expect(p.hand).toHaveLength(HAND_SIZE);
      expect(keys(p.received)).toEqual(keys(picks[passSource(p.id, 'left')]!));
    }
    expect(after.players[after.toPlay]!.hand.some((c) => cardKey(c) === '2C')).toBe(true);
  });

  it('refuses a pass of the wrong number of cards, or of cards not in the hand', () => {
    const g = seededGame();
    const picks = g.players.map((p) => p.hand.slice(0, 3));
    expect(() => passCards(g, [picks[0]!.slice(0, 2), ...picks.slice(1)])).toThrow();
    expect(() => passCards(g, [g.players[1]!.hand.slice(0, 3), ...picks.slice(1)])).toThrow();
    expect(() => passCards(g, [[picks[0]![0]!, picks[0]![0]!, picks[0]![1]!], ...picks.slice(1)])).toThrow();
  });

  it('skips passing on the fourth hand, straight to the two of clubs', () => {
    let g = seededGame(5);
    for (let hand = 1; hand < 4; hand++) g = nextHand(autoplay(g, hand), seededRandomInt(hand));
    expect(g.hand).toBe(4);
    expect(g.phase).toBe('playing');
    expect(legalCards(g).map(cardKey)).toEqual(['2C']);
  });
});

describe('playing', () => {
  it('must lead the two of clubs to the first trick', () => {
    const g = rigged();
    expect(legalCards(g).map(cardKey)).toEqual(['2C']);
    expect(() => playCard(g, cards('3C')[0]!)).toThrow();
  });

  it('must follow suit when it can', () => {
    const g = playCard(rigged(), cards('2C')[0]!);
    expect(keys(legalCards(g))).toEqual(keys(cards('6C 7C 8C 9C')));
  });

  it('allows no hearts or queen of spades on the first trick, unless there is nothing else', () => {
    const g = withHands(rigged(), { 2: '10D JD QD KD 10S JS QS KS 4H 5D 6D 7D 8D', 3: 'AS 5H 6H 7H 8H 9H 10H JH QH KH AH 9D 2D' });
    const third = playAll(g, '2C 6C');
    expect(legalCards(third).some((c) => c.suit === 'H' || cardKey(c) === 'QS')).toBe(false);
    const allHearts = withHands(rigged(), { 3: 'QS 5H 6H 7H 8H 9H 10H JH QH KH AH 3H 4H' });
    expect(legalCards(playAll(allHearts, '2C 6C 10C')).length).toBe(13);
  });

  it('may not lead hearts until one has been played, unless the hand is all hearts', () => {
    const g = playAll(rigged(), '2C 6C 10C AC');
    expect(g.toPlay).toBe(3); // the ace took it
    expect(legalCards(g).map(cardKey)).toEqual(['AD', 'AS']);
    const onlyHearts = withHands(g, { 3: '5H 6H 7H 8H 9H 10H JH QH KH AH 2H 3H' });
    expect(legalCards(onlyHearts)).toHaveLength(12);
  });

  it('hearts are broken once one is discarded, and can be led after', () => {
    const g = withHands(rigged(), {
      0: '2C 3C 4C 5C 2D 3D 4D 5D 6D 2S 3S 4S 5S',
      1: '6C 7C 8C 9C 6S 7S 8S 9S 2H 3H 7H 8H 9H',
      2: '10C JC QC KC 9D 10D JD QD KD 10S JS QS KS',
      3: 'AC AD AS 4H 5H 6H 10H JH QH KH AH 7D 8D',
    });
    let next = playAll(g, '2C 6C 10C AC');
    expect(legalCards(next).map(cardKey)).toEqual(['7D', '8D', 'AD', 'AS']);
    next = playAll(next, 'AD 2D 2H 9D'); // seat 1 has no diamonds and throws a heart
    expect(next.heartsBroken).toBe(true);
    expect(next.toPlay).toBe(3);
    expect(legalCards(next).some((c) => c.suit === 'H')).toBe(true);
  });

  it('the highest card of the suit led wins, whatever else is played', () => {
    expect(trickWinner([
      { seat: 2, card: cards('5D')[0]! },
      { seat: 3, card: cards('AS')[0]! },
      { seat: 0, card: cards('KD')[0]! },
      { seat: 1, card: cards('9D')[0]! },
    ])).toBe(0);
  });

  it('waits after the fourth card for the trick to be collected, then the winner leads', () => {
    const full = ['2C', '6C', '10C', 'AC'].reduce((g, c) => playCard(g, cards(c)[0]!), rigged());
    expect(full.phase).toBe('collecting');
    expect(full.winner).toBe(3);
    expect(full.toPlay).toBe(-1);
    const next = collect(full);
    expect(next.trick).toEqual([]);
    expect(next.toPlay).toBe(3);
    expect(next.players[3]!.taken).toHaveLength(4);
    expect(next.tricksPlayed).toBe(1);
  });
});

describe('scoring', () => {
  it('counts a point a heart and thirteen for the queen of spades', () => {
    expect(pointsIn(cards('2H AH QS KS 3D'))).toBe(15);
  });

  it('every hand scores 26 points between the players, or 78 when someone shoots the moon', () => {
    let g = seededGame(11);
    for (let hand = 1; hand <= 30 && !isGameOver(g); hand++) {
      g = autoplay(g, hand);
      const total = g.result!.points.reduce((a, b) => a + b, 0);
      expect(total).toBe(g.result!.moon === null ? POINTS_PER_HAND : POINTS_PER_HAND * 3);
      expect(g.players.reduce((sum, p) => sum + p.taken.length, 0)).toBe(52);
      if (!isGameOver(g)) g = nextHand(g, seededRandomInt(hand));
    }
    expect(isGameOver(g)).toBe(true);
  });

  it('shooting the moon scores nothing for the shooter and 26 for everyone else', () => {
    // Seat 3 holds the top card of every suit, so it takes every trick, and with them every point.
    let current = withHands(rigged(), {
      0: '2C 3C 4C 5C 6C 2D 3D 4D 5D 2S 3S 4S 2H',
      1: '7C 8C 9C 10C 6D 7D 8D 9D 5S 6S 7S 3H 4H',
      2: 'JC QC 10D JD QD 8S 9S 10S JS QS 5H 6H 7H',
      3: 'AC KC AD KD AS KS AH KH QH JH 10H 9H 8H',
    });
    const before = current.players.map((p) => p.score);
    while (current.phase !== 'settled') {
      if (current.phase === 'collecting') {
        current = collect(current);
        continue;
      }
      const legal = legalCards(current);
      current = playCard(current, (current.toPlay === 3 ? legal.at(-1) : legal[0])!);
    }
    expect(current.result).toEqual({ points: [26, 26, 26, 0], moon: 3 });
    expect(current.players.map((p) => p.score)).toEqual([26, 26, 26, 0].map((p, i) => p + before[i]!));
  });

  it('ends the game once someone reaches 100, and the lowest score wins', () => {
    const settled = autoplay(seededGame(2));
    const nearlyOver = { ...settled, players: settled.players.map((p, i) => ({ ...p, score: [10, GAME_OVER_SCORE, 40, 10][i]! })) };
    expect(isGameOver(nearlyOver)).toBe(true);
    expect(leaders(nearlyOver)).toEqual([0, 3]);
    expect(hasWon(nearlyOver)).toBe(true);
    expect(() => nextHand(nearlyOver)).toThrow();
  });

  it('keeps a score sheet of every hand', () => {
    let g = autoplay(seededGame(4), 1);
    g = autoplay(nextHand(g, seededRandomInt(1)), 2);
    expect(g.history).toHaveLength(2);
    expect(g.players.map((p) => p.score)).toEqual(g.players.map((p) => g.history[0]![p.id]! + g.history[1]![p.id]!));
  });
});
