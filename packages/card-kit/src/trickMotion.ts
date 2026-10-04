import { SEATS } from '@card-games/cards-core';
import { DEAL_DURATION, reducedMotion, type Origin } from './motion';

// The timing of a card game played in turns (Hearts, Spades, Bridge, Cribbage): the deal, the computer players'
// turns and the taking of a trick, and where cards fly from. The cards' flight and turn are in motion.ts. The deal
// is to four players unless a game says how many `seats` its table has.

/** Cards dealt to each player. */
const HAND_SIZE = 13;
/** Between the cards of the deal: one to each player in turn, quickly, as 52 cards are dealt. */
const DEAL_GAP = 28;
/** How long a complete trick stays on the table before its winner takes it, so you can see who did. */
const TRICK_PAUSE = 1100;
/** How long the cards of a trick take to slide across to its winner. */
export const COLLECT_DURATION = 420;

/** When a card of the deal lands: `order` is the seat's place in the deal and `round` the card. */
export function dealDelay(order: number, round: number, seats = SEATS): number {
  return reducedMotion ? 0 : (round * seats + order) * DEAL_GAP;
}

/** A seat's place in the deal, which starts on the dealer's left. */
export const dealOrder = (seat: number, dealer: number, seats = SEATS): number => (seat - dealer - 1 + seats * 2) % seats;

/** The cards played to the trick so far, if the game has a trick. */
const played = (state: Moving): number => state.trick?.length ?? 0;

/** What the timing needs to know of a game's state. */
interface Moving {
  /** The number of the hand. */
  readonly hand: number;
  /** The cards played to the trick so far, in a trick-taking game. */
  readonly trick?: readonly unknown[];
  readonly phase: string;
}

/**
 * How long the change from `prev` to `next` keeps cards moving, in milliseconds: a new deal, a card
 * landing on the trick (or `landing`, cards landing in a hand), or a trick being taken.
 */
export function animationTime(prev: Moving, next: Moving, landing = false): number {
  if (reducedMotion) return 0;
  if (next.hand !== prev.hand) return dealDelay(SEATS - 1, HAND_SIZE - 1) + DEAL_DURATION;
  if (landing || played(next) > played(prev)) return DEAL_DURATION;
  return prev.phase === 'collecting' ? COLLECT_DURATION : 0;
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
