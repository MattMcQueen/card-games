import type { Card } from '@card-games/cards-core';

export type { Card, Rank } from '@card-games/cards-core';

export type Action =
  | 'hit'
  | 'stand'
  | 'double'
  | 'split'
  | 'surrender'
  /** Take the insurance side bet (only while it is being offered). */
  | 'insure'
  /** Turn the insurance side bet down. */
  | 'decline';

export type Outcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust' | 'surrender';

export interface PlayerHand {
  readonly cards: readonly Card[];
  /** Chips staked on this hand (already doubled if it was doubled). */
  readonly bet: number;
  readonly doubled: boolean;
  readonly fromSplit: boolean;
  /** The player gave the hand up for half the bet back. */
  readonly surrendered: boolean;
  /** No more actions available: stood, bust, 21, doubled, surrendered or a split ace. */
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

/** 'insurance': the dealer shows an ace and the player is deciding whether to insure. */
export type Phase = 'betting' | 'insurance' | 'player' | 'settled';

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
  /** Chips staked on insurance this round (already taken out of `chips`); 0 if none. */
  readonly insurance: number;
  /** Chips handed back for the insurance bet once settled: 3 times the stake if it won, else 0. */
  readonly insuranceReturned: number;
}
