import { cardKey, type Card } from '@card-games/cards-core';

/** Cards chosen from your hand, up to `limit`: three to pass in Hearts, or two for the crib in Cribbage. */
export class CardChoice {
  /** The chosen cards, as "QS". */
  keys: ReadonlySet<string> = $state.raw(new Set());
  readonly #limit: number;

  constructor(limit: number) {
    this.#limit = limit;
  }

  /** Chooses `card`, if there is room for it, or puts it back if it was chosen. */
  toggle(card: Card): void {
    const key = cardKey(card);
    const next = new Set(this.keys);
    if (next.has(key)) next.delete(key);
    else if (next.size < this.#limit) next.add(key);
    this.keys = next;
  }

  /** The chosen cards of `hand`, and the choice starts again. */
  take(hand: readonly Card[]): Card[] {
    const chosen = hand.filter((c) => this.keys.has(cardKey(c)));
    this.clear();
    return chosen;
  }

  clear(): void {
    this.keys = new Set();
  }
}
