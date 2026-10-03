import { mulberry32, seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { chooseBid, decide, estimateTricks } from './bot';
import { HAND_SIZE } from './constants';
import { cardKey, isGameOver, nextHand, placeBid } from './game';
import { autoplay, bidAll, cards, playAll, seededGame, withHands } from './testing';
import type { GameState } from './types';

/** Never careless: the random number is always high. */
const sharp = () => 0.99;

const DEAL = {
  0: '2C 3C 4C 5C 2D 3D 4D 5D 2H 3H 4H 5H 2S',
  1: '6C 7C 8C 9C 6D 7D 8D 9D 6H 7H 8H 9H 3S',
  2: '10C JC QC KC 10D JD QD KD 10H JH QH KH 4S',
  3: 'AC AD AH 5S 6S 7S 8S 9S 10S JS QS KS AS',
};

/** The first hand with the given cards and bids (you lead). */
const table = (hands: Record<number, string>, bids = [3, 3, 3, 3]): GameState => bidAll(withHands(seededGame(3), hands), bids);

describe('bidding', () => {
  it('counts high cards, long spades and spades to trump short suits', () => {
    expect(estimateTricks(cards(DEAL[3]))).toBeGreaterThan(11);
    expect(estimateTricks(cards(DEAL[0]))).toBeLessThan(0.5);
    expect(Math.round(estimateTricks(cards('AC KC 2C AD 3D 4D 5D 6H 7H 8H 9H 10H 2S')))).toBe(3);
  });

  it('bids nil with a hand that can lose every trick, but not when its partner already has', () => {
    const g = withHands(seededGame(), { 0: DEAL[0] });
    expect(chooseBid(g, sharp)).toBe(0);
    const partnerNil = { ...g, players: g.players.map((p) => (p.id === 2 ? { ...p, bid: 0 } : p)) };
    expect(chooseBid(partnerNil, sharp)).toBe(1);
  });

  it('never bids nil holding high spades', () => {
    const g = withHands(seededGame(), { 0: '2C 3C 4C 5C 2D 3D 4D 5D 2H 3H 4H 5H AS' });
    expect(chooseBid(g, sharp)).toBe(1);
  });

  it('always bids from nought to thirteen', () => {
    const random = mulberry32(2);
    for (let seed = 1; seed < 40; seed++) {
      let g = seededGame(seed);
      while (g.phase === 'bidding') {
        const bid = chooseBid(g, random);
        expect(bid).toBeGreaterThanOrEqual(0);
        expect(bid).toBeLessThanOrEqual(HAND_SIZE);
        g = placeBid(g, bid);
      }
    }
  });
});

describe('playing', () => {
  it('leads a card nobody can beat when it wants tricks', () => {
    const g = { ...playAll(table(DEAL), '2C 6C 10C AC'), toPlay: 3 };
    expect(cardKey(decide(g, sharp))).toMatch(/^A[DH]$/);
  });

  it('takes a trick as cheaply as it can when last to play', () => {
    const g = playAll(table({ ...DEAL, 1: '6C 7C 8C 9C 6D 7D 8D 9D 6H 7H 8H 9H JD' }), '2C 6C 10C');
    expect(g.toPlay).toBe(3);
    expect(cardKey(decide(g, sharp))).toBe('AC');
  });

  it('does not overtake its partner’s winning card', () => {
    // You lead the ace of clubs, and Grace, your partner, keeps her king back.
    const g = playAll(table({ ...DEAL, 0: 'AC 3C 4C 5C 2D 3D 4D 5D 2H 3H 4H 5H 2S', 3: '2C AD AH 5S 6S 7S 8S 9S 10S JS QS KS AS' }), 'AC 6C');
    expect(g.toPlay).toBe(2);
    expect(cardKey(decide(g, sharp))).toBe('10C');
  });

  it('trumps a trick it cannot otherwise win, with its lowest spade', () => {
    const g = playAll(table({ ...DEAL, 3: 'AD AH 5S 6S 7S 8S 9S 10S JS QS KS AS 2D' }), '2C 6C');
    // Grace takes the lead with the king of clubs, and Lena, out of clubs, trumps it as cheaply as she can.
    const afterGrace = playAll(g, 'KC');
    expect(afterGrace.toPlay).toBe(3);
    expect(cardKey(decide(afterGrace, sharp))).toBe('5S');
  });

  it('a nil bidder plays the highest card that still loses', () => {
    const g = playAll(table({ ...DEAL, 0: 'KC 3C 4C 2C 2D 3D 4D 5D 2H 3H 4H 5H 2S', 2: '10C JC QC 5C 10D JD QD KD 10H JH QH KH 4S' }, [3, 0, 3, 3]), 'KC');
    expect(g.toPlay).toBe(1);
    expect(cardKey(decide(g, sharp))).toBe('9C');
  });

  it('only ever plays a card it may play', () => {
    let g = seededGame(21);
    for (let hand = 1; hand <= 40 && !isGameOver(g); hand++) {
      g = autoplay(g, hand); // placeBid and playCard throw on anything not allowed
      if (!isGameOver(g)) g = nextHand(g, seededRandomInt(hand));
    }
    expect(isGameOver(g)).toBe(true);
  });
});

describe('over many hands', () => {
  it('makes most of its bids and most of its nils', () => {
    let made = 0;
    let bids = 0;
    let nils = 0;
    let nilsMade = 0;
    let g = seededGame(1);
    for (let hand = 1; hand <= 400; hand++) {
      g = autoplay(g, hand);
      for (const result of g.result!) {
        bids++;
        if (result.contract >= 0) made++;
      }
      for (const p of g.players.filter((p) => p.bid === 0)) {
        nils++;
        if (p.tricks === 0) nilsMade++;
      }
      g = nextHand({ ...g, teams: g.teams.map(() => ({ score: 0, bags: 0 })) }, seededRandomInt(hand));
    }
    expect(made / bids).toBeGreaterThan(0.6);
    expect(nils).toBeGreaterThan(10);
    expect(nilsMade / nils).toBeGreaterThan(0.5);
  });
});
