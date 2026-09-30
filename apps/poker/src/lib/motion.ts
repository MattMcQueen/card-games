import { cubicOut } from 'svelte/easing';
import { SEATS, type GameState } from '../engine';

/** Honour the visitor's "reduce motion" setting: no flying cards, no waiting for them. */
export const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How long a card takes to fly from the deck and turn over, in milliseconds. */
const DEAL_DURATION = 620;
/** Between the cards of the flop. */
const FLOP_GAP = 260;
/** Between the flop, turn and river when they are dealt one after another (everyone all-in). */
const STREET_GAP = 1100;
/** Between the cards of the deal at the start of a hand. */
const HOLE_GAP = 150;

/** How far, in pixels, a card is from the deck on the table: the way it has to fly. */
function fromDeck(node: Element): { dx: number; dy: number } {
  const deck = document.getElementById('deck')?.getBoundingClientRect();
  if (!deck) return { dx: 0, dy: -110 };
  const to = node.getBoundingClientRect();
  return {
    dx: deck.left + deck.width / 2 - (to.left + to.width / 2),
    dy: deck.top + deck.height / 2 - (to.top + to.height / 2),
  };
}

/** A card flying to its place from the deck, with a slight lift mid-flight. `still`: it is already there. */
export function deal(node: Element, { delay = 0, still = false } = {}) {
  if (reducedMotion || still) return { duration: 0 };
  const { dx, dy } = fromDeck(node);
  return {
    delay,
    duration: DEAL_DURATION,
    easing: cubicOut,
    css: (t: number, u: number) =>
      `transform: translate(${u * dx}px, ${u * dy}px) rotate(${u * -12}deg) scale(${1 + Math.sin(t * Math.PI) * 0.08}); opacity: ${Math.min(1, t * 4)};`,
  };
}

/**
 * A card turning face up as it lands: it starts showing its back, then flips over. A card that is
 * already on the table (`still`) simply turns over, and quickly. It is done as two transitions, one
 * for each face, that each turn the face and swap it in or out at the halfway point.
 */
function turn(front: boolean) {
  return (node: Element, { delay = 0, still = false } = {}) => {
    if (reducedMotion) return { duration: 0 };
    return {
      delay,
      duration: still ? 450 : DEAL_DURATION,
      css: (t: number) => {
        // Face down for the first half of the flight, then a quick turn over.
        const progress = still ? t : Math.min(1, Math.max(0, (t - 0.45) / 0.5));
        const angle = (1 - progress) ** 3 * 180; // 180 (back showing) down to 0 (front showing)
        const showing = front ? angle <= 90 : angle > 90;
        return `transform: perspective(700px) rotateY(${front ? angle : angle - 180}deg); opacity: ${showing ? 1 : 0};`;
      },
    };
  };
}
export const flipUp = turn(true);
export const flipDown = turn(false);

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
