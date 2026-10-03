import { parseCards, type Card } from './cards';
import type { RandomInt } from './deck';
import { seededRandomInt } from './random';
import type { Seat } from './tricks';

/** What the test helpers below need of a trick-taking game. */
interface Rules<State> {
  newGame: (randomInt: RandomInt) => State;
  sortHand: (cards: readonly Card[]) => Card[];
  playCard: (state: State, card: Card) => State;
  collect: (state: State) => State;
}

/** For tests of a trick-taking game: games with set hands and cards played from text such as "QS 10H". */
export function trickTesting<State extends { readonly phase: string; readonly players: readonly Seat[] }>(rules: Rules<State>) {
  return {
    /** A new game from a seeded shuffle, so a test is repeatable. */
    seededGame: (seed = 1): State => rules.newGame(seededRandomInt(seed)),

    /** Replaces the hands of some seats (by seat number), keeping everything else. */
    withHands: (state: State, hands: Record<number, string>): State => ({
      ...state,
      players: state.players.map((p) => (hands[p.id] ? { ...p, hand: rules.sortHand(parseCards(hands[p.id] as string)) } : p)),
    }),

    /** Plays cards one after another by whoever's turn it is, collecting each trick as it completes. */
    playAll: (state: State, text: string): State => {
      let current = state;
      for (const card of parseCards(text)) {
        current = rules.playCard(current, card);
        if (current.phase === 'collecting') current = rules.collect(current);
      }
      return current;
    },
  };
}
