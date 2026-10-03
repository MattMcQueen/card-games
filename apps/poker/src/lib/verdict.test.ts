import { describe, expect, it } from 'vitest';
import { gameWithButton, play, rig } from '../engine/testing';
import { bannerFor, winningCards } from './verdict';

// Seat 0 (you) has the button; seat 1 Terry and seat 2 Margaret post the blinds; seat 3 Nigel acts first.
const start = () => gameWithButton(0);
const BOARD = '2c 7d 9h Jc 4s';
const CALL_ROUND = ['call', 'call', 'call', 'call', 'call', 'check'];
const checks = (n: number) => Array<string>(n).fill('check');

describe('bannerFor', () => {
  it('shows nothing until the result is being shown', () => {
    const g = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(bannerFor(g, false)).toBeNull();
    expect(bannerFor(start(), true)).toBeNull(); // no result yet
  });

  it('says everyone else folded when nobody had to show', () => {
    const g = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(bannerFor(g, true)).toEqual({ tone: 'lose', main: 'Margaret wins 10', sub: 'Everyone else folded' });
  });

  it('is good news when you win, with the hand that won at a showdown', () => {
    const g0 = rig(start(), { 0: 'As Ad', 1: '3h 5h', 2: 'Kh 10c', 3: '8s 8h', 4: '6c 10d', 5: 'Kc Qd' }, BOARD);
    const g = play(g0, ...CALL_ROUND, ...checks(18));
    expect(bannerFor(g, true)).toEqual({ tone: 'win', main: 'You win 60', sub: 'Pair of Aces' });
  });

  it('names the biggest winner, and who else won, when the pots went to different seats', () => {
    const g0 = rig(start(), { 3: 'As Ad', 4: 'Ks Kd', 5: 'Qs Qd' }, BOARD);
    const stacked = { ...g0, seats: g0.seats.map((s) => ({ ...s, chips: { 3: 100, 4: 300, 5: 1000 }[s.id] ?? s.chips })) };
    const g = play(stacked, 'allin', 'allin', 'call', 'fold', 'fold', 'fold');
    expect(bannerFor(g, true)).toEqual({ tone: 'lose', main: 'Priya wins 400', sub: 'Nigel wins too' });
  });

  it('puts you first when you share the pot, and counts the others when there are many', () => {
    const g = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    const wins = (list: [number, number][]) => ({
      ...g,
      log: [...g.log.filter((e) => e.kind !== 'win'), ...list.map(([seat, amount]) => ({ kind: 'win' as const, seat, amount, street: g.street }))],
    });
    expect(bannerFor(wins([[2, 500], [0, 100]]), true)).toMatchObject({ tone: 'win', main: 'You win 100', sub: 'Margaret wins too' });
    expect(bannerFor(wins([[1, 50], [2, 300], [3, 50], [4, 50]]), true)).toMatchObject({ main: 'Margaret wins 300', sub: '3 others win too' });
    // A seat that won more than one pot is counted once, with its total.
    expect(bannerFor(wins([[3, 100], [4, 120], [3, 80]]), true)).toMatchObject({ main: 'Nigel wins 180', sub: 'Priya wins too' });
  });
});

describe('winningCards', () => {
  it('is nothing before the result shows, or when nobody had to show', () => {
    const folded = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(winningCards(folded, true)).toBeNull();
    const g0 = rig(start(), { 3: 'As Ad' }, BOARD);
    const g = play(g0, ...CALL_ROUND, ...checks(18));
    expect(winningCards(g, false)).toBeNull();
  });

  it('is the five cards of the winning hand', () => {
    const g0 = rig(start(), { 3: 'As Ad', 4: '8s 8h', 5: '6c 10d', 0: 'Kc Qd', 1: '3h 5h', 2: 'Kh 10c' }, BOARD);
    const g = play(g0, ...CALL_ROUND, ...checks(18));
    const cards = winningCards(g, true);
    expect(cards?.size).toBe(5);
    expect(cards?.has('AS') && cards.has('AD')).toBe(true);
    expect(cards?.has('8S')).toBe(false);
  });
});
