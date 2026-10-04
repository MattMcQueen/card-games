import type { Card, Play, Seat } from '@card-games/cards-core';

export type { Card, Play } from '@card-games/cards-core';

/**
 * 'discarding': both players are choosing two cards for the crib. 'pegging': the play, each laying a card in turn
 * and calling the count. 'collecting': a count is over (at 31, or once neither player can go on) and its cards are
 * about to be turned over. 'showing': the hands are being counted, one at a time. 'settled': the hand is over, or
 * someone has reached 121 and the game with it.
 */
export type Phase = 'discarding' | 'pegging' | 'collecting' | 'showing' | 'settled';

export interface Player extends Seat {
  /** Points pegged in this game, never more than GAME_POINTS: where the front peg is. */
  readonly score: number;
  /** The score before the latest points: where the back peg is. */
  readonly previous: number;
  /** The four cards kept after discarding, for the show (the hand empties as they are played). */
  readonly kept: readonly Card[];
}

/** The ways points are pegged during the play, and for his heels. */
export type PegKind = 'heels' | 'fifteen' | 'thirtyOne' | 'pair' | 'run' | 'go' | 'lastCard';

/** Points pegged for one thing during the play: `size` is the cards in a run or of a kind. */
export interface Peg {
  readonly kind: PegKind;
  readonly points: number;
  readonly size?: number;
}

/** The ways a hand or crib scores in the show. */
export type ComboKind = 'fifteen' | 'pair' | 'run' | 'flush' | 'nob';

/** One scoring combination in a hand: the cards that make it, and what it is worth. */
export interface Combo {
  readonly kind: ComboKind;
  readonly cards: readonly Card[];
  readonly points: number;
}

/** A hand or crib counted with the starter: every combination, and their total. */
export interface Count {
  readonly combos: readonly Combo[];
  readonly total: number;
}

/** A hand (or the crib) counted in the show. */
export interface Show {
  readonly seat: number;
  readonly crib: boolean;
  readonly cards: readonly Card[];
  readonly count: Count;
}

/** The latest points pegged, and who by: shown on the table. */
export interface Scored {
  readonly seat: number;
  readonly points: number;
  /** What for, during the play (and for his heels); empty for a count in the show. */
  readonly pegs: readonly Peg[];
}

/** One player's points in a hand: in the play (with his heels), for their hand, and for their crib. */
export interface Tally {
  readonly pegging: number;
  readonly hand: number;
  readonly crib: number;
}

export interface GameState {
  readonly phase: Phase;
  /** Hands played so far, counting this one. */
  readonly hand: number;
  /** The seat that dealt this hand and owns the crib: the other player plays first, and is counted first. */
  readonly dealer: number;
  readonly players: readonly Player[];
  /** The cards cut for the first deal, by seat: the lower card dealt. */
  readonly cut: readonly Card[];
  /** The rest of the deck, after the deal: the starter is cut from it. */
  readonly stock: readonly Card[];
  /** The dealer's crib: the four cards discarded, face down until it is counted. */
  readonly crib: readonly Card[];
  /** The card cut once the crib is made, which counts in every hand; null until then. */
  readonly starter: Card | null;
  /** The cards played since the count was last back at 0, in order. */
  readonly pile: readonly Play[];
  /** The count of the pile: the total of its cards' values. */
  readonly count: number;
  /** Who has said "go" since the count was last back at 0, by seat. */
  readonly go: readonly boolean[];
  /** The seat whose turn it is to play; -1 when nobody's is. */
  readonly toPlay: number;
  /** Who played the pile's last card, while a finished count is being collected; -1 otherwise. */
  readonly lastPlayer: number;
  /** The latest points pegged, for the table; null when there are none to show. */
  readonly scored: Scored | null;
  /** The hands counted so far in the show: the non-dealer's, the dealer's, then the crib. */
  readonly shows: readonly Show[];
  /** Each player's points in this hand so far. */
  readonly tally: readonly Tally[];
  /** Each finished hand's points, by seat: the score sheet. */
  readonly history: readonly (readonly Tally[])[];
}
