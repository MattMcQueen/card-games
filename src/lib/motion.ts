import { cubicOut } from 'svelte/easing';

/** Honour the visitor's "reduce motion" setting: no flying cards, no waiting for them. */
export const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A card sliding in from the shoe at the top right. */
export function deal(node: Element, { delay = 0, duration = 380 } = {}) {
  if (reducedMotion) return { duration: 0 };
  return {
    delay,
    duration,
    easing: cubicOut,
    css: (t: number, u: number) =>
      `transform: translate(${u * 240}px, ${u * -170}px) rotate(${u * -16}deg); opacity: ${Math.min(1, t * 4)};`,
  };
}

/** How long the dealer's cards take to arrive, in milliseconds. */
export function dealerDelay(index: number): number {
  return index === 0 ? 230 : 620 + (index - 1) * 480;
}

/** Delay before the results are shown, so they wait for the dealer's cards. */
export function settleDelay(dealerCards: number): number {
  if (reducedMotion) return 0;
  return dealerCards > 1 ? 620 + (dealerCards - 1) * 480 + 150 : 500;
}
