import { HUMAN_SEAT, isGameOver, type GameState } from '../engine';
import { boardDelay, holeDelay, reducedMotion, revealDelay } from './motion';
import type { SoundName } from './synth';

export interface Cue {
  readonly sound: SoundName;
  /** Seconds after the change at which the sound should start. */
  readonly at: number;
}

/** Hands worth a fanfare rather than a plain win. */
const BIG_HANDS = new Set(['straight', 'flush', 'full-house', 'four-of-a-kind', 'straight-flush']);

/**
 * Which sounds a change of game state should make, and when. The times mirror the card
 * animations, so each card sound lands as its card does.
 */
export function cuesFor(prev: GameState, next: GameState, reduced = reducedMotion): Cue[] {
  const cues: Cue[] = [];
  const add = (sound: SoundName, at = 0) => cues.push({ sound, at });
  /** With reduced motion nothing flies, so the sounds are just spaced out a little. */
  const spaced = (ms: number, order: number) => (reduced ? order * 0.1 : ms / 1000);

  if (next.hand !== prev.hand) {
    add('shuffle');
    const players = next.seats.filter((s) => s.hole.length > 0).length;
    for (let round = 0; round < 2; round++) {
      for (let order = 0; order < players; order++) {
        add('deal', spaced(holeDelay(order, round), round * players + order));
      }
    }
    add('chip', spaced(900, players * 2));
  } else {
    for (const entry of next.log.slice(prev.log.length)) {
      if (entry.kind === 'fold') add('fold');
      else if (entry.kind === 'check') add('check');
      else if (entry.kind === 'call' || entry.kind === 'bet' || entry.kind === 'raise') add('chip');
      else if (entry.kind === 'allin') {
        add('chip');
        add('payout', 0.12);
      }
    }
    for (let i = prev.board.length; i < next.board.length; i++) {
      add('deal', spaced(boardDelay(i, prev.board.length), i - prev.board.length));
    }
  }

  if (next.phase === 'settled' && prev.phase !== 'settled') {
    const at = reduced ? 0.2 : revealDelay(prev.board.length, next.board.length, next.showdown) / 1000;
    const mine = next.results[HUMAN_SEAT];
    const category = mine?.rank?.category;
    if (mine && mine.net > 0) {
      add(category && BIG_HANDS.has(category) ? 'bigWin' : 'win', at);
      add('payout', at + 0.25);
    } else if (mine && mine.net < 0) {
      // Losing a showdown stings; losing the blinds or a fold quietly does not.
      if (mine.rank) add('lose', at);
      add('sweep', at + 0.1);
    } else {
      add('payout', at);
    }
    if (isGameOver(next)) add('gameOver', at + 0.8);
  }
  return cues;
}
