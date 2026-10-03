import { DEAL_DURATION, reducedMotion, type Origin } from '@card-games/card-kit/motion';
import { HAND_SIZE, PLAYERS, type GameState } from '../engine';

// How long the deal, the computer players' turns and the taking of a trick last. The cards' flight
// and turn are the kit's.

/** Between the cards of the deal: one to each player in turn, quickly, as 52 cards are dealt. */
const DEAL_GAP = 28;
/** How long a complete trick stays on the table before its winner takes it, so you can see who did. */
const TRICK_PAUSE = 1100;
/** How long the cards of a trick take to slide across to its winner. */
export const COLLECT_DURATION = 420;

/** When a card of the deal lands: `order` is the seat's place in the deal (from your left) and `round` the card. */
export function dealDelay(order: number, round: number): number {
  return reducedMotion ? 0 : (round * PLAYERS + order) * DEAL_GAP;
}

/** How long the deal of a new hand takes, until the last card has landed. */
function dealTime(): number {
  return reducedMotion ? 0 : dealDelay(PLAYERS - 1, HAND_SIZE - 1) + DEAL_DURATION;
}

/** How long the change from `prev` to `next` keeps cards moving, in milliseconds. */
export function animationTime(prev: GameState, next: GameState): number {
  if (reducedMotion) return 0;
  if (next.hand !== prev.hand) return dealTime();
  if (next.trick.length > prev.trick.length || (prev.phase === 'passing' && next.phase !== 'passing')) return DEAL_DURATION;
  if (prev.phase === 'collecting') return COLLECT_DURATION;
  return 0;
}

/** How long a computer player takes over its card: a beat you can follow, after any cards still landing. `luck` (0 to 1) varies it. */
export function thinkTime(stillLanding: number, luck: number): number {
  if (reducedMotion) return 250;
  return 450 + luck * 450 + Math.max(0, stillLanding);
}

/** How long a complete trick waits before it is taken. */
export function collectWait(stillLanding: number): number {
  return (reducedMotion ? 700 : TRICK_PAUSE) + Math.max(0, stillLanding);
}

/** How far, in pixels across and down, it is from the middle of `to` to the middle of `from`. */
export function offset(from: DOMRect, to: DOMRect): { dx: number; dy: number } {
  return { dx: from.left + from.width / 2 - (to.left + to.width / 2), dy: from.top + from.height / 2 - (to.top + to.height / 2) };
}

/** From a place on the screen, such as where a card was in your hand before you played it. */
export function fromRect(rect: DOMRect | null, tilt = 0): Origin {
  return (node) => (rect ? { ...offset(rect, node.getBoundingClientRect()), tilt } : { dx: 0, dy: 0, tilt: 0 });
}

/** From the element with id `id`, such as a computer player's cards, wherever it is on the screen. */
export function fromElement(id: string): Origin {
  return (node) => fromRect(document.getElementById(id)?.getBoundingClientRect() ?? null, -8)(node);
}
