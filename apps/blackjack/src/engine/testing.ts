import { seededRandomInt } from '@card-games/cards-core';
import { newGame } from './game';
import type { Card, GameState, Rank } from './types';

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
