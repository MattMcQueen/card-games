import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { GAME_OVER_SCORE, HAND_SIZE, PLAYERS } from './constants';
import {
  cardKey,
  collect,
  hasWon,
  isGameOver,
  legalCards,
  nextHand,
  placeBid,
  playCard,
  scoreTeam,
  trickWinner,
  winningTeam,
} from './game';
import { autoplay, bidAll, cards, playAll, seededGame, withHands } from './testing';
import type { Card, GameState, Player } from './types';

const keys = (list: readonly Card[]) => list.map(cardKey).sort();

/** Four hands of thirteen that make for easy tricks: each seat holds one rank of every suit, more or less. */
const HANDS = {
  0: '2C 3C 4C 5C 2D 3D 4D 5D 2H 3H 4H 5H 2S',
  1: '6C 7C 8C 9C 6D 7D 8D 9D 6H 7H 8H 9H 3S',
  2: '10C JC QC KC 10D JD QD KD 10H JH QH KH 4S',
  3: 'AC AD AH 5S 6S 7S 8S 9S 10S JS QS KS AS',
};

/** The first hand, with the rigged cards above, bid 3 each: you lead, as the player on your right dealt. */
const rigged = (): GameState => bidAll(withHands(seededGame(3), HANDS), [3, 3, 3, 3]);

/** A seat's bid and tricks, to score. */
const player = (bid: number, tricks: number): Player => ({ id: 0, name: '', human: false, hand: [], bid, tricks });

describe('dealing and bidding', () => {
  it('deals thirteen cards to each of the four players, all different', () => {
    const g = seededGame();
    expect(g.players).toHaveLength(PLAYERS);
    for (const p of g.players) expect(p.hand).toHaveLength(HAND_SIZE);
    expect(new Set(g.players.flatMap((p) => p.hand.map(cardKey))).size).toBe(52);
  });

  it('sorts each hand by suit with spades last, then rank with aces high', () => {
    const g = withHands(seededGame(), { 0: 'AH 2H KS 3C AC 10D' });
    expect(g.players[0]!.hand.map(cardKey)).toEqual(['3C', 'AC', '10D', '2H', 'AH', 'KS']);
  });

  it('starts with the player on the dealer’s left: you, in the first hand', () => {
    const g = seededGame();
    expect(g.phase).toBe('bidding');
    expect(g.dealer).toBe(3);
    expect(g.toPlay).toBe(0);
  });

  it('takes bids round the table, then the player on the dealer’s left leads', () => {
    let g = seededGame();
    g = placeBid(g, 4);
    expect(g.toPlay).toBe(1);
    g = placeBid(placeBid(placeBid(g, 0), 3), 2);
    expect(g.players.map((p) => p.bid)).toEqual([4, 0, 3, 2]);
    expect(g.phase).toBe('playing');
    expect(g.toPlay).toBe(0);
  });

  it('refuses a bid of more than thirteen, less than nought, or not a whole number', () => {
    const g = seededGame();
    expect(() => placeBid(g, 14)).toThrow();
    expect(() => placeBid(g, -1)).toThrow();
    expect(() => placeBid(g, 2.5)).toThrow();
  });

  it('passes the deal to the left each hand', () => {
    let g = seededGame(5);
    const dealers = [g.dealer];
    for (let hand = 1; hand < 4; hand++) {
      g = nextHand(autoplay(g, hand), seededRandomInt(hand));
      dealers.push(g.dealer);
    }
    expect(dealers).toEqual([3, 0, 1, 2]);
    expect(g.toPlay).toBe(3);
  });
});

