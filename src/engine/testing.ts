import { SEATS } from './constants';
import { createDeck, type RandomInt } from './deck';
import { act, legalActions, newGame } from './game';
import type { Card, GameState, Rank, Suit } from './types';

/** Small deterministic random generator (mulberry32) so tests are repeatable. */
export function seededRandomInt(seed: number): RandomInt {
  let a = seed >>> 0;
  return (max) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * max);
  };
}

/** Cards from text such as "As Kh 10d 2c": rank then suit letter. */
export function cards(text: string): Card[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => ({
      rank: token.slice(0, -1).toUpperCase() as Rank,
      suit: token.slice(-1).toUpperCase() as Suit,
    }));
}

/**
 * A new game whose first hand has the button on `button`, so the small blind is the next seat,
 * the big blind the one after, and the seat after that acts first.
 */
export function gameWithButton(button: number, seed = 1): GameState {
  const random = seededRandomInt(seed);
  let first = true;
  return newGame((max) => {
    if (!first) return random(max);
    first = false;
    return (button + SEATS - 1) % SEATS; // the button moves on by one seat when the hand is dealt
  });
}

/** Replaces the hole cards (per seat, by seat number) and the board that will be dealt, keeping everything else. */
export function rig(state: GameState, holes: Record<number, string>, board = ''): GameState {
  const seats = state.seats.map((seat) => (holes[seat.id] ? { ...seat, hole: cards(holes[seat.id] as string) } : seat));
  const used = new Set([...seats.flatMap((s) => s.hole), ...cards(board)].map((c) => c.rank + c.suit));
  const fillers = createDeck().filter((c) => !used.has(c.rank + c.suit));
  const [flop, turn, river] = [cards(board).slice(0, 3), cards(board).slice(3, 4), cards(board).slice(4, 5)];
  // The deck is burn, flop, burn, turn, burn, river, then the rest.
  const deck = [fillers[0], ...flop, fillers[1], ...turn, fillers[2], ...river, ...fillers.slice(3)] as Card[];
  return { ...state, seats, deck };
}

/** Changes what some seats have behind, by seat number. */
export function withChips(state: GameState, chips: Record<number, number>): GameState {
  return { ...state, seats: state.seats.map((s) => (s.id in chips ? { ...s, chips: chips[s.id] as number } : s)) };
}

/** Plays moves from text: "fold", "call", "check" or "raise 60" (a raise to 60), and "allin". */
export function play(state: GameState, ...moves: string[]): GameState {
  let current = state;
  for (const move of moves) {
    const [type, amount] = move.split(' ');
    if (type === 'allin') {
      current = act(current, { type: 'raise', to: legalActions(current).maxRaiseTo });
    } else if (type === 'raise') {
      current = act(current, { type: 'raise', to: Number(amount) });
    } else {
      current = act(current, { type: type as 'fold' | 'check' | 'call' });
    }
  }
  return current;
}

/** Chips on the table plus chips in stacks: constant through a hand. */
export function chipsInPlay(state: GameState): number {
  return state.seats.reduce((sum, s) => sum + s.chips + (state.phase === 'settled' ? 0 : s.total), 0);
}
