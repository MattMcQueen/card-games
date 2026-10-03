import { mulberry32, parseCards as cards, trickTesting } from '@card-games/cards-core';
import { chooseBid, decide } from './bot';
import { collect, newGame, placeBid, playCard, sortHand } from './game';
import type { GameState } from './types';

/** Cards from text such as "QS 10H 2C": rank then suit letter. */
export { cards };

export const { seededGame, withHands, playAll } = trickTesting({ newGame, sortHand, playCard, collect });

/** Everyone bids, in turn from the player on the dealer's left: `bids` by seat. */
export function bidAll(state: GameState, bids: readonly number[]): GameState {
  let current = state;
  while (current.phase === 'bidding') current = placeBid(current, bids[current.toPlay]!);
  return current;
}

/** Plays out a whole hand with the computer players' choices for every seat, bidding first if it has not been. */
export function autoplay(state: GameState, seed = 1): GameState {
  const random = mulberry32(seed);
  let current = state;
  while (current.phase !== 'settled') {
    if (current.phase === 'bidding') current = placeBid(current, chooseBid(current, random));
    else current = current.phase === 'collecting' ? collect(current) : playCard(current, decide(current, random));
  }
  return current;
}
