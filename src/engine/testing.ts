import { newGame } from './game';
import type { RandomInt } from './shoe';
import type { Card, GameState, Rank } from './types';

/** Small deterministic random generator (mulberry32) so tests are repeatable. */
export function seededRandomInt(seed: number): RandomInt {
  let a = seed >>> 0;
  return (max) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * max);
  };
}

export const card = (rank: Rank): Card => ({ rank, suit: 'S' });

/**
 * A game whose next cards are exactly `ranks`, in order. The deal order is
 * player, dealer, player, and then whatever is drawn next. Spare filler cards
 * follow, so the shoe is large enough not to trigger a reshuffle.
 */
export function rigged(ranks: Rank[], chips = 100): GameState {
  const filler = Array.from({ length: 60 }, () => card('2'));
  return { ...newGame(seededRandomInt(1)), chips, shoe: [...ranks.map(card), ...filler] };
}
