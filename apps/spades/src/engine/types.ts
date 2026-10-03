import type { Card, Play, Seat } from '@card-games/cards-core';

export type { Card, Play, Suit } from '@card-games/cards-core';

/**
 * 'bidding': each player in turn says how many tricks they will take. 'playing': a trick is being played.
 * 'collecting': the trick is complete and about to be taken by its winner. 'settled': the hand is over and scored.
 */
export type Phase = 'bidding' | 'playing' | 'collecting' | 'settled';

export interface Player extends Seat {
  /** The tricks this player has bid to take this hand (0 is nil), or null before they have bid. */
  readonly bid: number | null;
  /** The tricks this player has taken this hand. */
  readonly tricks: number;
}

/** A partnership: you and your partner (team 0), or the two players either side of you (team 1). */
export interface Team {
  /** Points from earlier hands: this hand's are added once it is over. */
  readonly score: number;
  /** Overtricks gathered and not yet paid for: every BAGS_LIMIT of them costs BAG_PENALTY points. */
  readonly bags: number;
}

/** How a hand went for one partnership. */
export interface TeamResult {
  /** The partners' bids added together, not counting a nil. */
  readonly bid: number;
  /** The tricks the partners took between them, including any taken by a player who bid nil. */
  readonly tricks: number;
  /** For the bid: ten a trick if they made it, minus ten a trick if they did not. */
  readonly contract: number;
  /** Tricks over the bid, a point each (only when the bid was made). */
  readonly bags: number;
  /** For bids of nil: plus 100 for each one made, minus 100 for each one that failed. */
  readonly nil: number;
  /** Minus 100 for each ten bags the partnership has now gathered. */
  readonly penalty: number;
  /** All of the above: the change in the partnership's score. */
  readonly points: number;
}

export interface GameState {
  readonly phase: Phase;
  /** Hands played so far, counting this one. */
  readonly hand: number;
  /** The seat that dealt this hand: the player on their left bids first and leads the first trick. */
  readonly dealer: number;
  readonly players: readonly Player[];
  /** Your partnership (team 0, seats 0 and 2) and the other (team 1, seats 1 and 3). */
  readonly teams: readonly Team[];
  /** The cards of the trick being played, in the order they were played. */
  readonly trick: readonly Play[];
  /** The seat whose turn it is, to bid or to play; -1 when nobody's is. */
  readonly toPlay: number;
  /** Tricks finished in this hand. */
  readonly tricksPlayed: number;
  /** The cards of the tricks finished in this hand, which every player has seen. */
  readonly played: readonly Card[];
  /** A spade has been played, so spades may be led. */
  readonly spadesBroken: boolean;
  /** Who is taking the complete trick, while it is being collected; -1 otherwise. */
  readonly winner: number;
  /** Each partnership's result, filled in once the hand is over. */
  readonly result: readonly TeamResult[] | null;
  /** Each finished hand's results, by partnership: the score sheet. */
  readonly history: readonly (readonly TeamResult[])[];
}
