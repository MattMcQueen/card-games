import type { Card, Play, Seat } from '@card-games/cards-core';

export type { Card, Play, Suit } from '@card-games/cards-core';

/** Where the cards go before a hand: to the player on your left, on your right, across, or nowhere. */
export type Direction = 'left' | 'right' | 'across' | 'keep';

/**
 * 'passing': everyone is choosing three cards to pass. 'playing': a trick is being played.
 * 'collecting': the trick is complete and about to be taken by its winner. 'settled': the hand is over and scored.
 */
export type Phase = 'passing' | 'playing' | 'collecting' | 'settled';

export interface Player extends Seat {
  /** The cards passed to this player at the start of the hand. */
  readonly received: readonly Card[];
  /** Every card in the tricks this player has taken in this hand. */
  readonly taken: readonly Card[];
  /** Points from earlier hands: this hand's are added once it is over. */
  readonly score: number;
}

export interface HandResult {
  /** The points each seat scored in the hand, after any shoot the moon. */
  readonly points: readonly number[];
  /** The seat that took every point and so shot the moon, if anyone did. */
  readonly moon: number | null;
}

export interface GameState {
  readonly phase: Phase;
  /** Hands played so far, counting this one. */
  readonly hand: number;
  readonly direction: Direction;
  readonly players: readonly Player[];
  /** The cards of the trick being played, in the order they were played. */
  readonly trick: readonly Play[];
  /** The seat whose turn it is; -1 when nobody's is. */
  readonly toPlay: number;
  /** Tricks finished in this hand. */
  readonly tricksPlayed: number;
  /** A heart has been played, so hearts may be led. */
  readonly heartsBroken: boolean;
  /** Who is taking the complete trick, while it is being collected; -1 otherwise. */
  readonly winner: number;
  /** Filled in once the hand is over. */
  readonly result: HandResult | null;
  /** Each finished hand's points, by seat: the score sheet. */
  readonly history: readonly (readonly number[])[];
}
