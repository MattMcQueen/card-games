export const SUITS = ['S', 'H', 'D', 'C'] as const;
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
}

export type Action = 'hit' | 'stand' | 'double' | 'split';

export type Outcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust';

export interface PlayerHand {
  readonly cards: readonly Card[];
  /** Chips staked on this hand (already doubled if it was doubled). */
  readonly bet: number;
  readonly doubled: boolean;
  readonly fromSplit: boolean;
  /** No more actions available: stood, bust, 21, doubled or a split ace. */
  readonly done: boolean;
}

export interface HandResult {
  readonly outcome: Outcome;
  readonly bet: number;
  /** Chips handed back to the player: the bet plus any winnings, or 0. */
  readonly returned: number;
  /** returned - bet: positive for a win, 0 for a push, negative for a loss. */
  readonly net: number;
}

export type Phase = 'betting' | 'player' | 'settled';

export interface GameState {
  readonly phase: Phase;
  /** Chips the player holds. Bets already placed on the table are NOT included. */
  readonly chips: number;
  /** Undealt cards, next card first. */
  readonly shoe: readonly Card[];
  /** True when the shoe was freshly shuffled for the latest round (or new game). */
  readonly shuffled: boolean;
  readonly hands: readonly PlayerHand[];
  /** Index of the hand being played. */
  readonly active: number;
  readonly dealer: readonly Card[];
  readonly results: readonly HandResult[];
}
