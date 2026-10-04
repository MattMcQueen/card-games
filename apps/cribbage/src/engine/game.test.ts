import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { GAME_POINTS } from './constants';
import {
  cardKey,
  collect,
  discard,
  gameWinner,
  handTotal,
  isGameOver,
  isSkunk,
  legalCards,
  mustGo,
  nextHand,
  playCard,
  runRank,
  sayGo,
  showNext,
  type GameState,
} from './index';
import { autoplay, cards, discardAll, playAll, seededGame } from './testing';
import { withHands } from './testing';

/** Sets both players' scores. */
const scores = (state: GameState, yours: number, theirs: number): GameState => ({
  ...state,
  players: state.players.map((p) => ({ ...p, score: p.id === 0 ? yours : theirs, previous: p.id === 0 ? yours : theirs })),
});

/**
 * A hand Ruth deals, so you play first. You keep 10C 10D 5H 4S and Ruth KC 9D 8H 7S; the crib is AC 2C 3D 3H and the
 * starter the 6 of clubs.
 */
const goHand = (): GameState =>
  discardAll(withHands(seededGame(), { 0: '10C 10D 5H 4S AC 2C', 1: 'KC 9D 8H 7S 3D 3H' }, '6C', 1), { 0: 'AC 2C', 1: '3D 3H' });

/** A hand Ruth deals where you lead the 5 of hearts, and Ruth holds only ten-cards. */
const pairHand = (): GameState =>
  discardAll(withHands(seededGame(), { 0: '5H 10D 2S 3S AC 2C', 1: '10C KD QH JS 4D 4H' }, '9C', 1), { 0: 'AC 2C', 1: '4D 4H' });

const points = (state: GameState) => state.players.map((p) => p.score);

describe('the deal', () => {
  it('cuts for the first deal: the lower card deals', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const g = seededGame(seed);
      const [yours, theirs] = g.cut.map(runRank) as [number, number];
      expect(yours).not.toBe(theirs);
      expect(g.dealer).toBe(yours < theirs ? 0 : 1);
    }
  });

  it('deals six cards each from a fresh deck, with no card twice', () => {
    const g = seededGame(3);
    expect(g.phase).toBe('discarding');
    expect(g.players.map((p) => p.hand.length)).toEqual([6, 6]);
    const all = [...g.players.flatMap((p) => p.hand), ...g.stock].map(cardKey);
    expect(new Set(all).size).toBe(52);
  });

  it('passes the deal, and the crib, to the other player each hand, keeping the scores', () => {
    const done = autoplay(seededGame(2));
    const next = nextHand(done, seededRandomInt(9));
    expect(next.dealer).toBe(1 - done.dealer);
    expect(next.hand).toBe(2);
    expect(points(next)).toEqual(points(done));
    expect(next.players.map((p) => p.hand.length)).toEqual([6, 6]);
  });
});

describe('the crib and the starter', () => {
  it('takes two cards from each player for the dealer’s crib, cuts the starter, and the other player plays first', () => {
    const g = goHand();
    expect(g.phase).toBe('pegging');
    expect(g.crib.map(cardKey)).toEqual(['AC', '2C', '3D', '3H']);
    expect(g.players[0]!.kept.map(cardKey)).toEqual(['4S', '5H', '10C', '10D']);
    expect(cardKey(g.starter!)).toBe('6C');
    expect(g.toPlay).toBe(0);
  });

  it('only takes two of a player’s own cards', () => {
    const g = withHands(seededGame(), { 0: '10C 10D 5H 4S AC 2C', 1: 'KC 9D 8H 7S 3D 3H' }, '6C', 1);
    const theirs = cards('3D 3H');
    expect(() => discard(g, [cards('AC'), theirs])).toThrow();
    expect(() => discard(g, [cards('AC KC'), theirs])).toThrow();
    expect(() => discard(g, [cards('AC AC'), theirs])).toThrow();
  });

  it('gives the dealer two for his heels when the starter is a jack', () => {
    const g = discardAll(withHands(seededGame(), { 0: '10C 10D 5H 4S AC 2C', 1: 'KC 9D 8H 7S 3D 3H' }, 'JC', 1), { 0: 'AC 2C', 1: '3D 3H' });
    expect(points(g)).toEqual([0, 2]);
    expect(g.scored).toEqual({ seat: 1, points: 2, pegs: [{ kind: 'heels', points: 2 }] });
    expect(g.tally[1]!.pegging).toBe(2);
  });
});

