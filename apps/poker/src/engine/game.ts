import { createDeck, secureRandomInt, shuffle, type RandomInt } from '@card-games/cards-core';
import { BIG_BLIND, BOT_NAMES, HANDS_PER_LEVEL, HUMAN_SEAT, SEATS, SMALL_BLIND, STARTING_STACK } from './constants';
import { rankHand } from './evaluate';
import { buildPots } from './pots';
import type {
  Action,
  ActionKind,
  Blinds,
  Card,
  GameState,
  HandRank,
  LegalActions,
  LogEntry,
  PotResult,
  Seat,
  SeatResult,
  Street,
} from './types';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type MutableSeat = Mutable<Seat>;
/** A hand being worked on: the same as a GameState, but with the parts that change as it goes made editable. */
type Draft = Omit<Mutable<GameState>, 'seats' | 'board' | 'deck' | 'log'> & {
  seats: MutableSeat[];
  board: Card[];
  deck: Card[];
  log: LogEntry[];
};

const NO_ACTIONS: LegalActions = {
  canCheck: false,
  canCall: false,
  toCall: 0,
  canRaise: false,
  minRaiseTo: 0,
  maxRaiseTo: 0,
};

const NEXT_STREET: Partial<Record<Street, Street>> = { preflop: 'flop', flop: 'turn', turn: 'river' };

/** The blinds in hand number `hand` (counting from 1): 5 and 10 at first, doubling every HANDS_PER_LEVEL hands. */
export function blindsFor(hand: number): Blinds {
  const doublings = Math.floor(Math.max(0, hand - 1) / HANDS_PER_LEVEL);
  return { small: SMALL_BLIND * 2 ** doublings, big: BIG_BLIND * 2 ** doublings };
}

/** A new game: everyone has the starting stack, and the first hand has been dealt. */
export function newGame(randomInt: RandomInt = secureRandomInt): GameState {
  const seats: Seat[] = Array.from({ length: SEATS }, (_, id) => ({
    id,
    name: id === HUMAN_SEAT ? 'You' : (BOT_NAMES[id - 1] ?? `Player ${id}`),
    human: id === HUMAN_SEAT,
    chips: STARTING_STACK,
    bet: 0,
    total: 0,
    hole: [],
    folded: false,
    allIn: false,
    acted: false,
    last: null,
    place: null,
  }));
  const before: GameState = {
    phase: 'settled',
    street: 'preflop',
    hand: 0,
    button: randomInt(SEATS),
    smallBlind: 0,
    bigBlind: 0,
    blinds: blindsFor(1),
    seats,
    board: [],
    deck: [],
    toAct: -1,
    currentBet: 0,
    minRaise: BIG_BLIND,
    log: [],
    pots: [],
    results: [],
    showdown: false,
  };
  return nextHand(before, randomInt);
}

/** The game is over once a settled hand has left you without chips, or you with all of them. */
export function isGameOver(state: GameState): boolean {
  return state.phase === 'settled' && ((state.seats[HUMAN_SEAT]?.chips ?? 0) === 0 || state.seats.filter((s) => s.chips > 0).length === 1);
}

/** You have won the game: everyone else is out of chips. */
export function hasWon(state: GameState): boolean {
  return isGameOver(state) && (state.seats[HUMAN_SEAT]?.chips ?? 0) > 0;
}

/** It is a computer player to act. */
export function isBotTurn(state: GameState): boolean {
  const seat = state.seats[state.toAct];
  return state.phase === 'action' && !!seat && !seat.human;
}

/** Everything bet so far in this hand, on every street. */
export function potSize(state: GameState): number {
  return state.seats.reduce((sum, s) => sum + s.total, 0);
}

/** The next seat clockwise from `from` (not counting `from` itself, until the whole table has been tried) that passes `test`. */
function seatAfter(seats: readonly Seat[], from: number, test: (seat: Seat) => boolean): number {
  for (let i = 1; i <= seats.length; i++) {
    const id = (from + i) % seats.length;
    if (test(seats[id] as Seat)) return id;
  }
  return -1;
}

function draftOf(state: GameState): Draft {
  return {
    ...state,
    seats: state.seats.map((s) => ({ ...s })),
    board: [...state.board],
    deck: [...state.deck],
    log: [...state.log],
  };
}

function draw(g: Draft): Card {
  const card = g.deck.shift();
  if (!card) throw new Error('The deck is empty');
  return card;
}

function pay(seat: MutableSeat, amount: number): number {
  const paid = Math.min(amount, seat.chips);
  seat.chips -= paid;
  seat.bet += paid;
  seat.total += paid;
  if (seat.chips === 0) seat.allIn = true;
  return paid;
}

