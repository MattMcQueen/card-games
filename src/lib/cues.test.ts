import { describe, expect, it } from 'vitest';
import { act, nextHand } from '../engine';
import { gameWithButton, play, rig, seededRandomInt, withChips } from '../engine/testing';
import { cuesFor } from './cues';

const sounds = (prev: Parameters<typeof cuesFor>[0], next: Parameters<typeof cuesFor>[1]) =>
  cuesFor(prev, next, true).map((c) => c.sound);
const start = () => gameWithButton(0);
const BOARD = '2c 7d 9h Jc 4s';

describe('cuesFor', () => {
  it('shuffles and deals a new hand: two rounds of cards, then the blinds', () => {
    const before = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    const cues = sounds(before, nextHand(before, seededRandomInt(2)));
    expect(cues[0]).toBe('shuffle');
    expect(cues.filter((s) => s === 'deal')).toHaveLength(12);
    expect(cues.at(-1)).toBe('chip');
  });

  it('makes a sound for each kind of move', () => {
    const g = start();
    expect(sounds(g, act(g, { type: 'fold' }))).toEqual(['fold']);
    expect(sounds(g, act(g, { type: 'call' }))).toEqual(['chip']);
    expect(sounds(g, act(g, { type: 'raise', to: 40 }))).toEqual(['chip']);
    const flop = play(g, 'call', 'call', 'call', 'call', 'call');
    expect(sounds(flop, act(flop, { type: 'check' }))).toEqual(['check', 'deal', 'deal', 'deal']);
    const post = play(g, 'call', 'call', 'call', 'call', 'call', 'check');
    expect(sounds(post, act(post, { type: 'check' }))).toEqual(['check']);
  });

  it('deals a card sound for each board card', () => {
    const g = play(start(), 'call', 'call', 'call', 'call', 'call');
    expect(sounds(g, act(g, { type: 'check' })).filter((s) => s === 'deal')).toHaveLength(3);
  });

  it('plays a win jingle and a payout when you win', () => {
    const before = play(start(), 'fold', 'fold', 'fold', 'raise 30', 'fold');
    const after = act(before, { type: 'fold' });
    expect(sounds(before, after)).toEqual(['fold', 'win', 'payout']);
  });

  it('plays a losing sound when you lose a showdown, and game over when your chips are gone', () => {
    const g0 = rig(withChips(start(), { 0: 100 }), { 0: '2s 3d', 3: 'As Ad' }, BOARD);
    const before = play(g0, 'raise 30', 'fold', 'fold', 'allin', 'fold', 'fold');
    const after = act(before, { type: 'call' });
    const cues = sounds(before, after);
    expect(cues.filter((s) => s === 'deal')).toHaveLength(5); // the board is run out
    expect(cues).toEqual(expect.arrayContaining(['chip', 'lose', 'sweep', 'gameOver']));
  });

  it('is quiet about a fold: just the sweep of the blind you lose', () => {
    const g = gameWithButton(4); // you are the big blind
    const before = play(g, 'raise 30', 'fold', 'fold', 'fold', 'fold');
    expect(sounds(before, act(before, { type: 'fold' }))).toEqual(['fold', 'sweep']);
  });

  it('spaces the sounds by the animation times when motion is allowed', () => {
    const g = play(start(), 'call', 'call', 'call', 'call', 'call');
    const flop = cuesFor(g, act(g, { type: 'check' }), false).filter((c) => c.sound === 'deal');
    expect(flop.map((c) => c.at)).toEqual([0, 0.26, 0.52]);
  });
});
