import { cubicOut } from 'svelte/easing';
import { SEATS } from '../engine';

/** Honour the visitor's "reduce motion" setting: no flying cards, no waiting for them. */
export const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How long a card takes to land, in milliseconds. */
const DEAL_MS = 380;
/** Between the cards of the flop. */
const FLOP_GAP = 150;
/** Between the flop, turn and river when they are dealt one after another (everyone all-in). */
const STREET_GAP = 900;
/** Between the cards of the deal at the start of a hand. */
const HOLE_GAP = 90;

/** A card sliding onto the table from the dealer. */
export function deal(node: Element, { delay = 0, duration = DEAL_MS, still = false } = {}) {
  if (reducedMotion || still) return { duration: 0 };
  return {
    delay,
    duration,
    easing: cubicOut,
    css: (t: number, u: number) =>
      `transform: translate(0, ${u * -110}px) rotate(${u * -8}deg) scale(${1 - u * 0.15}); opacity: ${Math.min(1, t * 4)};`,
  };
}

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
  return to > from ? boardDelay(to - 1, from) + DEAL_MS : 0;
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
