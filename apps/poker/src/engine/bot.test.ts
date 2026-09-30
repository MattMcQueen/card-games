import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { chenScore, decide, estimateEquity } from './bot';
import { act, isGameOver, legalActions, newGame, nextHand } from './game';
import { cards, chipsInPlay, gameWithButton, play, rig, withChips } from './testing';
import { BIG_BLIND } from './constants';

const [a, b] = [(t: string) => cards(t)[0]!, (t: string) => cards(t)[1]!];
const chen = (text: string) => chenScore(a(text), b(text));
const random = (seed: number) => {
  const r = seededRandomInt(seed);
  return () => r(1_000_000) / 1_000_000;
};

describe('chenScore', () => {
  it('scores starting hands the way the formula says', () => {
    expect(chen('As Ad')).toBe(20);
    expect(chen('Ks Kd')).toBe(16);
    expect(chen('As Ks')).toBe(12);
    expect(chen('Ah Kd')).toBe(10);
    expect(chen('2s 2d')).toBe(5);
    expect(chen('7d 2c')).toBe(-1);
  });

  it('values suited and connected cards', () => {
    expect(chen('9s 8s')).toBeGreaterThan(chen('9s 8d'));
    expect(chen('9s 8d')).toBeGreaterThan(chen('9s 6d'));
  });
});

describe('estimateEquity', () => {
  it('is high for the best starting hand and low for the worst', () => {
    expect(estimateEquity(cards('As Ad'), [], 1, 1500, random(1))).toBeGreaterThan(0.8);
    expect(estimateEquity(cards('7d 2c'), [], 1, 1500, random(1))).toBeLessThan(0.4);
  });

  it('falls with more opponents', () => {
    const one = estimateEquity(cards('Ks Kd'), [], 1, 1000, random(2));
    const four = estimateEquity(cards('Ks Kd'), [], 4, 1000, random(2));
    expect(four).toBeLessThan(one);
  });

  it('is certain when the hand cannot lose', () => {
    // The nut flush on the river against one player.
    expect(estimateEquity(cards('As Ks'), cards('Qs Js 10s 2c 3d'), 1, 200, random(3))).toBe(1);
  });
});

describe('decide', () => {
  const at = (seat: number, holes: string, ...moves: string[]) => {
    const g0 = gameWithButton(0);
    const g = rig(g0, { [seat]: holes }, '');
    return play(g, ...moves);
  };

  // Priya (seat 4) is the strongest player, so her play is the most predictable. With the button on
  // seat 1 she is first to act.
  const priya = (holes: string) => rig(gameWithButton(1), { 4: holes }, '');

  it('raises with a pair of aces before the flop', () => {
    const g = priya('As Ad');
    for (let seed = 1; seed <= 10; seed++) expect(decide(g, seededRandomInt(seed)).type).toBe('raise');
  });

  it('folds the worst hand in the worst seat when nobody has raised', () => {
    const g = priya('7d 2c');
    for (let seed = 1; seed <= 10; seed++) expect(decide(g, seededRandomInt(seed)).type).toBe('fold');
  });

  it('folds junk facing a big raise, and does not fold a monster to one', () => {
    const junk = at(4, '7d 2c', 'raise 100');
    const monster = at(4, 'As Ad', 'raise 100');
    for (let seed = 1; seed <= 10; seed++) {
      expect(decide(junk, seededRandomInt(seed)).type).toBe('fold');
      expect(decide(monster, seededRandomInt(seed)).type).not.toBe('fold');
    }
  });

  it('has weaker players call bets they should fold, and strong ones fold', () => {
    // Seat 3 raises to 40 and everyone in between folds, so it is the turn of Priya (seat 4) or,
    // a few seats on, Terry (seat 1), each with the worst hand.
    const priya = at(4, '7d 2c', 'raise 40');
    const terry = at(1, '7d 2c', 'raise 40', 'fold', 'fold', 'fold');
    expect([priya.toAct, terry.toAct]).toEqual([4, 1]);
    let priyaCalls = 0;
    let terryCalls = 0;
    for (let seed = 1; seed <= 200; seed++) {
      if (decide(priya, seededRandomInt(seed)).type === 'call') priyaCalls++;
      if (decide(terry, seededRandomInt(seed)).type === 'call') terryCalls++;
    }
    expect(priyaCalls).toBeLessThan(20);
    expect(terryCalls).toBeGreaterThan(50);
  });

  it('never folds when it can check', () => {
    // The big blind, after everyone has just called, with the worst hand.
    const g = at(2, '7d 2c', 'call', 'call', 'call', 'call', 'call');
    expect(legalActions(g).canCheck).toBe(true);
    for (let seed = 1; seed <= 20; seed++) expect(decide(g, seededRandomInt(seed)).type).not.toBe('fold');
  });

  it('is repeatable with the same random numbers', () => {
    const g = at(3, 'Qs Jd');
    expect(decide(g, seededRandomInt(7))).toEqual(decide(g, seededRandomInt(7)));
  });

  it('goes all-in with a decent hand and a short stack', () => {
    const g = rig(withChips(gameWithButton(0), { 3: 5 * BIG_BLIND }), { 3: 'Ah Kd' });
    const action = decide(g, seededRandomInt(1));
    expect(action).toEqual({ type: 'raise', to: 5 * BIG_BLIND });
  });

  it('does not fold a set of kings to a pot-sized bet on the flop, but folds nothing at all', () => {
    const flop = (seat4: string) => {
      const g = rig(gameWithButton(0), { 3: 'Ad Qd', 4: seat4 }, 'Ks 7d 2c');
      // Everyone limps in, then seats 1 and 2 check the flop and seat 3 bets the pot.
      return play(g, 'call', 'call', 'call', 'call', 'call', 'check', 'check', 'check', 'raise 60');
    };
    const made = flop('Kh Kd');
    const missed = flop('9c 8c');
    expect(made.toAct).toBe(4);
    for (let seed = 1; seed <= 10; seed++) {
      expect(decide(made, seededRandomInt(seed)).type).not.toBe('fold');
      expect(decide(missed, seededRandomInt(seed)).type).toBe('fold');
    }
  });
});

describe('a full game between computer players', () => {
  it('plays hands to the end, always legally, without losing chips', () => {
    const random = seededRandomInt(99);
    let g = newGame(random);
    let actions = 0;
    for (let hands = 0; hands < 40; hands++) {
      if (isGameOver(g)) break;
      const before = chipsInPlay(g);
      while (g.phase === 'action') {
        g = act(g, decide(g, random));
        expect(++actions).toBeLessThan(5000);
        expect(chipsInPlay(g)).toBe(before);
      }
      if (!isGameOver(g)) g = nextHand(g, random);
    }
    expect(actions).toBeGreaterThan(100);
  });
});
