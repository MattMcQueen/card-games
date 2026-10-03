import { mulberry32, parseCards as cards, trickTesting } from '@card-games/cards-core';
import { chooseCall } from './bidding';
import { decide } from './bot';
import { bid, collect, makeCall, newGame, PASS, playCard, sortHand } from './game';
import type { Call, GameState, Strain } from './types';

/** Cards from text such as "QS 10H 2C": rank then suit letter. */
export { cards };

const shared = trickTesting({ newGame, sortHand, playCard, collect });
export const { seededGame, playAll } = shared;

/** Replaces the hands of some seats (by seat number), as dealt, keeping everything else. */
export function withHands(state: GameState, hands: Record<number, string>): GameState {
  const g = shared.withHands(state, hands);
  return { ...g, dealt: g.players.map((p) => p.hand) };
}

/** Calls from text such as "1H P 2H P P P": a level and strain (C, D, H, S, NT), P for pass, X double, XX redouble. */
export function calls(text: string): Call[] {
  return text
    .trim()
    .split(/\s+/)
    .map((t) => {
      if (t === 'P') return PASS;
      if (t === 'X') return { kind: 'double' };
      if (t === 'XX') return { kind: 'redouble' };
      return bid(Number(t[0]), t.slice(1) as Strain);
    });
}

/** Makes the calls in `text`, in turn from whoever is to call. */
export const auction = (state: GameState, text: string): GameState => calls(text).reduce(makeCall, state);

/** Plays out the rest of the hand with the computer players' choices for every seat, the auction too if it has not ended. */
export function autoplay(state: GameState, seed = 1): GameState {
  const random = mulberry32(seed);
  let current = state;
  while (current.phase !== 'settled') {
    if (current.phase === 'bidding') current = makeCall(current, chooseCall(current));
    else current = current.phase === 'collecting' ? collect(current) : playCard(current, decide(current, random));
  }
  return current;
}
