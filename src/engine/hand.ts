import type { Card, Rank } from './types';

function cardValue(rank: Rank): number {
  if (rank === 'A') return 1;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return Number(rank);
}

export interface HandValue {
  readonly total: number;
  /** True when an Ace is currently counted as 11. */
  readonly soft: boolean;
}

export function handValue(cards: readonly Card[]): HandValue {
  let total = 0;
  let hasAce = false;
  for (const card of cards) {
    total += cardValue(card.rank);
    if (card.rank === 'A') hasAce = true;
  }
  if (hasAce && total + 10 <= 21) return { total: total + 10, soft: true };
  return { total, soft: false };
}

export function isBust(cards: readonly Card[]): boolean {
  return handValue(cards).total > 21;
}

/** Two cards totalling 21. After a split this still counts, by the house rules. */
export function isBlackjack(cards: readonly Card[]): boolean {
  return cards.length === 2 && handValue(cards).total === 21;
}

/** A pair for splitting means the same rank: K and Q are not a pair. */
export function isPair(cards: readonly Card[]): boolean {
  return cards.length === 2 && cards[0]?.rank === cards[1]?.rank;
}
