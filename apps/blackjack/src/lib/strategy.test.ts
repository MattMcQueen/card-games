import { describe, expect, it } from 'vitest';
import { act, legalActions, startRound, type Action, type Rank } from '../engine';
import { rigged } from '../engine/testing';
import { hintFor } from './strategy';

/** The hint's move with the player holding `mine` (two cards) against the dealer's `up`. */
function advice(mine: [Rank, Rank], up: Rank, chips = 100, ...moves: Action[]): Action | undefined {
  // Deal order is player, dealer, player; filler 2s come after.
  let game = startRound(rigged([mine[0], up, mine[1]], chips), 10);
  if (game.phase === 'insurance') game = act(game, 'decline');
  for (const move of moves) game = act(game, move);
  return hintFor(game, legalActions(game))?.action;
}

describe('hintFor', () => {
  it('plays hard totals by the sheet', () => {
    expect(advice(['3', '5'], '6')).toBe('hit');
    expect(advice(['4', '5'], '4')).toBe('double');
    expect(advice(['4', '5'], '7')).toBe('hit');
    expect(advice(['6', '4'], '9')).toBe('double');
    expect(advice(['6', '4'], 'K')).toBe('hit');
    expect(advice(['10', '2'], '3')).toBe('hit');
    expect(advice(['10', '2'], '4')).toBe('stand');
    expect(advice(['10', '6'], '6')).toBe('stand');
    expect(advice(['10', '6'], '7')).toBe('hit');
    expect(advice(['10', '7'], 'A')).toBe('stand');
  });

  it('doubles 11 against everything but an ace, since this dealer stands on soft 17', () => {
    expect(advice(['6', '5'], 'K')).toBe('double');
    expect(advice(['6', '5'], 'A')).toBe('hit');
  });

  it('plays soft hands by the sheet', () => {
    expect(advice(['A', '2'], '5')).toBe('double');
    expect(advice(['A', '3'], '4')).toBe('hit');
    expect(advice(['A', '5'], '4')).toBe('double');
    expect(advice(['A', '6'], '3')).toBe('double');
    expect(advice(['A', '7'], '2')).toBe('stand');
    expect(advice(['A', '7'], '5')).toBe('double');
    expect(advice(['A', '7'], '8')).toBe('stand');
    expect(advice(['A', '7'], '9')).toBe('hit');
    expect(advice(['A', '8'], '6')).toBe('stand');
  });

  it('splits the pairs the sheet splits, and plays the rest as totals', () => {
    expect(advice(['A', 'A'], 'K')).toBe('split');
    expect(advice(['8', '8'], 'A')).toBe('split');
    expect(advice(['7', '7'], '7')).toBe('split');
    expect(advice(['7', '7'], '8')).toBe('hit');
    expect(advice(['6', '6'], '7')).toBe('hit');
    expect(advice(['9', '9'], '7')).toBe('stand');
    expect(advice(['9', '9'], '8')).toBe('split');
    expect(advice(['4', '4'], '5')).toBe('split');
    expect(advice(['5', '5'], '6')).toBe('double');
    expect(advice(['K', 'K'], '6')).toBe('stand');
  });

  it('hits instead of doubling when a double is not allowed, but stands on soft 18', () => {
    expect(advice(['6', '5'], '6', 15)).toBe('hit');
    expect(advice(['A', '7'], '5', 15)).toBe('stand');
    // After a hit: 2,3 then a 2 makes 7, then hard 9 against 4 after a second hit.
    expect(advice(['2', '3'], '4', 100, 'hit', 'hit')).toBe('hit');
  });

  it('never suggests insurance', () => {
    const game = startRound(rigged(['10', 'A', '9']), 10);
    expect(hintFor(game, legalActions(game))).toMatchObject({ action: 'decline' });
  });

  it('has no hint for two aces that cannot be split, or outside the player turn', () => {
    expect(advice(['A', 'A'], '6', 15)).toBeUndefined();
    const game = rigged([]);
    expect(hintFor(game, legalActions(game))).toBeUndefined();
  });
});
