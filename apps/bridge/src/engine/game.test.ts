import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { HAND_SIZE, PLAYERS } from './constants';
import {
  PASS,
  bid,
  cardKey,
  collect,
  contractOf,
  controllerOf,
  dummyShown,
  honours,
  isBotTurn,
  isGameOver,
  isLegalCall,
  legalCards,
  makeCall,
  nextHand,
  playCard,
  scoreContract,
  trickPoints,
  undertrickPoints,
  winningPlay,
  winningTeam,
} from './game';
import { auction, autoplay, calls, cards, playAll, seededGame, withHands } from './testing';
import type { Card, Contract, GameState, Turn } from './types';

const keys = (list: readonly Card[]) => list.map(cardKey).sort();

/** Each seat holds a whole suit, more or less: easy to follow. */
const HANDS = {
  0: 'AS KS QS JS 10S 9S 8S 7S 6S 5S 4S 3S 2S',
  1: 'AH KH QH JH 10H 9H 8H 7H 6H 5H 4H 3H 2H',
  2: 'AD KD QD JD 10D 9D 8D 7D 6D 5D 4D 3D 2D',
  3: 'AC KC QC JC 10C 9C 8C 7C 6C 5C 4C 3C 2C',
};

/** Turns from text, with seats from the dealer (0). */
const turns = (text: string, dealer = 0): Turn[] => calls(text).map((call, i) => ({ seat: (dealer + i) % PLAYERS, call }));

const contract = (level: number, strain: Contract['strain'], doubled: 0 | 1 | 2 = 0, declarer = 0): Contract => ({ level, strain, doubled, declarer });
const noHonours = Array.from({ length: 4 }, () => [] as Card[]);

describe('the deal and the auction', () => {
  it('deals thirteen different cards to each player, and you deal and call first', () => {
    const g = seededGame();
    expect(g.players.every((p) => p.hand.length === HAND_SIZE)).toBe(true);
    expect(new Set(g.players.flatMap((p) => p.hand.map(cardKey))).size).toBe(52);
    expect(g.phase).toBe('bidding');
    expect(g.dealer).toBe(0);
    expect(g.toPlay).toBe(0);
  });

  it('only allows a higher bid, a double of the other side and a redouble of a double', () => {
    const g = auction(seededGame(), '1H');
    expect(isLegalCall(g, bid(1, 'H'))).toBe(false);
    expect(isLegalCall(g, bid(1, 'D'))).toBe(false);
    expect(isLegalCall(g, bid(1, 'S'))).toBe(true);
    expect(isLegalCall(g, bid(1, 'NT'))).toBe(true);
    expect(isLegalCall(g, { kind: 'double' })).toBe(true);
    expect(isLegalCall(g, { kind: 'redouble' })).toBe(false);
    // Partner may not double their own side's bid.
    expect(isLegalCall(auction(g, 'P'), { kind: 'double' })).toBe(false);
    const doubled = auction(g, 'X');
    expect(isLegalCall(doubled, { kind: 'redouble' })).toBe(true);
    expect(isLegalCall(doubled, bid(8, 'C'))).toBe(false);
  });

  it('ends after three passes, and the first of the side to name the strain declares', () => {
    expect(contractOf(turns('1H P 2H P 4H P P P'))).toEqual(contract(4, 'H', 0, 0));
    // Partner bid hearts first, so partner declares.
    expect(contractOf(turns('1C P 1H P 4H P P P'))).toEqual(contract(4, 'H', 0, 2));
    expect(contractOf(turns('1NT X XX P P P'))).toEqual(contract(1, 'NT', 2, 0));
    expect(contractOf(turns('1S X 2S P P P'))).toEqual(contract(2, 'S', 0, 0));
    const g = auction(seededGame(), '1H P 2H P P P');
    expect(g.phase).toBe('playing');
    expect(g.toPlay).toBe(1); // on the declarer's left
  });

  it('a hand passed out by all four scores nothing', () => {
    const g = auction(seededGame(), 'P P P P');
    expect(g.phase).toBe('settled');
    expect(g.result).toMatchObject({ contract: null, entries: [] });
    expect(nextHand(g, seededRandomInt(2)).dealer).toBe(1);
  });
});

describe('playing', () => {
  /** You declare 1♠; Arjun leads. */
  const playing = (): GameState => auction(withHands(seededGame(), HANDS), '1S P P P');

  it('must follow suit when it can', () => {
    const g = withHands(playing(), { 2: 'AH AD KD QD JD 10D 9D 8D 7D 6D 5D 4D 3D' });
    const next = playAll(g, '2H');
    expect(keys(legalCards(next))).toEqual(['AH']);
  });

  it('the highest trump wins, or the highest card of the suit led', () => {
    const trick = (text: string) => cards(text).map((card, i) => ({ seat: i, card }));
    expect(winningPlay(trick('5D AH KD 9D'), 'S')?.seat).toBe(2);
    expect(winningPlay(trick('5D 2S KD 9D'), 'S')?.seat).toBe(1);
    expect(winningPlay(trick('5D 2S KD 9D'), null)?.seat).toBe(2);
  });

  it('shows the dummy after the opening lead, and the declarer plays its cards', () => {
    const g = auction(withHands(seededGame(), HANDS), 'P 1H P P P'); // Arjun declares, Mei is the dummy
    expect(dummyShown(g)).toBe(false);
    expect(g.toPlay).toBe(2);
    const led = playAll(g, '2D');
    expect(dummyShown(led)).toBe(true);
    expect(controllerOf(led, 3)).toBe(1);
    expect(isBotTurn(led)).toBe(true);
  });

  it('your partner playing your cards as the dummy is not your turn', () => {
    const g = auction(withHands(seededGame(), HANDS), 'P P 1D P P P'); // Helen declares, you are the dummy
    const led = playAll(g, '2C 2S');
    expect(led.toPlay).toBe(1);
    const yours = playAll(auction(withHands(seededGame(), HANDS), 'P P 1D P P P'), '2C');
    expect(yours.toPlay).toBe(0);
    expect(isBotTurn(yours)).toBe(true);
  });

  it('waits after the fourth card for the trick to be collected, then the winner leads', () => {
    const full = playAll(playing(), '2H 2D 2C');
    const fourth = playCard(full, cards('2S')[0]!);
    expect(fourth.phase).toBe('collecting');
    expect(fourth.winner).toBe(0);
    const next = collect(fourth);
    expect(next.toPlay).toBe(0);
    expect(next.players[0]!.tricks).toBe(1);
    expect(next.taken).toHaveLength(1);
  });
});

