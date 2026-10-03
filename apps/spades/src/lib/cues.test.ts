import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { collect, legalCards, nextHand, placeBid, playCard, type GameState } from '../engine';
import { autoplay, bidAll, cards, playAll, seededGame, withHands } from '../engine/testing';
import { cuesFor } from './cues';

const sounds = (prev: GameState, next: GameState) => cuesFor(prev, next, true).map((c) => c.sound);
const play = (state: GameState, card: string) => playCard(state, cards(card)[0]!);

const DEAL = {
  0: '2C 3C 4C 5C 2D 3D 4D 5D 2H 3H 4H 5H 2S',
  1: '6C 7C 8C 9C 6D 7D 8D 9D 6H 7H 8H 9H 3S',
  2: '10C JC QC KC 10D JD QD KD 10H JH QH KH 4S',
  3: 'AD AH 5S 6S 7S 8S 9S 10S JS QS KS AS AC',
};

/** Plays the hand (each player its first allowed card) up to its last trick, about to be collected. */
function lastTrick(state: GameState): GameState {
  let current = state;
  while (current.tricksPlayed < 12 || current.phase !== 'collecting') {
    current = current.phase === 'collecting' ? collect(current) : playCard(current, legalCards(current)[0]!);
  }
  return current;
}

describe('cuesFor', () => {
  it('shuffles and deals a new hand, with a card sound for each round', () => {
    const done = autoplay(seededGame(1));
    const cues = sounds(done, nextHand(done, seededRandomInt(2)));
    expect(cues[0]).toBe('shuffle');
    expect(cues.filter((s) => s === 'deal')).toHaveLength(13);
  });

  it('taps for a bid', () => {
    const g = seededGame(1);
    expect(sounds(g, placeBid(g, 3))).toEqual(['bid']);
  });

  it('plays a card, and chimes when spades are broken', () => {
    const g = bidAll(withHands(seededGame(3), DEAL), [3, 3, 3, 3]);
    expect(sounds(g, play(g, '2C'))).toEqual(['play']);
    const before = playAll(withHands(g, { 3: 'AD AH 5S 6S 7S 8S 9S 10S JS QS KS AS 2D' }), '2C 6C 10C');
    expect(sounds(before, play(before, '5S'))).toEqual(['play', 'broken']);
  });

  it('gathers a taken trick', () => {
    const g = ['2C', '6C', '10C', 'AC'].reduce(play, bidAll(withHands(seededGame(3), DEAL), [3, 3, 3, 3]));
    expect(sounds(g, collect(g))).toEqual(['gather']);
  });

  it('a jingle when the hand goes well, a groan when it does not, and the end of the game', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const last = lastTrick(bidAll(seededGame(seed), [1, 1, 1, 1]));
      const done = collect(last);
      const ours = done.result![0]!;
      expect(sounds(last, done)).toEqual(['gather', ours.contract >= 0 && ours.nil >= 0 ? 'win' : 'lose']);
    }
    const last = lastTrick(bidAll(seededGame(1), [1, 1, 1, 1]));
    const winning = { ...last, teams: [{ score: 600, bags: 0 }, { score: 0, bags: 0 }] };
    expect(sounds(winning, collect(winning))).toEqual(['gather', 'bigWin']);
    const losing = { ...last, teams: [{ score: 0, bags: 0 }, { score: 600, bags: 0 }] };
    expect(sounds(losing, collect(losing))).toEqual(['gather', 'gameOver']);
  });
});
