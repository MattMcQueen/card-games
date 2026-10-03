import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { collect, legalCards, nextHand, passCards, playCard, type GameState } from '../engine';
import { autoplay, cards, playAll, seededGame, withHands } from '../engine/testing';
import { cuesFor } from './cues';

const sounds = (prev: GameState, next: GameState) => cuesFor(prev, next, true).map((c) => c.sound);
const play = (state: GameState, card: string) => playCard(state, cards(card)[0]!);

/** The fourth hand (no passing) with the given hands, led by whoever holds the two of clubs. */
function table(hands: Record<number, string>): GameState {
  let g = seededGame(3);
  for (let hand = 1; hand < 4; hand++) g = nextHand(autoplay(g, hand), seededRandomInt(hand));
  const dealt = withHands(g, hands);
  return { ...dealt, toPlay: dealt.players.findIndex((p) => p.hand.some((c) => c.rank === '2' && c.suit === 'C')) };
}

const DEAL = {
  0: '2C 3C 4C 5C 2D 3D 4D 5D 6D 2S 3S 4S 5S',
  1: '6C 7C 8C 9C 6S 7S 8S 9S 2H 3H 7H 8H 9H',
  2: '10C JC QC KC 9D 10D JD QD KD 10S JS QS KS',
  3: 'AC AD AS 4H 5H 6H 10H JH QH KH AH 7D 8D',
};

/** A deal where `shooter` holds the top card of every suit, and so takes every trick and every point. */
function moonDeal(shooter: number): GameState {
  const hands = [
    '2C 3C 4C 5C 6C 2D 3D 4D 5D 2S 3S 4S 2H',
    '7C 8C 9C 10C 6D 7D 8D 9D 5S 6S 7S 3H 4H',
    'JC QC 10D JD QD 8S 9S 10S JS QS 5H 6H 7H',
  ];
  const top = 'AC KC AD KD AS KS AH KH QH JH 10H 9H 8H';
  const others = [0, 1, 2, 3].filter((s) => s !== shooter);
  return table({ [shooter]: top, ...Object.fromEntries(others.map((s, i) => [s, hands[i]!])) });
}

/** Plays a hand out (the shooter its highest card, the others their lowest), and returns the last change: the one that scores it. */
function lastChange(state: GameState, shooter: number): [GameState, GameState] {
  let current = state;
  for (;;) {
    if (current.phase === 'collecting') {
      const next = collect(current);
      if (next.phase === 'settled') return [current, next];
      current = next;
      continue;
    }
    const legal = legalCards(current);
    current = playCard(current, (current.toPlay === shooter ? legal.at(-1) : legal[0])!);
  }
}

describe('cuesFor', () => {
  it('shuffles and deals a new hand, with a card sound for each round', () => {
    const settled = autoplay(seededGame(1));
    const cues = sounds(settled, nextHand(settled, seededRandomInt(2)));
    expect(cues[0]).toBe('shuffle');
    expect(cues.filter((s) => s === 'deal')).toHaveLength(13);
  });

  it('lands the three cards passed to you', () => {
    const g = seededGame(1);
    expect(sounds(g, passCards(g, g.players.map((p) => p.hand.slice(0, 3))))).toEqual(['deal', 'deal', 'deal']);
  });

  it('plays a card, and chimes when hearts are broken', () => {
    const g = table(DEAL);
    expect(sounds(g, play(g, '2C'))).toEqual(['play']);
    const before = playAll(g, '2C 6C 10C AC  AD 2D');
    expect(sounds(before, play(before, '2H'))).toEqual(['play', 'broken']); // seat 1 has no diamonds
  });

  it('gathers a taken trick, and stings when you take the queen of spades', () => {
    const g = table({ ...DEAL, 0: '2C 3C 4C 5C 2D 3D 4D 5D 6D 2S 3S 4S AS', 3: 'AC AD QS 4H 5H 6H 10H JH QH KH AH 7D 8D' });
    const first = ['2C', '6C', '10C', 'AC'].reduce(play, g);
    expect(sounds(first, collect(first))).toEqual(['gather']);
    // Seat 3 leads the queen of spades, and your ace takes it.
    const queen = ['QS', 'AS', '6S', '10S'].reduce(play, collect(first));
    expect(queen.winner).toBe(0);
    expect(sounds(queen, collect(queen))).toEqual(['gather', 'lose']);
  });

  it('a fanfare when you shoot the moon, and a groan when someone else does', () => {
    const [before, after] = lastChange(moonDeal(0), 0);
    expect(after.result?.moon).toBe(0);
    expect(sounds(before, after)).toEqual(['gather', 'bigWin']);
    const [b2, a2] = lastChange(moonDeal(3), 3);
    expect(a2.result?.moon).toBe(3);
    expect(sounds(b2, a2)).toEqual(['gather', 'lose']);
  });

  it('a jingle for a hand in which you took no points', () => {
    for (let seed = 1; ; seed++) {
      expect(seed, 'no hand left you without points').toBeLessThan(50);
      const g = seededGame(seed);
      const [before, after] = lastChange(passCards(g, g.players.map((p) => p.hand.slice(0, 3))), -1);
      if (after.result!.moon !== null || after.result!.points[0] !== 0) continue;
      expect(sounds(before, after)).toEqual(['gather', 'win']);
      break;
    }
  });

  it('the fanfare when you win the game, and game over when you lose it', () => {
    const [before] = lastChange(moonDeal(0), 0);
    const winning = { ...before, players: before.players.map((p) => ({ ...p, score: p.id === 0 ? 0 : 90 })) };
    expect(sounds(winning, collect(winning))).toEqual(['gather', 'bigWin', 'bigWin']); // the moon, then the game
    const [b2] = lastChange(moonDeal(3), 3);
    const losing = { ...b2, players: b2.players.map((p) => ({ ...p, score: p.id === 0 ? 90 : 0 })) };
    expect(sounds(losing, collect(losing))).toEqual(['gather', 'lose', 'gameOver']);
  });
});