describe('scoring', () => {
  it('contract points: 20 a minor trick, 30 a major, 40 then 30 at no trumps', () => {
    expect([trickPoints('C', 3), trickPoints('H', 4), trickPoints('NT', 3)]).toEqual([60, 120, 100]);
  });

  it('a contract made, with overtricks, a slam, and doubled', () => {
    expect(scoreContract(contract(4, 'S'), 11, [false, false], noHonours)).toEqual([
      { team: 0, below: true, points: 120, kind: 'contract' },
      { team: 0, below: false, points: 30, kind: 'overtricks' },
    ]);
    expect(scoreContract(contract(6, 'NT'), 12, [true, false], noHonours).find((e) => e.kind === 'slam')?.points).toBe(750);
    const doubled = scoreContract(contract(2, 'H', 1), 9, [false, false], noHonours);
    expect(doubled).toEqual([
      { team: 0, below: true, points: 120, kind: 'contract' },
      { team: 0, below: false, points: 100, kind: 'overtricks' },
      { team: 0, below: false, points: 50, kind: 'insult' },
    ]);
  });

  it('undertricks, for the defenders', () => {
    expect(undertrickPoints(2, 0, false)).toBe(100);
    expect(undertrickPoints(2, 0, true)).toBe(200);
    expect([1, 2, 3, 4, 5].map((n) => undertrickPoints(n, 1, false))).toEqual([100, 300, 500, 800, 1100]);
    expect([1, 2, 3].map((n) => undertrickPoints(n, 1, true))).toEqual([200, 500, 800]);
    expect(undertrickPoints(1, 2, true)).toBe(400);
    expect(scoreContract(contract(4, 'S', 0, 1), 8, [false, false], noHonours)).toEqual([{ team: 0, below: false, points: 100, kind: 'undertricks' }]);
  });

  it('honours, for whichever side holds them', () => {
    const dealt = [cards('AH KH QH JH'), cards('10H'), [], []];
    expect(honours(dealt, 'H')).toEqual({ team: 0, points: 100 });
    expect(honours([cards('AH KH QH JH 10H'), [], [], []], 'H')).toEqual({ team: 0, points: 150 });
    expect(honours([[], cards('AS AH AD AC'), [], []], 'NT')).toEqual({ team: 1, points: 150 });
    expect(honours(dealt, 'S')).toBeNull();
  });

  it('a hundred below the line wins a game; two games win the rubber', () => {
    // You hold every spade, so you take all thirteen tricks in 4♠ each time.
    let g = auction(withHands(seededGame(), HANDS), '4S P P P');
    g = autoplay(g);
    expect(g.result).toMatchObject({ margin: 3, game: 0, rubber: null });
    expect(g.teams[0]).toMatchObject({ games: 1, partScore: 0, total: 120 + 90 + 150 });
    g = nextHand(g, seededRandomInt(5));
    // Arjun deals; you open after him.
    g = autoplay(auction(withHands(g, HANDS), 'P 4S P P P'));
    expect(g.result).toMatchObject({ game: 0, rubber: 0 });
    expect(g.result!.entries.find((e) => e.kind === 'rubber')?.points).toBe(700);
    expect(winningTeam(g)).toBe(0);
    expect(() => nextHand(g)).toThrow();
  });

  it('every hand takes thirteen tricks, and a rubber always ends', () => {
    let g = seededGame(11);
    for (let hand = 1; hand <= 40 && !isGameOver(g); hand++) {
      const before = g.teams.map((t) => t.total);
      g = autoplay(g, hand);
      if (g.result!.contract) expect(g.taken).toHaveLength(HAND_SIZE);
      const points = (t: number) => g.result!.entries.filter((e) => e.team === t).reduce((sum, e) => sum + e.points, 0);
      expect(g.teams.map((t) => t.total)).toEqual(before.map((s, t) => s + points(t)));
      if (!isGameOver(g)) g = nextHand(g, seededRandomInt(hand));
    }
    expect(isGameOver(g)).toBe(true);
    expect(g.history.length).toBe(g.hand);
  });

  it('refuses a card or a call out of turn', () => {
    const g = seededGame();
    expect(() => makeCall(auction(g, '1NT'), bid(1, 'C'))).toThrow();
    expect(() => playCard(g, g.players[0]!.hand[0]!)).toThrow();
    expect(makeCall(g, PASS).toPlay).toBe(1);
  });
});
