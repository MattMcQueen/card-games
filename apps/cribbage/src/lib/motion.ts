import { DEAL_DURATION, reducedMotion } from '@card-games/card-kit/motion';
import { COLLECT_DURATION, dealDelay } from '@card-games/card-kit/trickMotion';
import { DEAL_SIZE, PLAYERS, type GameState } from '../engine';

/**
 * How long the change from `prev` to `next` keeps cards moving, in milliseconds: a deal, a finished count turned over,
 * or a card landing (on the pile, in the crib, or laid out in the show).
 */
export function movingTime(prev: GameState, next: GameState, reduced = reducedMotion): number {
  if (reduced) return 0;
  if (next.hand !== prev.hand) return dealDelay(PLAYERS - 1, DEAL_SIZE - 1, PLAYERS) + DEAL_DURATION;
  if (prev.phase === 'collecting') return COLLECT_DURATION;
  return next.pile.length > prev.pile.length || next.phase !== prev.phase ? DEAL_DURATION : 0;
}
