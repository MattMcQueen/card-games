/** Honour the visitor's "reduce motion" setting: no flying cards, no waiting for them. */
export const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** How long a card takes to fly from the deck and turn over, in milliseconds. */
export const DEAL_DURATION = 620;
/** How long a card already on the table takes to turn over, in milliseconds. */
const TURN_DURATION = 450;

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

interface DealOptions {
  delay?: number;
  /** The card is already on the table and only turns over, such as an opponent's at a showdown. */
  still?: boolean;
  from?: Origin;
}

/**
 * Deals a card (a Svelte action, `use:dealt`): it flies to its place face down with a slight lift and,
 * if it has faces (PlayingCard), turns over as it lands. The movement is plain CSS animations (the
 * `card-flight` and `card-turn` classes in app.css and PlayingCard.svelte), which the browser plays
 * out by the clock: a card can never be left stuck part-way, as happened in Safari when each step
 * waited for the one before to report that it had finished.
 */
export function dealt(node: HTMLElement, { delay = 0, still = false, from = fromDeck }: DealOptions = {}) {
  if (reducedMotion) return;
  node.style.setProperty('--deal-delay', `${delay}ms`);
  if (still) {
    node.style.setProperty('--deal-duration', `${TURN_DURATION}ms`);
    node.classList.add('card-turn');
    return;
  }
  const { dx, dy, tilt } = from(node);
  node.style.setProperty('--deal-duration', `${DEAL_DURATION}ms`);
  node.style.setProperty('--deal-dx', `${dx}px`);
  node.style.setProperty('--deal-dy', `${dy}px`);
  node.style.setProperty('--deal-tilt', `${tilt}deg`);
  node.classList.add('card-flight');
}