describe('the play', () => {
  it('only lets a player lay a card that keeps the count at 31 or under', () => {
    const g = playAll(goHand(), '10C KC 10D');
    expect(g.count).toBe(30);
    expect(g.toPlay).toBe(1);
    expect(legalCards(g)).toEqual([]);
    expect(mustGo(g)).toBe(true);
    expect(() => playCard(g, cards('7S')[0]!)).toThrow();
    // Nor out of turn, nor while it is someone else's turn to say go.
    expect(legalCards(g, 0)).toEqual([]);
    expect(() => sayGo(playAll(goHand(), '10C'))).toThrow();
  });

  it('pegs fifteens and pairs for whoever makes them', () => {
    const g = playAll(pairHand(), '5H 10C');
    expect(points(g)).toEqual([0, 2]);
    expect(g.scored).toEqual({ seat: 1, points: 2, pegs: [{ kind: 'fifteen', points: 2 }] });
    expect(points(playAll(g, '10D'))).toEqual([2, 2]);
  });

  it('after a go, the other player carries on while they can, and pegs one for the go', () => {
    const g = playAll(pairHand(), '5H 10C 10D');
    // Ruth holds only ten-cards, at a count of 25: go. You play on.
    const said = sayGo(g);
    expect(said.go).toEqual([false, true]);
    expect(said.toPlay).toBe(0);
    const on = playAll(said, '2S');
    expect(on.toPlay).toBe(0);
    // Your last card makes 30, and neither of you can go on: one for the go.
    const done = playAll(on, '3S');
    expect(done.phase).toBe('collecting');
    expect(done.lastPlayer).toBe(0);
    expect(done.scored).toEqual({ seat: 0, points: 1, pegs: [{ kind: 'go', points: 1 }] });
    expect(points(done)).toEqual([3, 2]);
    // The count starts again, led by Ruth, who did not play the last card.
    const next = collect(done);
    expect([next.phase, next.count, next.pile.length, next.toPlay]).toEqual(['pegging', 0, 0, 1]);
  });

  it('ends a count at 31 with two for thirty-one, and no point for the go', () => {
    const g = discardAll(withHands(seededGame(), { 0: '10C 10D AS 4S AC 2C', 1: 'KC 9D 8H 7S 3D 3H' }, '6C', 1), { 0: 'AC 2C', 1: '3D 3H' });
    const done = playAll(g, '10C KC 10D AS');
    expect(done.phase).toBe('collecting');
    expect(done.scored).toEqual({ seat: 0, points: 2, pegs: [{ kind: 'thirtyOne', points: 2 }] });
    expect(collect(done).toPlay).toBe(1);
  });

  it('plays a whole hand: goes, the last card, then the show in order, the crib last', () => {
    // You: 10C, Ruth KC, you 10D for 30. Ruth cannot go on and neither can you: one for the go to you.
    let g = sayGo(playAll(goHand(), '10C KC 10D'));
    expect(g.scored?.pegs).toEqual([{ kind: 'go', points: 1 }]);
    // Ruth leads: 9D, 4S, 8H, 5H for 26. Ruth's 7 would make 33, and you have no cards: one for the go to you.
    g = sayGo(playAll(collect(g), '9D 4S 8H 5H'));
    expect(points(g)).toEqual([2, 0]);
    // Ruth plays her last card alone: one for the last card.
    g = playAll(collect(g), '7S');
    expect(g.scored).toEqual({ seat: 1, points: 1, pegs: [{ kind: 'lastCard', points: 1 }] });

    // Your hand is counted first, as you did not deal: 10-5 twice, 4-5-6, the pair of tens and the run 4-5-6.
    g = collect(g);
    expect(g.phase).toBe('showing');
    expect(g.shows.map((s) => [s.seat, s.crib, s.count.total])).toEqual([[0, false, 11]]);
    expect(points(g)).toEqual([13, 1]);
    // Then Ruth's: 9-6, 8-7 and the run 6-7-8-9.
    g = showNext(g);
    expect(g.shows.at(-1)!.count.total).toBe(8);
    // Then her crib: A-2-3-3 with the 6, fifteen two, a pair is four and a double run of three is ten.
    g = showNext(g);
    expect(g.shows.map((s) => [s.seat, s.crib, s.count.total])).toEqual([[0, false, 11], [1, false, 8], [1, true, 10]]);
    expect(g.phase).toBe('settled');
    expect(points(g)).toEqual([13, 19]);
    expect(g.tally).toEqual([{ pegging: 2, hand: 11, crib: 0 }, { pegging: 1, hand: 8, crib: 10 }]);
    expect(g.history).toEqual([g.tally]);
  });
});

