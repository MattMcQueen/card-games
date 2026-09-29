import { describe, expect, it } from 'vitest';
import { act, newGame, nextRound, startRound } from '../engine';
import { rigged } from '../engine/testing';
import type { Action, Rank } from '../engine';
import { cuesFor } from './cues';

const sounds = (cues: { sound: string }[]) => cues.map((c) => c.sound);

/** Deal a rigged round, then play the given actions, returning every step. */
function steps(ranks: Rank[], bet: number, ...actions: Action[]) {
  const start = rigged(ranks);
  let state = startRound(start, bet);
  const list = [{ prev: start, next: state }];
  for (const action of actions) {
    const prev = state;
    state = act(prev, action);
    list.push({ prev, next: state });
  }
  return list;
}

describe('cuesFor', () => {
  it('places the bet and deals three cards at the start of a round, in order', () => {
    const [deal] = steps(['9', '6', '8'], 10);
    const cues = cuesFor(deal!.prev, deal!.next, false);
    expect(sounds(cues)).toEqual(['chip', 'deal', 'deal', 'deal']);
    const times = cues.filter((c) => c.sound === 'deal').map((c) => c.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('shuffles only when the shoe was reshuffled', () => {
    const fresh = newGame();
    const first = startRound({ ...fresh, shoe: fresh.shoe.slice(0, 40) }, 5);
    expect(sounds(cuesFor({ ...fresh, shoe: fresh.shoe.slice(0, 40) }, first, false))).toContain('shuffle');
    const [normal] = steps(['9', '6', '8'], 10);
    expect(sounds(cuesFor(normal!.prev, normal!.next, false))).not.toContain('shuffle');
  });

  it('deals one card for a hit', () => {
    const [, hit] = steps(['2', '10', '3', '2'], 10, 'hit');
    expect(sounds(cuesFor(hit!.prev, hit!.next, false))).toEqual(['deal']);
  });

  it('puts down a chip and deals a card for a double', () => {
    const [, double] = steps(['5', '10', '6', '2'], 10, 'double');
    const played = sounds(cuesFor(double!.prev, double!.next, false));
    expect(played.slice(0, 2)).toEqual(['chip', 'deal']);
  });

  it('puts down a chip and deals two cards for a split', () => {
    const [, split] = steps(['8', '6', '8', '3', '2'], 10, 'split');
    const played = sounds(cuesFor(split!.prev, split!.next, false));
    expect(played).toEqual(['chip', 'deal', 'deal']);
  });

  it('plays the dealer cards and then the result after standing', () => {
    // dealer 10, then 6 and K: three cards, bust; player wins
    const [, stand] = steps(['10', '10', '8', '6', 'K'], 10, 'stand');
    const cues = cuesFor(stand!.prev, stand!.next, false);
    expect(sounds(cues)).toEqual(['deal', 'deal', 'win', 'payout']);
    const dealAt = cues.filter((c) => c.sound === 'deal').map((c) => c.at);
    const winAt = cues.find((c) => c.sound === 'win')!.at;
    expect(winAt).toBeGreaterThan(Math.max(...dealAt));
  });

  it('plays a lose sound and sweeps the chips', () => {
    const [, stand] = steps(['10', '10', '7', '9'], 10, 'stand');
    expect(sounds(cuesFor(stand!.prev, stand!.next, false))).toContain('lose');
    expect(sounds(cuesFor(stand!.prev, stand!.next, false))).toContain('sweep');
  });

  it('plays the fanfare for a blackjack, straight from the deal', () => {
    const [deal] = steps(['A', '9', 'K', '8'], 10);
    const played = sounds(cuesFor(deal!.prev, deal!.next, false));
    expect(played).toContain('blackjack');
    expect(played).toContain('payout');
  });

  it('plays a push sound and nothing for chips when the bet is returned', () => {
    const [, stand] = steps(['10', '10', '9', '9'], 10, 'stand');
    const played = sounds(cuesFor(stand!.prev, stand!.next, false));
    expect(played).toContain('push');
    expect(played).not.toContain('payout');
    expect(played).not.toContain('sweep');
  });

  it('adds the game over sound when the last chips are lost', () => {
    const start = rigged(['10', '10', '7', '9'], 10);
    const dealt = startRound(start, 10);
    const settled = act(dealt, 'stand');
    expect(sounds(cuesFor(dealt, settled, false))).toContain('gameOver');
  });

  it('puts a chip down for insurance, and only when it is taken', () => {
    const [, decline] = steps(['9', 'A', '8', 'K'], 10, 'decline');
    expect(sounds(cuesFor(decline!.prev, decline!.next, false))).toEqual([]);
    const [, insure] = steps(['9', 'A', '8', 'K'], 10, 'insure');
    expect(sounds(cuesFor(insure!.prev, insure!.next, false))).toEqual(['chip']);
  });

  it('plays the dealer card and the result when insurance is answered on a blackjack', () => {
    // player blackjack, dealer A + K: a push on the hand, insurance pays 2 to 1
    const [, insure] = steps(['A', 'A', 'K', 'K'], 10, 'insure');
    const played = sounds(cuesFor(insure!.prev, insure!.next, false));
    expect(played).toEqual(['chip', 'deal', 'win', 'payout']);
  });

  it('counts an insurance win against a lost hand when choosing the result sound', () => {
    const [, , stand] = steps(['9', 'A', '8', 'K'], 10, 'insure', 'stand');
    // hand lost 10, insurance won 10: even, so a push sound
    expect(sounds(cuesFor(stand!.prev, stand!.next, false))).toContain('push');
  });

  it('plays a losing sound for a surrender', () => {
    const [, , surrender] = steps(['10', 'A', '6', '5'], 10, 'decline', 'surrender');
    const played = sounds(cuesFor(surrender!.prev, surrender!.next, false));
    expect(played).toEqual(['lose', 'sweep']);
  });

  it('makes no sound when moving on to the next hand', () => {
    const [, stand] = steps(['10', '10', '9', '7'], 10, 'stand');
    expect(cuesFor(stand!.next, nextRound(stand!.next), false)).toEqual([]);
  });

  it('spaces sounds evenly and starts them promptly with reduced motion', () => {
    const [deal] = steps(['9', '6', '8'], 10);
    const times = cuesFor(deal!.prev, deal!.next, true)
      .filter((c) => c.sound === 'deal')
      .map((c) => c.at);
    expect(times).toEqual([0, 0.12, 0.24]);
  });
});
