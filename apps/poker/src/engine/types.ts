import type { Card } from '@card-games/cards-core';

export type { Card, Rank, Suit } from '@card-games/cards-core';

export type Street = 'preflop' | 'flop' | 'turn' | 'river';

/** 'action': a hand is being played. 'settled': it is over and the chips have been paid out. */
export type Phase = 'action' | 'settled';

export type Action =
  | { readonly type: 'fold' }
  | { readonly type: 'check' }
  | { readonly type: 'call' }
  /** A bet or a raise. `to` is the seat's whole bet for the street, not the extra chips. */
  | { readonly type: 'raise'; readonly to: number };

export type ActionKind = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'allin';

/** What a seat last did, for the label beside it. `amount` is its bet for the street after doing it. */
export interface LastAction {
  readonly kind: ActionKind;
  readonly amount: number;
}

export interface Seat {
  readonly id: number;
  readonly name: string;
  readonly human: boolean;
  /** Chips behind: not counting anything already bet in this hand. */
  readonly chips: number;
  /** Chips bet on the current street. */
  readonly bet: number;
  /** Chips put in over the whole hand: what the pots are built from. */
  readonly total: number;
  readonly hole: readonly Card[];
  readonly folded: boolean;
  readonly allIn: boolean;
  /** Has had a turn on this street (only matters for the option a player has when nobody has raised). */
  readonly acted: boolean;
  readonly last: LastAction | null;
}

export type HandCategory =
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush';

export interface HandRank {
  /** Higher beats lower; equal scores split the pot. */
  readonly score: number;
  readonly category: HandCategory;
  /** "Two pair, Kings and Fours". */
  readonly name: string;
  /** The five cards that make the hand. */
  readonly best: readonly Card[];
}

export interface Pot {
  readonly amount: number;
  /** Seats that can win it: those that put chips in at this level and have not folded. */
  readonly eligible: readonly number[];
  /** Only one seat put chips in at this level, so it is simply handed back. */
  readonly uncalled: boolean;
}

export interface PotResult extends Pot {
  readonly winners: readonly number[];
}

export interface SeatResult {
  readonly seat: number;
  /** Chips paid to the seat, counting any uncalled bet handed back. */
  readonly won: number;
  /** won minus everything the seat put in: positive for a profit, negative for a loss. */
  readonly net: number;
  /** Set for seats still in at a showdown, whose cards are turned over. */
  readonly rank: HandRank | null;
}

export type LogKind = ActionKind | 'small-blind' | 'big-blind' | 'board' | 'win';

export interface LogEntry {
  readonly kind: LogKind;
  readonly seat: number;
  /** The seat's bet for the street after the action, or (for wins) the chips won. */
  readonly amount: number;
  readonly street: Street;
}

export interface GameState {
  readonly phase: Phase;
  readonly street: Street;
  /** Hands played so far, counting this one. */
  readonly hand: number;
  /** The dealer button. */
  readonly button: number;
  /** The seats that posted the small and the big blind. */
  readonly smallBlind: number;
  readonly bigBlind: number;
  readonly seats: readonly Seat[];
  readonly board: readonly Card[];
  /** Undealt cards, next card first. */
  readonly deck: readonly Card[];
  /** The seat whose turn it is; -1 when the hand is over. */
  readonly toAct: number;
  /** The most any seat has bet on this street: what the others must match. */
  readonly currentBet: number;
  /** The smallest raise allowed: the size of the last full bet or raise, and at least a big blind. */
  readonly minRaise: number;
  readonly log: readonly LogEntry[];
  /** Filled in once the hand is settled. */
  readonly pots: readonly PotResult[];
  readonly results: readonly SeatResult[];
  /** The hand went to a showdown, so the remaining seats' cards are turned over. */
  readonly showdown: boolean;
}

/** What the seat to act may do right now. */
export interface LegalActions {
  readonly canCheck: boolean;
  readonly canCall: boolean;
  /** Chips needed to call (all of the stack if it is not enough). */
  readonly toCall: number;
  readonly canRaise: boolean;
  /** The smallest `to` for a raise; the whole stack if that is less than a full raise. */
  readonly minRaiseTo: number;
  /** All-in. */
  readonly maxRaiseTo: number;
}