describe('winning', () => {
  it('ends the game the moment a player reaches 121, even in the play', () => {
    const g = playAll(scores(pairHand(), 120, 50), '5H 10C 10D');
    expect(g.phase).toBe('settled');
    expect(gameWinner(g)).toBe(0);
    expect(points(g)).toEqual([GAME_POINTS, 52]);
    expect(g.history).toHaveLength(1);
    expect(() => nextHand(g)).toThrow();
  });

  it('counts the non-dealer’s hand first, so they can win before the dealer counts', () => {
    let g = sayGo(playAll(scores(goHand(), 108, 115), '10C KC 10D'));
    g = playAll(sayGo(playAll(collect(g), '9D 4S 8H 5H')), '7S');
    expect(points(g)).toEqual([110, 116]);
    g = collect(g);
    expect(g.phase).toBe('settled');
    expect(gameWinner(g)).toBe(0);
    expect(g.shows).toHaveLength(1);
  });

  it('skunks a loser who has not reached 91', () => {
    const over = playAll(scores(pairHand(), 120, 50), '5H 10C 10D');
    expect(isSkunk(over)).toBe(true);
    expect(isSkunk(playAll(scores(pairHand(), 120, 95), '5H 10C 10D'))).toBe(false);
    expect(isSkunk(pairHand())).toBe(false);
  });
});

describe('whole games', () => {
  /** Plays a game to the end with the computer player's choices for both seats, checking each hand. */
  function playGame(seed: number): GameState {
    let g = seededGame(seed);
    for (;;) {
      g = autoplay(g, seed * 100 + g.hand);
      expect(g.crib).toHaveLength(4);
      expect(g.players.every((p) => p.kept.length === 4)).toBe(true);
      if (isGameOver(g)) return g;
      expect(g.shows).toHaveLength(3);
      g = nextHand(g, seededRandomInt(seed * 1000 + g.hand));
    }
  }

  it('reaches 121, and the score sheet adds up to the scores', () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const g = playGame(seed);
      const winner = gameWinner(g);
      expect(g.players[winner]!.score).toBe(GAME_POINTS);
      const sheet = g.players.map((p) => g.history.reduce((sum, hand) => sum + handTotal(hand[p.id]!), 0));
      expect(sheet[1 - winner]).toBe(g.players[1 - winner]!.score);
      expect(sheet[winner]).toBeGreaterThanOrEqual(GAME_POINTS);
      expect(g.hand).toBeGreaterThan(4);
      expect(g.hand).toBeLessThan(25);
    }
  });
});