describe('playing', () => {
  it('must follow suit when it can', () => {
    const g = playCard(rigged(), cards('2C')[0]!);
    expect(keys(legalCards(g))).toEqual(keys(cards('6C 7C 8C 9C')));
  });

  it('may not lead spades until one has been played, unless the hand is all spades', () => {
    const g = rigged();
    expect(legalCards(g).some((c) => c.suit === 'S')).toBe(false);
    const onlySpades = withHands(g, { 0: '2S 3S' });
    expect(legalCards(onlySpades)).toHaveLength(2);
  });

  it('spades are broken once one is played, and can be led after', () => {
    // Seat 3 has no clubs, so it trumps.
    const g = withHands(rigged(), { 3: 'AD AH 5S 6S 7S 8S 9S 10S JS QS KS AS' });
    const next = playAll(g, '2C 6C 10C 5S');
    expect(next.spadesBroken).toBe(true);
    expect(next.toPlay).toBe(3); // the spade took it
    expect(legalCards(next).some((c) => c.suit === 'S')).toBe(true);
  });

  it('the highest spade wins, or with no spade the highest card of the suit led', () => {
    const trick = (text: string) => cards(text).map((card, i) => ({ seat: (i + 2) % 4, card }));
    expect(trickWinner(trick('5D AH KD 9D'))).toBe(0); // the king of the suit led
    expect(trickWinner(trick('5D 2S KD 3S'))).toBe(1); // the higher of two spades
    expect(trickWinner(trick('5S 2D AD 3S'))).toBe(2); // spades led
  });

  it('waits after the fourth card for the trick to be collected, then the winner leads', () => {
    const full = ['2C', '6C', '10C', 'AC'].reduce((g, c) => playCard(g, cards(c)[0]!), rigged());
    expect(full.phase).toBe('collecting');
    expect(full.winner).toBe(3);
    expect(full.toPlay).toBe(-1);
    const next = collect(full);
    expect(next.trick).toEqual([]);
    expect(next.toPlay).toBe(3);
    expect(next.players[3]!.tricks).toBe(1);
    expect(next.played).toHaveLength(4);
    expect(next.tricksPlayed).toBe(1);
  });
});

describe('scoring', () => {
  it('ten a trick bid and a point for each trick over, when the bid is made', () => {
    expect(scoreTeam([player(3, 4), player(2, 2)], 0)).toMatchObject({ bid: 5, tricks: 6, contract: 50, bags: 1, points: 51 });
  });

  it('minus ten a trick bid when it is not', () => {
    expect(scoreTeam([player(4, 1), player(3, 3)], 0)).toMatchObject({ contract: -70, bags: 0, points: -70 });
  });

  it('a hundred for a nil made, and minus a hundred for one that fails, whose tricks count for the partner', () => {
    expect(scoreTeam([player(0, 0), player(4, 4)], 0)).toMatchObject({ nil: 100, points: 140 });
    // The nil bidder's two tricks help the partner make 4, and one is a bag.
    expect(scoreTeam([player(0, 2), player(4, 3)], 0)).toMatchObject({ nil: -100, contract: 40, bags: 1, points: -59 });
  });

  it('every tenth bag costs a hundred', () => {
    expect(scoreTeam([player(3, 5), player(2, 3)], 7)).toMatchObject({ bags: 3, penalty: -100, points: 50 + 3 - 100 });
    expect(scoreTeam([player(3, 5), player(2, 3)], 6)).toMatchObject({ penalty: 0 });
  });

  it('carries the bags over, less ten for each penalty', () => {
    const settled = autoplay({ ...seededGame(4), teams: [{ score: 0, bags: 9 }, { score: 0, bags: 0 }] }, 4);
    const [us] = settled.result!;
    expect(settled.teams[0]!.bags).toBe((9 + us!.bags) % 10);
    expect(us!.penalty).toBe(us!.bags > 0 ? -100 : 0);
  });

  it('every hand takes thirteen tricks between the four players, and adds to the score sheet', () => {
    let g = seededGame(11);
    for (let hand = 1; hand <= 40 && !isGameOver(g); hand++) {
      const before = g.teams.map((t) => t.score);
      g = autoplay(g, hand);
      expect(g.players.reduce((sum, p) => sum + p.tricks, 0)).toBe(HAND_SIZE);
      expect(g.result!.reduce((sum, r) => sum + r.tricks, 0)).toBe(HAND_SIZE);
      expect(g.teams.map((t) => t.score)).toEqual(before.map((s, t) => s + g.result![t]!.points));
      if (!isGameOver(g)) g = nextHand(g, seededRandomInt(hand));
    }
    expect(isGameOver(g)).toBe(true);
    expect(g.history.length).toBe(g.hand);
  });

  it('ends the game once a partnership reaches 500, and the higher score wins', () => {
    const settled = autoplay(seededGame(2));
    const scores = (us: number, them: number) => ({ ...settled, teams: [{ score: us, bags: 0 }, { score: them, bags: 0 }] });
    expect(winningTeam(scores(GAME_OVER_SCORE, 300))).toBe(0);
    expect(hasWon(scores(GAME_OVER_SCORE, 300))).toBe(true);
    expect(winningTeam(scores(510, 530))).toBe(1);
    expect(winningTeam(scores(490, 300))).toBeNull();
    // Both on the same score past 500: play on.
    expect(isGameOver(scores(520, 520))).toBe(false);
    expect(() => nextHand(scores(GAME_OVER_SCORE, 0))).toThrow();
  });
});
