import { cubicOut } from 'svelte/easing';

/** Honour the visitor's "reduce motion" setting: no flying cards, no waiting for them. */
export const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How long a card takes to fly from the shoe and turn over, in milliseconds. */
const DEAL_DURATION = 620;
/** The pause between cards in the opening deal. */
export const DEAL_GAP = 420;
/** The pause between the cards the dealer draws. */
const DEALER_GAP = 700;

/** A card sliding in from the shoe at the top right, face down. */
export function deal(node: Element, { delay = 0 } = {}) {
  if (reducedMotion) return { duration: 0 };
  return {
    delay,
    duration: DEAL_DURATION,
    easing: cubicOut,
    css: (t: number, u: number) =>
      `transform: translate(${u * 240}px, ${u * -170}px) rotate(${u * -16}deg) scale(${1 + Math.sin(t * Math.PI) * 0.08}); opacity: ${Math.min(1, t * 4)};`,
  };
}

/** The card turning face up as it lands: it starts showing its back, then flips over. */
export function flip(node: Element, { delay = 0 } = {}) {
  if (reducedMotion) return { duration: 0 };
  return {
    delay,
    duration: DEAL_DURATION,
    css: (t: number) => {
      // Face down for the first half of the flight, then a quick turn over.
      const turn = Math.min(1, Math.max(0, (t - 0.45) / 0.5));
      const eased = 1 - (1 - turn) ** 3;
      return `transform: perspective(700px) rotateY(${(1 - eased) * 180}deg);`;
    },
  };
}

/** How long the dealer's cards take to arrive, in milliseconds. */
export function dealerDelay(index: number): number {
  return index === 0 ? DEAL_GAP : 3 * DEAL_GAP + (index - 1) * DEALER_GAP;
}

/** Delay before the results are shown, so they wait for the dealer's cards. */
export function settleDelay(dealerCards: number): number {
  if (reducedMotion) return 0;
  return dealerCards > 1 ? dealerDelay(dealerCards - 1) + DEAL_DURATION + 150 : DEAL_DURATION + 150;
}
