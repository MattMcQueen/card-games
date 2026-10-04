import { preloadCards } from './cardImages';
import { unlockAudio } from './sound.svelte';
import { animationTime, collectWait, thinkTime } from './trickMotion';

/** What a game played in turns tells the loop below. */
interface Rules<State> {
  /** Plays the sounds for a change of state. */
  sounds: (prev: State, next: State) => void;
  /** How long a change keeps cards moving, in milliseconds: by default, a deal, a card played or a trick taken. */
  moving?: (prev: State, next: State) => number;
  /** It is a computer player's turn, and what it does. */
  isBotTurn: (state: State) => boolean;
  botMove: (state: State) => State;
  /** The winner of a complete trick takes it (or in Cribbage, the cards of a finished count are turned over). */
  collect: (state: State) => State;
}

/**
 * The game of a table played in turns (Hearts, Spades, Bridge, Cribbage), as it goes on: the computer players take their turns a
 * little apart so you can follow them, after any cards still moving have landed, and a complete trick stays
 * on the table for a moment before whoever won it takes it. Made while a component starts up.
 */
export class TurnTaker<State extends { readonly phase: string; readonly hand: number; readonly trick?: readonly unknown[] }> {
  // Cards are never edited in place, so the state needs no deep reactivity.
  game: State = $state.raw() as State;
  readonly #rules: Rules<State>;
  // Not reactive: read when the timers are set.
  #animatingUntil = 0;

  constructor(start: State, rules: Rules<State>) {
    this.game = start;
    this.#rules = rules;
    $effect(() => {
      const game = this.game;
      const landing = this.#animatingUntil - performance.now();
      if (rules.isBotTurn(game)) {
        const id = setTimeout(() => this.update(rules.botMove(game)), thinkTime(landing, Math.random()));
        return () => clearTimeout(id);
      }
      if (game.phase === 'collecting') {
        const id = setTimeout(() => this.update(rules.collect(game)), collectWait(landing));
        return () => clearTimeout(id);
      }
    });
  }

  /**
   * Every change of game state goes through here so the matching sounds are played. Browsers only start
   * audio from a tap or key press, and the first change comes from one.
   */
  update(next: State): void {
    unlockAudio();
    preloadCards();
    this.#rules.sounds(this.game, next);
    this.#animatingUntil = Math.max(this.#animatingUntil, performance.now() + (this.#rules.moving ?? animationTime)(this.game, next));
    this.game = next;
  }
}
