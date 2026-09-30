import { DEAL_DURATION, reducedMotion, type Origin } from '@card-games/card-kit/motion';

/** The pause between cards in the opening deal. */
export const DEAL_GAP = 420;
/** The pause between the cards the dealer draws. */
const DEALER_GAP = 700;

/** Cards slide in from the shoe at the top right. */
export const fromShoe: Origin = () => ({ dx: 240, dy: -170, tilt: -16 });

/** How long the dealer's cards take to arrive, in milliseconds. */
export function dealerDelay(index: number): number {
  return index === 0 ? DEAL_GAP : 3 * DEAL_GAP + (index - 1) * DEALER_GAP;
}

/** Delay before the results are shown, so they wait for the dealer's cards. */
export function settleDelay(dealerCards: number): number {
  if (reducedMotion) return 0;
  return dealerCards > 1 ? dealerDelay(dealerCards - 1) + DEAL_DURATION + 150 : DEAL_DURATION + 150;
}
