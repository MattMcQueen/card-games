import { BIG_BLIND, SEATS } from './constants';
import { createDeck, secureRandomInt, type RandomInt } from './deck';
import { evaluate, rankValue } from './evaluate';
import { legalActions, potSize } from './game';
import type { Action, Card, GameState, LegalActions, Seat } from './types';

/** How a computer player plays. The five seats each have their own, so the table is not all alike. */
interface Persona {
  /** Added to the number of hands played: positive plays more hands, negative fewer. */
  readonly looseness: number;
  /** 0 to 1: how often a good hand bets or raises rather than just calling. */
  readonly aggression: number;
  /** 0 to 1: how often a weak hand bets anyway. */
  readonly bluff: number;
}

const PERSONAS: readonly Persona[] = [
  { looseness: 2, aggression: 0.25, bluff: 0.05 }, // Terry: calls too much
  { looseness: -1, aggression: 0.5, bluff: 0.08 }, // Margaret: solid
  { looseness: 1, aggression: 0.85, bluff: 0.25 }, // Nigel: fires at everything
  { looseness: 0, aggression: 0.6, bluff: 0.12 }, // Priya: all-round
  { looseness: -0.5, aggression: 0.35, bluff: 0.04 }, // Gary: careful
];

/** How good a seat's place is: the button acts last after the flop, so it can play more hands. */
const POSITION_VALUE = [1, 0.35, 0.45, 0, 0.3, 0.65]; // by seats after the button: button, small blind, big blind, then the rest

/** A fast seeded generator (mulberry32) returning numbers in [0, 1). */
function fastRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roundTo5 = (n: number) => Math.round(n / 5) * 5;

/**
 * The Chen formula: a rough score for two starting cards, from about -1 (7-2 offsuit) to 20
 * (a pair of aces). Pairs, high cards, suited cards and cards close together all score more.
 */
export function chenScore(a: Card, b: Card): number {
  const [hi, lo] = [rankValue(a.rank), rankValue(b.rank)].sort((x, y) => y - x) as [number, number];
  const points = (v: number) => (v === 14 ? 10 : v === 13 ? 8 : v === 12 ? 7 : v === 11 ? 6 : v / 2);
  if (hi === lo) return Math.ceil(Math.max(5, points(hi) * 2));
  let score = points(hi);
  if (a.suit === b.suit) score += 2;
  const gap = hi - lo - 1;
  score -= [0, 1, 2, 4][gap] ?? 5;
  if (gap <= 1 && hi < 12) score += 1; // can make a straight without needing a high card
  return Math.ceil(score);
}

/**
 * The share of the pot a hand can expect to win, found by dealing out the rest of the hand many
 * times against random hands. A tie counts as a share.
 */
export function estimateEquity(
  hole: readonly Card[],
  board: readonly Card[],
  opponents: number,
  trials: number,
  random: () => number,
): number {
  const known = new Set([...hole, ...board].map((c) => c.rank + c.suit));
  const rest = createDeck().filter((c) => !known.has(c.rank + c.suit));
  const boardNeeded = 5 - board.length;
  const needed = boardNeeded + opponents * 2;
  let wins = 0;
  for (let t = 0; t < trials; t++) {
    // Deal `needed` random cards by shuffling just the front of the deck.
    for (let i = 0; i < needed; i++) {
      const j = i + Math.floor(random() * (rest.length - i));
      [rest[i], rest[j]] = [rest[j] as Card, rest[i] as Card];
    }
    const full = [...board, ...(rest.slice(0, boardNeeded) as Card[])];
    const mine = evaluate([...hole, ...full]);
    let lost = false;
    let sharing = 1;
    for (let o = 0; o < opponents; o++) {
      const at = boardNeeded + o * 2;
      const theirs = evaluate([rest[at] as Card, rest[at + 1] as Card, ...full]);
      if (theirs > mine) {
        lost = true;
        break;
      }
      if (theirs === mine) sharing++;
    }
    if (!lost) wins += 1 / sharing;
  }
  return wins / trials;
}

interface Situation {
  readonly state: GameState;
  readonly seat: Seat;
  readonly legal: LegalActions;
  readonly persona: Persona;
  readonly random: () => number;
  /** Everything in the pot right now. */
  readonly pot: number;
  /** Players still in the hand besides this one. */
  readonly opponents: number;
  /** The chips this seat could still bet on the street (its stack plus what it has in). */
  readonly stack: number;
}

const FOLD: Action = { type: 'fold' };
const CHECK: Action = { type: 'check' };
const CALL: Action = { type: 'call' };
const raiseTo = (to: number): Action => ({ type: 'raise', to });

/** Bets or raises to `to`; when that would commit most of the stack, all of it goes in. */
function sizedRaise({ legal, stack }: Situation, to: number): Action {
  if (!legal.canRaise) return legal.canCall ? CALL : CHECK;
  const target = Math.min(Math.max(roundTo5(to), legal.minRaiseTo), legal.maxRaiseTo);
  return raiseTo(target >= stack * 0.6 ? legal.maxRaiseTo : target);
}

/** How many times the betting has been raised so far before the flop (the big blind counts as none). */
function preflopRaises(state: GameState): number {
  let highest = BIG_BLIND;
  let raises = 0;
  for (const entry of state.log) {
    if (entry.street !== 'preflop' || entry.kind === 'small-blind' || entry.kind === 'big-blind') continue;
    if (entry.amount > highest) {
      highest = entry.amount;
      raises++;
    }
  }
  return raises;
}

