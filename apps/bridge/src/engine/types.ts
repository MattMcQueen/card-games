import type { Card, Play, Seat, Suit } from '@card-games/cards-core';

export type { Card, Play, Suit } from '@card-games/cards-core';

/** What a bid names as trumps: a suit, or no trumps (NT). */
export type Strain = Suit | 'NT';

/** A bid: to take `level` tricks over the book (six), with `strain` as trumps. */
export interface Bid {
  readonly kind: 'bid';
  readonly level: number;
  readonly strain: Strain;
}

/** What a player says in the auction. */
export type Call = Bid | { readonly kind: 'pass' } | { readonly kind: 'double' } | { readonly kind: 'redouble' };

/** A call, and who made it. */
export interface Turn {
  readonly seat: number;
  readonly call: Call;
}

/** The final bid of the auction: the declarer must take `level` + 6 tricks, with `strain` as trumps. */
export interface Contract {
  readonly level: number;
  readonly strain: Strain;
  /** 0 undoubled, 1 doubled, 2 redoubled. */
  readonly doubled: 0 | 1 | 2;
  /** The player who plays both their own hand and their partner's (the dummy). */
  readonly declarer: number;
}

/**
 * 'bidding': the auction. 'playing': a trick is being played. 'collecting': the trick is complete and about
 * to be taken by its winner. 'settled': the hand is over and scored (or it was passed out).
 */
export type Phase = 'bidding' | 'playing' | 'collecting' | 'settled';

export interface Player extends Seat {
  /** The tricks this player has won this hand. */
  readonly tricks: number;
}

/** A partnership's place in the rubber: you and your partner (team 0), or the two players either side of you (team 1). */
export interface Team {
  /** Games won in this rubber. A side that has won one is vulnerable: its penalties and bonuses are bigger. */
  readonly games: number;
  /** Contract points below the line towards the game being played. */
  readonly partScore: number;
  /** All the points scored in the rubber, above and below the line. */
  readonly total: number;
}

/** A score written on one side of the score sheet, and what it was for. */
export interface Entry {
  readonly team: number;
  /** Below the line (contract points, which count towards a game) or above it (everything else). */
  readonly below: boolean;
  readonly points: number;
  readonly kind: 'contract' | 'overtricks' | 'undertricks' | 'slam' | 'insult' | 'honours' | 'rubber';
}

/** How a hand went. */
export interface HandResult {
  /** The contract played, or null if all four passed. */
  readonly contract: Contract | null;
  /** The tricks the declarer's side took. */
  readonly tricks: number;
  /** How many tricks over (positive) or under (negative) the contract. */
  readonly margin: number;
  /** What each side scored. */
  readonly entries: readonly Entry[];
  /** The side that won a game with this hand, or null. */
  readonly game: number | null;
  /** The side that won the rubber with this hand, or null. */
  readonly rubber: number | null;
}

export interface GameState {
  readonly phase: Phase;
  /** Hands played so far in this rubber, counting this one. */
  readonly hand: number;
  /** The seat that dealt this hand: they make the first call. */
  readonly dealer: number;
  readonly players: readonly Player[];
  /** The hands as they were dealt, for scoring honours. */
  readonly dealt: readonly (readonly Card[])[];
  /** Every call of the auction, in order. */
  readonly auction: readonly Turn[];
  /** The contract, once the auction is over; null before then, or if all four passed. */
  readonly contract: Contract | null;
  /** The cards of the trick being played, in the order they were played. */
  readonly trick: readonly Play[];
  /** The seat whose turn it is, to call or to play (a card from the dummy is the dummy's turn); -1 when nobody's is. */
  readonly toPlay: number;
  /** The tricks finished in this hand, which every player has seen. */
  readonly taken: readonly (readonly Play[])[];
  /** Who is taking the complete trick, while it is being collected; -1 otherwise. */
  readonly winner: number;
  /** Your partnership (team 0, seats 0 and 2) and the other (team 1, seats 1 and 3). */
  readonly teams: readonly Team[];
  /** How this hand went, once it is over. */
  readonly result: HandResult | null;
  /** Every finished hand of the rubber: the score sheet. */
  readonly history: readonly HandResult[];
}
