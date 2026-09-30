import { cubicOut } from 'svelte/easing';

/** Honour the visitor's "reduce motion" setting: no flying cards, no waiting for them. */
export const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How long a card takes to fly from the deck and turn over, in milliseconds. */
export const DEAL_DURATION = 620;

/** Where a card flies in from: how far away, in pixels, and how much it is turned as it sets off. */
export type Origin = (node: Element) => { dx: number; dy: number; tilt: number };

/** From the element with the id `deck` on the table, wherever it is. */
export const fromDeck: Origin = (node) => {
  const deck = document.getElementById('deck')?.getBoundingClientRect();
  if (!deck) return { dx: 0, dy: -110, tilt: -12 };
  const to = node.getBoundingClientRect();
  return {
    dx: deck.left + deck.width / 2 - (to.left + to.width / 2),
    dy: deck.top + deck.height / 2 - (to.top + to.height / 2),
    tilt: -12,
  };
};

/** A card flying to its place, face down, with a slight lift mid-flight. `still`: it is already there. */
export function deal(node: Element, { delay = 0, still = false, from = fromDeck }: { delay?: number; still?: boolean; from?: Origin } = {}) {
  if (reducedMotion || still) return { duration: 0 };
  const { dx, dy, tilt } = from(node);
  return {
    delay,
    duration: DEAL_DURATION,
    easing: cubicOut,
    css: (t: number, u: number) =>
      `transform: translate(${u * dx}px, ${u * dy}px) rotate(${u * tilt}deg) scale(${1 + Math.sin(t * Math.PI) * 0.08}); opacity: ${Math.min(1, t * 4)};`,
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
