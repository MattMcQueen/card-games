import { describe, expect, it } from 'vitest';
import { BIG_BLIND, SEATS, SMALL_BLIND, STARTING_STACK } from './constants';
import type { RandomInt } from './deck';
import { act, isBotTurn, isGameOver, legalActions, newGame, nextHand, potSize } from './game';
import type { Action, GameState } from './types';
import { chipsInPlay, gameWithButton, play, rig, seededRandomInt, withChips } from './testing';

// Seat 0 has the button, so seat 1 is the small blind, seat 2 the big blind and seat 3 acts first.
// After the flop the order is 1, 2, 3, 4, 5, 0.
const start = () => gameWithButton(0);
const BOARD = '2c 7d 9h Jc 4s';
const chips = (state: ReturnType<typeof start>, seat: number) => state.seats[seat]?.chips;
const CALL_ROUND = ['call', 'call', 'call', 'call', 'call', 'check']; // everyone limps, the big blind checks
const checks = (n: number) => Array<string>(n).fill('check');

describe('dealing a hand', () => {
  it('deals two cards each, posts the blinds and starts with the seat after the big blind', () => {
    const g = start();
    expect(g.seats.every((s) => s.hole.length === 2)).toBe(true);
    expect(g.button).toBe(0);
    expect([g.smallBlind, g.bigBlind, g.toAct]).toEqual([1, 2, 3]);
    expect(g.seats[1]?.bet).toBe(SMALL_BLIND);
    expect(g.seats[2]?.bet).toBe(BIG_BLIND);
    expect(chips(g, 1)).toBe(STARTING_STACK - SMALL_BLIND);
    expect(g.currentBet).toBe(BIG_BLIND);
    expect(g.deck).toHaveLength(52 - SEATS * 2);
    const all = [...g.deck, ...g.seats.flatMap((s) => s.hole)].map((c) => c.rank + c.suit);
    expect(new Set(all).size).toBe(52);
  });

  it('lets the seat facing the blind fold, call or raise, but not check', () => {
    expect(legalActions(start())).toMatchObject({
      canCheck: false,
      canCall: true,
      toCall: 10,
      canRaise: true,
      minRaiseTo: 20,
      maxRaiseTo: 1000,
    });
  });

  it('moves the button on each hand', () => {
    const next = nextHand(play(start(), 'fold', 'fold', 'fold', 'fold', 'fold'), seededRandomInt(5));
    expect(next.button).toBe(1);
    expect(next.hand).toBe(2);
    expect([next.smallBlind, next.bigBlind, next.toAct]).toEqual([2, 3, 4]);
  });
});