function preflop(sit: Situation): Action {
  const { state, seat, legal, persona, random, stack } = sit;
  const score = chenScore(seat.hole[0] as Card, seat.hole[1] as Card);
  const position = POSITION_VALUE[(seat.id - state.button + SEATS) % SEATS] ?? 0;
  const raises = preflopRaises(state);
  const stackInBlinds = stack / BIG_BLIND;
  const shove = sizedRaise(sit, legal.maxRaiseTo);

  // Short stacks just go all-in with anything decent or fold.
  if (stackInBlinds <= 10) {
    if (legal.canCheck && score < 8) return CHECK;
    return score >= 7 - position * 2 - persona.looseness || (raises === 0 && score >= 5) ? shove : legal.canCheck ? CHECK : FOLD;
  }

  if (raises === 0) {
    const limpers = state.log.filter((e) => e.street === 'preflop' && e.kind === 'call').length;
    const open = 8.5 - 3 * position - persona.looseness;
    const size = BIG_BLIND * (2.5 + random()) + limpers * BIG_BLIND;
    if (score >= open) {
      // Sometimes a medium hand just limps in behind, depending on the player.
      const limp = score < open + 2.5 && random() > 0.35 + persona.aggression * 0.5;
      if (limp) return legal.canCheck ? CHECK : CALL;
      return sizedRaise(sit, size);
    }
    if (legal.canCheck) return CHECK;
    const marginal = score >= open - 2.5 && (persona.looseness > 0 || random() < 0.25);
    return marginal ? CALL : FOLD;
  }

  // Facing a raise: the more it costs, and the more it has been raised, the better a hand must be.
  const pressure = Math.min(1, legal.toCall / Math.max(1, seat.chips));
  const call = [8 - position * 1.5 - persona.looseness * 0.7, 11 - persona.looseness * 0.5, 14][raises - 1] ?? 14;
  const reraise = [11.5 - persona.looseness * 0.5, 15, 16][raises - 1] ?? 16;
  const bluff = raises === 1 && score >= 6 && random() < persona.bluff * 0.5;
  if ((score >= reraise || bluff) && legal.canRaise) return sizedRaise(sit, state.currentBet * (2.7 + random() * 0.6));
  if (score >= call + 9 * pressure) return legal.canCall ? CALL : CHECK;
  return legal.canCheck ? CHECK : FOLD;
}

function postflop(sit: Situation): Action {
  const { state, seat, legal, persona, random, pot, opponents } = sit;
  const equity = estimateEquity(seat.hole, state.board, opponents, opponents > 2 ? 300 : 400, random);
  const facing = legal.toCall > 0;

  if (!facing) {
    const heads = opponents === 1;
    const value = equity >= 0.68 && random() < 0.55 + persona.aggression * 0.4;
    const medium = equity >= 0.5 && equity < 0.68 && random() < 0.15 + persona.aggression * 0.5;
    const bluff = equity < 0.5 && random() < persona.bluff * (heads ? 1.5 : 0.5);
    if (value) return sizedRaise(sit, seat.bet + pot * (0.5 + random() * 0.3));
    if (medium) return sizedRaise(sit, seat.bet + pot * (0.33 + random() * 0.17));
    if (bluff) return sizedRaise(sit, seat.bet + pot * 0.5);
    return CHECK;
  }

  // A player who bets usually has a better hand than a random one, so shade the odds against big bets.
  const strength = equity - Math.min(0.2, (0.22 * legal.toCall) / pot);
  const potOdds = legal.toCall / (pot + legal.toCall);
  if (strength >= 0.72 && random() < 0.35 + persona.aggression * 0.6) {
    return sizedRaise(sit, state.currentBet + (pot + legal.toCall) * (0.6 + random() * 0.4));
  }
  if (strength < 0.3 && opponents <= 2 && random() < persona.bluff * 0.35) {
    return sizedRaise(sit, state.currentBet + pot * 0.75);
  }
  return strength >= potOdds + 0.03 - persona.looseness * 0.01 ? CALL : FOLD;
}

/** Makes sure the move is allowed: never folds when checking is free, and keeps raises within the limits. */
function legalize(action: Action, legal: LegalActions): Action {
  switch (action.type) {
    case 'fold':
      return legal.canCheck ? CHECK : FOLD;
    case 'check':
      return legal.canCheck ? CHECK : FOLD;
    case 'call':
      return legal.canCall ? CALL : CHECK;
    case 'raise': {
      if (!legal.canRaise) return legal.canCall ? CALL : CHECK;
      const to = Math.floor(Math.min(Math.max(action.to, legal.minRaiseTo), legal.maxRaiseTo));
      return raiseTo(to);
    }
  }
}

/** The move a computer player makes when it is their turn. */
export function decide(state: GameState, randomInt: RandomInt = secureRandomInt): Action {
  const seat = state.seats[state.toAct];
  if (state.phase !== 'action' || !seat) throw new Error('Nobody is to act');
  const legal = legalActions(state);
  const sit: Situation = {
    state,
    seat,
    legal,
    persona: PERSONAS[(seat.id - 1 + PERSONAS.length) % PERSONAS.length] as Persona,
    random: fastRandom(randomInt(0x100000000)),
    pot: potSize(state),
    opponents: state.seats.filter((s) => s.id !== seat.id && !s.folded).length,
    stack: seat.bet + seat.chips,
  };
  return legalize(state.street === 'preflop' ? preflop(sit) : postflop(sit), legal);
}