/**
 * Deals a new hand: the button moves on, the blinds go in and the hole cards are dealt. A player with
 * no chips left is out of the game, and one with fewer chips than a blind puts in what they have.
 * Play continues until the first decision is yours or a computer player's.
 */
export function nextHand(state: GameState, randomInt: RandomInt = secureRandomInt): GameState {
  if (isGameOver(state)) throw new Error('The game is over');
  const g = draftOf(state);
  for (const seat of g.seats) {
    seat.bet = 0;
    seat.total = 0;
    seat.hole = [];
    seat.allIn = false;
    seat.acted = false;
    seat.last = null;
    seat.folded = seat.chips === 0; // no chips: out of the game
  }
  const isIn = (s: Seat) => !s.folded;
  const players = g.seats.filter(isIn).length;

  g.hand += 1;
  g.blinds = blindsFor(g.hand);
  g.phase = 'action';
  g.street = 'preflop';
  g.board = [];
  g.log = [];
  g.pots = [];
  g.results = [];
  g.showdown = false;
  g.deck = shuffle(createDeck(), randomInt);
  g.button = seatAfter(g.seats, g.button, isIn);
  // With two players left the button posts the small blind, so acts first before the flop and last after it.
  g.smallBlind = players === 2 ? g.button : seatAfter(g.seats, g.button, isIn);
  g.bigBlind = seatAfter(g.seats, g.smallBlind, isIn);

  const first = seatAfter(g.seats, g.button, isIn);
  for (let round = 0; round < 2; round++) {
    for (let i = 0, id = first; i < g.seats.length; i++, id = (id + 1) % g.seats.length) {
      const seat = g.seats[id] as MutableSeat;
      if (!seat.folded) seat.hole = [...seat.hole, draw(g)];
    }
  }

  const small = pay(g.seats[g.smallBlind] as MutableSeat, g.blinds.small);
  const big = pay(g.seats[g.bigBlind] as MutableSeat, g.blinds.big);
  g.log.push({ kind: 'small-blind', seat: g.smallBlind, amount: small, street: 'preflop' });
  g.log.push({ kind: 'big-blind', seat: g.bigBlind, amount: big, street: 'preflop' });
  g.currentBet = g.blinds.big;
  g.minRaise = g.blinds.big;
  advance(g, g.bigBlind);
  return g;
}

/** Whether a seat still has a decision to make on this street. */
function needsAction(g: Draft, seat: Seat): boolean {
  if (seat.folded || seat.allIn) return false;
  if (seat.bet < g.currentBet) return true;
  if (seat.acted) return false;
  // Nobody to bet against once everyone else is all-in or has folded.
  return g.seats.filter((s) => !s.folded && !s.allIn).length >= 2;
}

/** Ends the betting on a street: the bets are gathered in and the next cards are dealt (after a burn card). */
function dealStreet(g: Draft, street: Street): void {
  for (const seat of g.seats) {
    seat.bet = 0;
    seat.acted = false;
    if (!seat.folded) seat.last = null;
  }
  g.currentBet = 0;
  g.minRaise = g.blinds.big;
  draw(g); // the burn card
  for (let i = street === 'flop' ? 3 : 1; i > 0; i--) g.board.push(draw(g));
  g.street = street;
  g.log.push({ kind: 'board', seat: -1, amount: 0, street });
}

/** Moves the hand on after `from` has acted: to the next seat with a decision, the next street, or the end. */
function advance(g: Draft, from: number): void {
  for (;;) {
    if (g.seats.filter((s) => !s.folded).length === 1) return settle(g);
    const next = seatAfter(g.seats, from, (s) => needsAction(g, s));
    if (next >= 0) {
      g.toAct = next;
      return;
    }
    const street = NEXT_STREET[g.street];
    if (!street) return settle(g);
    dealStreet(g, street);
    from = g.button;
  }
}

/** What the seat whose turn it is may do. */
export function legalActions(state: GameState): LegalActions {
  const seat = state.seats[state.toAct];
  if (state.phase !== 'action' || !seat) return NO_ACTIONS;
  const owed = state.currentBet - seat.bet;
  const maxRaiseTo = seat.bet + seat.chips;
  // Someone who has already had a turn may only raise again if the bet has since gone up by a full raise.
  const reopened = !seat.acted || owed >= state.minRaise;
  const canRaise = seat.chips > owed && reopened;
  return {
    canCheck: owed === 0,
    canCall: owed > 0,
    toCall: Math.min(owed, seat.chips),
    canRaise,
    minRaiseTo: Math.min(state.currentBet + state.minRaise, maxRaiseTo),
    maxRaiseTo,
  };
}