describe('a hand everyone folds', () => {
  it('goes to the big blind without a showdown, who gets the small blind', () => {
    const g = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(g.phase).toBe('settled');
    expect(g.showdown).toBe(false);
    expect(chips(g, 2)).toBe(STARTING_STACK + SMALL_BLIND);
    expect(chips(g, 1)).toBe(STARTING_STACK - SMALL_BLIND);
    expect(g.results[2]).toMatchObject({ won: 15, net: 5, rank: null });
    expect(g.log.at(-1)).toMatchObject({ kind: 'win', seat: 2, amount: 10 });
  });

  it('hands back a raise nobody called', () => {
    const g = play(start(), 'raise 40', 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(chips(g, 3)).toBe(STARTING_STACK + 15);
    expect(g.pots.map((p) => [p.amount, p.uncalled])).toEqual([
      [25, false],
      [30, true],
    ]);
    expect(g.results[3]?.net).toBe(15);
  });
});

describe('streets', () => {
  it('deals the flop, turn and river once the betting is closed, and the small blind acts first after the flop', () => {
    let g = play(start(), ...CALL_ROUND);
    expect(g.street).toBe('flop');
    expect(g.board).toHaveLength(3);
    expect(g.deck).toHaveLength(52 - 12 - 1 - 3);
    expect(g.toAct).toBe(1);
    expect(g.currentBet).toBe(0);
    expect(g.seats.every((s) => s.bet === 0)).toBe(true);
    expect(potSize(g)).toBe(60);
    g = play(g, ...checks(6));
    expect([g.street, g.board.length]).toEqual(['turn', 4]);
    g = play(g, ...checks(6));
    expect([g.street, g.board.length]).toEqual(['river', 5]);
  });

  it('gives the big blind the option to raise when everyone has just called', () => {
    const g = play(start(), 'call', 'call', 'call', 'call', 'call');
    expect(g.street).toBe('preflop');
    expect(g.toAct).toBe(2);
    expect(legalActions(g)).toMatchObject({ canCheck: true, canRaise: true, minRaiseTo: 20 });
  });

  it('stays on the street while someone still has to answer a raise', () => {
    const g = play(start(), 'call', 'call', 'call', 'call', 'call', 'raise 30');
    expect(g.street).toBe('preflop');
    expect(g.toAct).toBe(3);
    expect(g.seats.filter((s) => !s.folded && s.bet < 30)).toHaveLength(5);
  });
});

describe('raising', () => {
  it('needs a raise at least as big as the last one', () => {
    const g = play(start(), 'raise 30'); // a raise of 20 on the big blind
    expect(legalActions(g).minRaiseTo).toBe(50);
    expect(() => act(g, { type: 'raise', to: 40 })).toThrow();
    expect(act(g, { type: 'raise', to: 50 }).minRaise).toBe(20);
    expect(act(g, { type: 'raise', to: 100 }).minRaise).toBe(70);
  });

  it('refuses moves that are not allowed', () => {
    expect(() => act(start(), { type: 'check' })).toThrow();
    const g = play(start(), ...CALL_ROUND);
    expect(() => act(g, { type: 'call' })).toThrow();
  });

  it('makes the minimum bet after the flop a big blind', () => {
    const g = play(start(), ...CALL_ROUND);
    expect(legalActions(g)).toMatchObject({ minRaiseTo: BIG_BLIND, canCheck: true, canCall: false });
  });

  it('does not let a player who has acted re-raise a short all-in raise', () => {
    // Seat 4 is all-in for 40: a raise of only 10 over seat 3's 30.
    const g = play(withChips(start(), { 4: 40 }), 'raise 30', 'allin', 'fold', 'fold', 'fold', 'fold');
    expect(g.toAct).toBe(3);
    expect(legalActions(g)).toMatchObject({ canCall: true, toCall: 10, canRaise: false });
    expect(() => act(g, { type: 'raise', to: 100 })).toThrow();
  });

  it('keeps the size of the next raise after a short all-in', () => {
    const g = play(withChips(start(), { 3: 15 }), 'allin'); // 15 is only 5 more than the big blind
    expect(g.currentBet).toBe(15);
    expect(g.minRaise).toBe(BIG_BLIND);
    expect(legalActions(g).minRaiseTo).toBe(25);
  });

  it('reopens the betting when short all-ins add up to a full raise', () => {
    let g = withChips(start(), { 4: 45, 5: 60 });
    g = play(g, 'raise 30'); // seat 3: a full raise of 20
    g = play(g, 'allin', 'allin'); // seat 4 to 45 and seat 5 to 60: 15 more each, but 30 between them
    g = play(g, 'fold', 'fold', 'fold'); // seats 0, 1 and 2
    expect(g.toAct).toBe(3);
    expect(legalActions(g).canRaise).toBe(true);
  });

  it('treats a call for the whole stack as all-in', () => {
    const g = play(withChips(start(), { 3: 6 }), 'call');
    expect(g.seats[3]).toMatchObject({ chips: 0, bet: 6, allIn: true });
    expect(g.seats[3]?.last?.kind).toBe('allin');
  });
});

describe('showdown', () => {
  it('pays the best hand', () => {
    const g0 = rig(start(), { 3: 'As Ad', 4: '8s 8h', 5: '6c 10d', 0: 'Kc Qd', 1: '3h 5h', 2: 'Kh 10c' }, BOARD);
    const g = play(g0, ...CALL_ROUND, ...checks(18));
    expect(g.phase).toBe('settled');
    expect(g.showdown).toBe(true);
    expect(g.board.map((c) => c.rank + c.suit)).toEqual(['2C', '7D', '9H', 'JC', '4S']);
    expect(chips(g, 3)).toBe(STARTING_STACK + 50);
    expect(g.results[3]).toMatchObject({ won: 60, net: 50 });
    expect(g.results[3]?.rank?.name).toBe('Pair of Aces');
    expect(g.results[4]?.rank?.name).toBe('Pair of Eights');
    expect(g.results[0]?.net).toBe(-10);
  });

  it('splits a tied pot, giving an odd chip to the winner nearest the left of the button', () => {
    // The board is a royal flush, so seats 2 and 3 both play it.
    const g0 = rig(start(), { 2: 'Ah 2d', 3: 'Ad 3c' }, 'As Ks Qs Js 10s');
    // The small blind's 5 is dead money, making a pot of 45.
    const g = play(g0, 'raise 20', 'fold', 'fold', 'fold', 'fold', 'call', ...checks(6));
    expect(g.showdown).toBe(true);
    expect(g.pots[0]?.winners).toEqual([2, 3]);
    expect(g.results[2]?.won).toBe(23);
    expect(g.results[3]?.won).toBe(22);
  });

  it('only turns over the hands of seats still in', () => {
    const g0 = rig(start(), { 3: 'As Ad' }, BOARD);
    const g = play(g0, 'fold', 'fold', 'fold', 'fold', 'call', 'check', ...checks(6));
    expect(g.showdown).toBe(true);
    expect(g.results.filter((r) => r.rank).map((r) => r.seat)).toEqual([1, 2]);
  });
});

describe('all-in and side pots', () => {
  const stacks = { 3: 100, 4: 300, 5: 1000 };

  it('runs the board out when everyone is all-in, and pays each pot to its best eligible hand', () => {
    const g0 = rig(withChips(start(), stacks), { 3: 'As Ad', 4: 'Ks Kd', 5: 'Qs Qd' }, BOARD);
    const g = play(g0, 'allin', 'allin', 'call', 'fold', 'fold', 'fold');
    expect(g.phase).toBe('settled');
    expect(g.board).toHaveLength(5);
    expect(g.pots.map((p) => [p.amount, p.eligible, p.winners])).toEqual([
      [315, [3, 4, 5], [3]],
      [400, [4, 5], [4]],
    ]);
    expect(chips(g, 3)).toBe(315);
    expect(chips(g, 4)).toBe(400);
    expect(chips(g, 5)).toBe(700);
    expect(g.results[5]?.net).toBe(-300);
  });

  it('gives everything to the best hand if it is the deepest stack', () => {
    const g0 = rig(withChips(start(), stacks), { 3: 'Qs Qd', 4: 'Ks Kd', 5: 'As Ad' }, BOARD);
    const g = play(g0, 'allin', 'allin', 'call', 'fold', 'fold', 'fold');
    expect(chips(g, 5)).toBe(700 + 715);
    expect((chips(g, 3) ?? 0) + (chips(g, 4) ?? 0)).toBe(0);
  });

  it('returns the part of a bet that could not be called', () => {
    const g0 = rig(withChips(start(), { 5: 200 }), { 5: 'As Ad', 4: 'Ks Kd' }, BOARD);
    const g = play(g0, 'fold', 'raise 300', 'call', 'fold', 'fold', 'fold');
    expect(g.phase).toBe('settled');
    expect(g.pots.map((p) => [p.amount, p.uncalled])).toEqual([
      [415, false],
      [100, true],
    ]);
    expect(chips(g, 5)).toBe(415);
    expect(chips(g, 4)).toBe(1000 - 300 + 100);
    expect(g.results[4]?.net).toBe(-200);
  });

  it('runs the board out when the only player left with chips has called', () => {
    const g = play(withChips(start(), { 3: 50 }), 'allin', 'call', 'fold', 'fold', 'fold', 'fold');
    expect(g.phase).toBe('settled');
    expect(g.board).toHaveLength(5);
  });
});

describe('whose turn it is', () => {
  it('knows when a computer player is to act', () => {
    const g = start(); // seat 3 acts first
    expect(isBotTurn(g)).toBe(true);
    const yours = play(g, 'fold', 'fold', 'fold');
    expect(yours.toAct).toBe(0);
    expect(isBotTurn(yours)).toBe(false);
    expect(isBotTurn(play(start(), 'fold', 'fold', 'fold', 'fold', 'fold'))).toBe(false); // the hand is over
  });
});

describe('the game', () => {
  it('starts every seat with the starting stack', () => {
    const g = newGame(seededRandomInt(3));
    expect(chipsInPlay(g)).toBe(STARTING_STACK * SEATS);
    expect(g.seats.map((s) => s.name)).toEqual(['You', 'Terry', 'Margaret', 'Nigel', 'Priya', 'Gary']);
  });

  it('is over when you have lost all your chips, and refuses another hand', () => {
    const g0 = rig(withChips(start(), { 0: 30 }), { 0: 'Ks Kd', 1: 'As Ad' }, BOARD);
    const g = play(g0, 'fold', 'fold', 'fold', 'allin', 'call', 'fold');
    expect(g.phase).toBe('settled');
    expect(chips(g, 0)).toBe(0);
    expect(isGameOver(g)).toBe(true);
    expect(() => nextHand(g)).toThrow();
  });

  it('is not over while you have chips', () => {
    const g = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(isGameOver(g)).toBe(false);
  });

  it('has computer players buy back in when they run low', () => {
    const g = withChips(start(), { 4: 3 });
    const next = nextHand(play(g, 'fold', 'fold', 'fold', 'fold', 'fold'), seededRandomInt(9));
    const bot = next.seats[4];
    expect((bot?.chips ?? 0) + (bot?.total ?? 0)).toBe(STARTING_STACK);
  });
});

/** A random legal move: mostly checks and calls, sometimes folds, and now and then a raise (sometimes all-in). */
function randomMove(g: GameState, random: RandomInt): Action {
  const legal = legalActions(g);
  const roll = random(10);
  if (legal.canRaise && roll < 3) {
    const to = roll === 0 ? legal.maxRaiseTo : legal.minRaiseTo + random(legal.maxRaiseTo - legal.minRaiseTo + 1);
    return { type: 'raise', to };
  }
  if (roll < 8) {
    if (legal.canCheck) return { type: 'check' };
    if (legal.canCall) return { type: 'call' };
  }
  return { type: legal.canCheck ? 'check' : 'fold' };
}

describe('playing at random', () => {
  it('never loses or makes chips, and every hand finishes', () => {
    const random = seededRandomInt(2024);
    let g = newGame(random);
    for (let hands = 0; hands < 300; hands++) {
      if (isGameOver(g)) g = newGame(random);
      const before = chipsInPlay(g);
      let moves = 0;
      while (g.phase === 'action') {
        expect(++moves).toBeLessThan(200);
        g = act(g, randomMove(g, random));
        expect(chipsInPlay(g)).toBe(before);
        expect(g.seats.every((s) => s.chips >= 0)).toBe(true);
      }
      expect(chipsInPlay(g)).toBe(before);
      expect(g.results.reduce((sum, r) => sum + r.net, 0)).toBe(0);
      if (!isGameOver(g)) g = nextHand(g, random);
    }
  });
});
