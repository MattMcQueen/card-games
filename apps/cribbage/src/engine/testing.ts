import { mulberry32, parseCards as cards, seededRandomInt } from '@card-games/cards-core';
import { chooseDiscard, decide } from './bot';
import { collect, discard, mustGo, newGame, playCard, sayGo, showNext, sortHand } from './game';
import type { GameState } from './types';

/** Cards from text such as "QS 10H 2C": rank then suit letter. */
export { cards };

/** A new game from a seeded shuffle, so a test is repeatable. */
export const seededGame = (seed = 1): GameState => newGame(seededRandomInt(seed));

/**
 * Sets up a hand: the cards each seat holds (by seat, as text), the next card of the stock (the starter, once cut)
 * and who deals.
 */
export function withHands(state: GameState, hands: Record<number, string>, starter?: string, dealer = state.dealer): GameState {
  return {
    ...state,
    dealer,
    players: state.players.map((p) => (hands[p.id] ? { ...p, hand: sortHand(cards(hands[p.id]!)) } : p)),
    stock: starter ? [...cards(starter), ...state.stock] : state.stock,
  };
}

/** Both players discard: the cards given (by seat, as text), or what the computer player would choose. */
export function discardAll(state: GameState, picks: Record<number, string> = {}, random = mulberry32(1)): GameState {
  return discard(
    state,
    state.players.map((p) => (picks[p.id] ? cards(picks[p.id]!) : chooseDiscard(state, p.id, random))),
  );
}

/** Plays cards one after another by whoever's turn it is, saying "go" when they must and turning over finished counts. */
export function playAll(state: GameState, text: string): GameState {
  let current = state;
  for (const card of cards(text)) {
    while (current.phase === 'collecting' || mustGo(current)) current = current.phase === 'collecting' ? collect(current) : sayGo(current);
    current = playCard(current, card);
  }
  return current;
}

/** One move of the hand with the computer player's choices for both seats. */
export function step(state: GameState, random: () => number): GameState {
  switch (state.phase) {
    case 'discarding':
      return discardAll(state, {}, random);
    case 'collecting':
      return collect(state);
    case 'showing':
      return showNext(state);
    default:
      if (mustGo(state)) return sayGo(state);
      // Both seats play as the computer player does.
      return playCard(state, decide(state, random));
  }
}

/** Plays out the rest of the hand with the computer player's choices for both seats. */
export function autoplay(state: GameState, seed = 1): GameState {
  const random = mulberry32(seed);
  let current = state;
  while (current.phase !== 'settled') current = step(current, random);
  return current;
}
