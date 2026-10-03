import { mulberry32, parseCards as cards, seededRandomInt } from '@card-games/cards-core';
import { choosePass, decide } from './bot';
import { collect, newGame, passCards, playCard, sortHand } from './game';
import type { GameState } from './types';

/** Cards from text such as "QS 10H 2C": rank then suit letter. */
export { cards };

/** A new game from a seeded shuffle, so a test is repeatable. */
export const seededGame = (seed = 1): GameState => newGame(seededRandomInt(seed));

/** Replaces the hands of some seats (by seat number), keeping everything else. */
export function withHands(state: GameState, hands: Record<number, string>): GameState {
  return {
    ...state,
    players: state.players.map((p) => (hands[p.id] ? { ...p, hand: sortHand(cards(hands[p.id] as string)) } : p)),
  };
}

/** Plays cards from text, one after another by whoever's turn it is, collecting each trick as it completes. */
export function playAll(state: GameState, text: string): GameState {
  let current = state;
  for (const card of cards(text)) {
    current = playCard(current, card);
    if (current.phase === 'collecting') current = collect(current);
  }
  return current;
}

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