/** A bet or a raise to `requested` (or all-in, if that is more than the stack). Throws if it is not allowed. */
function raise(g: Draft, seat: MutableSeat, requested: number, legal: LegalActions): ActionKind {
  if (!legal.canRaise) throw new Error('You cannot raise now');
  const opening = g.currentBet === 0;
  const to = Math.min(Math.floor(requested), legal.maxRaiseTo);
  if (to < legal.minRaiseTo) throw new Error(`The smallest raise is to ${legal.minRaiseTo}`);
  pay(seat, to - seat.bet);
  seat.acted = true;
  // A raise short of a full one (only possible all-in) does not change the size of the next raise.
  if (to - g.currentBet >= g.minRaise) g.minRaise = to - g.currentBet;
  g.currentBet = to;
  return seat.allIn ? 'allin' : opening ? 'bet' : 'raise';
}

/** Makes a move for `seat`, and says what kind of move it turned out to be. Throws if it is not allowed. */
function makeMove(g: Draft, seat: MutableSeat, action: Action, legal: LegalActions): ActionKind {
  switch (action.type) {
    case 'fold':
      seat.folded = true;
      return 'fold';
    case 'check':
      if (!legal.canCheck) throw new Error('You cannot check: there is a bet to match');
      seat.acted = true;
      return 'check';
    case 'call':
      if (!legal.canCall) throw new Error('There is nothing to call');
      pay(seat, legal.toCall);
      seat.acted = true;
      return seat.allIn ? 'allin' : 'call';
    case 'raise':
      return raise(g, seat, action.to, legal);
  }
}

/** Plays the move of the seat whose turn it is. Throws if it is not allowed. */
export function act(state: GameState, action: Action): GameState {
  if (state.phase !== 'action') throw new Error('The hand is over');
  const g = draftOf(state);
  const seat = g.seats[g.toAct] as MutableSeat;
  const kind = makeMove(g, seat, action, legalActions(state));

  seat.last = { kind, amount: seat.bet };
  g.log.push({ kind, seat: seat.id, amount: seat.bet, street: g.street });
  advance(g, seat.id);
  return g;
}

/** Pays out the pots, at a showdown if more than one seat is left. */
function settle(g: Draft): void {
  const live = g.seats.filter((s) => !s.folded);
  const showdown = live.length > 1;
  const ranks = new Map<number, HandRank>();
  if (showdown) for (const seat of live) ranks.set(seat.id, rankHand([...seat.hole, ...g.board]));

  const payouts = g.seats.map(() => 0);
  const won = g.seats.map(() => 0); // payouts, not counting bets handed back
  const pots: PotResult[] = buildPots(g.seats).map((pot) => {
    const best = Math.max(...pot.eligible.map((id) => ranks.get(id)?.score ?? 0));
    const winners = pot.eligible.filter((id) => (ranks.get(id)?.score ?? 0) === best);
    const share = Math.floor(pot.amount / winners.length);
    const odd = pot.amount - share * winners.length;
    // Any odd chip goes to the winner nearest the left of the button, then the next, and so on.
    const order = [...winners].sort(
      (a, b) => ((a - g.button - 1 + SEATS) % SEATS) - ((b - g.button - 1 + SEATS) % SEATS),
    );
    order.forEach((id, i) => {
      const amount = share + (i < odd ? 1 : 0);
      payouts[id] = (payouts[id] as number) + amount;
      if (!pot.uncalled) won[id] = (won[id] as number) + amount;
    });
    return { ...pot, winners };
  });

  g.results = g.seats.map(
    (seat): SeatResult => ({
      seat: seat.id,
      won: payouts[seat.id] as number,
      net: (payouts[seat.id] as number) - seat.total,
      rank: showdown && !seat.folded ? (ranks.get(seat.id) ?? null) : null,
    }),
  );
  for (const seat of g.seats) {
    seat.chips += payouts[seat.id] as number;
    const amount = won[seat.id] as number;
    if (amount > 0) g.log.push({ kind: 'win', seat: seat.id, amount, street: g.street });
  }
  g.pots = pots;
  g.showdown = showdown;
  g.phase = 'settled';
  g.toAct = -1;
  placeFinishers(g);
}

/**
 * Players who ran out of chips in this hand are out of the game, and take the places below everyone
 * still in: of two out in the same hand, the one who started it with more chips finishes higher. Once
 * one player is left, they have won.
 */
function placeFinishers(g: Draft): void {
  const left = g.seats.filter((s) => s.chips > 0);
  const out = g.seats.filter((s) => s.chips === 0 && s.place === null).sort((a, b) => b.total - a.total || a.id - b.id);
  out.forEach((seat, i) => (seat.place = left.length + 1 + i));
  if (left.length === 1) (left[0] as MutableSeat).place = 1;
}
