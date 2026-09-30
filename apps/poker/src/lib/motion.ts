import { DEAL_DURATION, reducedMotion } from '@card-games/card-kit/motion';
import { SEATS, type GameState } from '../engine';

// How long the deal of a hand, the board and the computer players' moves take. The cards' flight
// and turn are the kit's.

/** Between the cards of the flop. */
const FLOP_GAP = 260;
/** Between the flop, turn and river when they are dealt one after another (everyone all-in). */
const STREET_GAP = 1100;
/** Between the cards of the deal at the start of a hand. */
const HOLE_GAP = 150;

/**
 * When a board card lands, counted from the moment it is dealt. Cards from `from` on are new: the
 * cards of a street come together and each further street a beat later.
 */
export function boardDelay(index: number, from: number): number {
  if (reducedMotion) return 0;
  const street = index < 3 ? 0 : index - 2; // flop, turn, river
  const first = from < 3 ? 0 : from - 2;
  return (street - first) * STREET_GAP + (street === 0 ? (index - from) * FLOP_GAP : 0);
}

/** How long until the last of the board cards from `from` to `to` has landed. */
export function boardTime(from: number, to: number): number {
  return to > from ? boardDelay(to - 1, from) + DEAL_DURATION : 0;
}

/** The wait before a settled hand's result is shown: for the board to finish, then a beat. */
export function revealDelay(from: number, to: number, showdown: boolean): number {
  if (reducedMotion) return 0;
  return boardTime(from, to) + (showdown ? 800 : 400);
}

/** When a hole card lands: one card round the table, then a second. `order` is the seat's place after the button. */
export function holeDelay(order: number, round: number): number {
  return reducedMotion ? 0 : (round * SEATS + order) * HOLE_GAP;
}

/** How long the deal of a new hand takes, until the last hole card has landed. */
export function dealTime(): number {
  return reducedMotion ? 0 : holeDelay(SEATS - 1, 1) + DEAL_DURATION;
}

/** How long the cards dealt by the change from `prev` to `next` take to land, in milliseconds. */
export function animationTime(prev: GameState, next: GameState): number {
  if (next.hand !== prev.hand) return dealTime();
  return boardTime(prev.board.length, next.board.length);
}

/**
 * How long a computer player takes over its move: a beat you can follow while you are still in the
 * hand (after any cards still landing), and quick once you have folded and are only watching.
 * `luck` is a number from 0 to 1 that varies it a little.
 */
export function thinkTime(youAreIn: boolean, stillLanding: number, luck: number): number {
  if (reducedMotion) return 250;
  return (youAreIn ? 650 + luck * 650 : 200) + Math.max(0, stillLanding);
}
