import { mulberry32, parseCards as cards, trickTesting } from '@card-games/cards-core';
import { choosePass, decide } from './bot';
import { collect, newGame, passCards, playCard, sortHand } from './game';
import type { GameState } from './types';

/** Cards from text such as "QS 10H 2C": rank then suit letter. */
export { cards };

export const { seededGame, withHands, playAll } = trickTesting({ newGame, sortHand, playCard, collect });

/** Plays out a whole hand with the computer players' choices for every seat, passing first if it is a passing hand. */
export function autoplay(state: GameState, seed = 1): GameState {
  const random = mulberry32(seed);
  let current = state;
  if (current.phase === 'passing') {
    current = passCards(current, current.players.map((p) => choosePass(current, p.id, random)));
  }
  while (current.phase !== 'settled') {
    current = current.phase === 'collecting' ? collect(current) : playCard(current, decide(current, random));
  }
  return current;
}
