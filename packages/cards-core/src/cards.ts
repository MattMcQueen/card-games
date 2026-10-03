export const SUITS = ['S', 'H', 'D', 'C'] as const;
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
}

/** Cards from text such as "QS 10h 2C": rank then suit letter, either case. For tests that set up particular hands. */
export function parseCards(text: string): Card[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => ({ rank: token.slice(0, -1).toUpperCase() as Rank, suit: token.slice(-1).toUpperCase() as Suit }));
}
