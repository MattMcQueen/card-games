import { describe, expect, it } from 'vitest';
import { act, startRound, type Action, type Rank } from '../engine';
import { rigged } from '../engine/testing';
import { announcementFor, bannerFor, insuranceNet, insuranceNote } from './verdict';

/** Deals a rigged round and plays the actions, returning the settled game. */
function settled(ranks: Rank[], bet: number, ...actions: Action[]) {
  let game = startRound(rigged(ranks), bet);
  for (const action of actions) game = act(game, action);
  return game;
}

describe('bannerFor', () => {
  it('says what a win, a loss and a push came to', () => {
    expect(bannerFor(settled(['10', '10', '9', '7'], 10, 'stand'))).toEqual({ kind: 'win', text: 'You win 10' });
    expect(bannerFor(settled(['10', '10', '7', '9'], 10, 'stand'))).toEqual({ kind: 'lose', text: 'Dealer wins 10' });
    expect(bannerFor(settled(['10', '10', '9', '9'], 10, 'stand'))).toEqual({ kind: 'push', text: 'Push' });
  });

  it('cheers a blackjack and names a bust', () => {
    expect(bannerFor(settled(['A', '9', 'K', '8'], 10)).text).toBe('Blackjack! You win 15');
    expect(bannerFor(settled(['10', '9', '6', 'K'], 10, 'hit')).text).toBe('Bust! Dealer wins 10');
  });

  it('reports a surrender as the half bet lost', () => {
    const game = settled(['10', '6', '6'], 10, 'surrender');
    expect(bannerFor(game)).toEqual({ kind: 'lose', text: 'Surrendered, lose 5' });
  });

  it('counts insurance in the result', () => {
    // hand lost 10, insurance won 10: even
    expect(bannerFor(settled(['9', 'A', '8', 'K'], 10, 'insure', 'stand')).text).toBe('Even: insurance paid');
    // surrendered (-5) with insurance won (+10): a win overall, not a "loss of -5"
    expect(bannerFor(settled(['9', 'A', '8', 'K'], 10, 'insure', 'surrender'))).toEqual({
      kind: 'win',
      text: 'You win 5',
    });
    // insurance lost (-5) on top of a lost hand
    expect(bannerFor(settled(['10', 'A', '7', '9'], 10, 'insure', 'stand')).text).toBe('Dealer wins 15');
  });
});

describe('insuranceNote', () => {
  it('says what the insurance bet did', () => {
    const won = settled(['9', 'A', '8', 'K'], 10, 'insure', 'stand');
    expect(insuranceNet(won)).toBe(10);
    expect(insuranceNote(won)).toBe('Insurance pays +10');
    const lost = settled(['9', 'A', '8', '6'], 10, 'insure', 'stand');
    expect(insuranceNote(lost)).toBe('Insurance lost −5');
  });
});

describe('announcementFor', () => {
  it('reads out each hand and the chips left', () => {
    const game = settled(['10', '10', '9', '7'], 10, 'stand');
    expect(announcementFor(game)).toBe('Round over. Win +10. You have 110 chips.');
  });

  it('includes the insurance bet', () => {
    const game = settled(['9', 'A', '8', 'K'], 10, 'insure', 'stand');
    expect(announcementFor(game)).toBe('Round over. Lose −10, Insurance +10. You have 100 chips.');
  });

  it('says so when the player is out of chips', () => {
    let game = startRound(rigged(['10', '10', '7', '9'], 10), 10);
    game = act(game, 'stand');
    expect(announcementFor(game)).toContain('You are out of chips.');
  });
});
