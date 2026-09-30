import { reducedMotion } from '@card-games/card-kit/motion';
import { HUMAN_SEAT, isGameOver, type GameState, type HandRank, type SeatResult } from '../engine';
import { boardDelay, holeDelay, revealDelay } from './motion';
import { playSound, type SoundName } from './synth';

export interface Cue {
  readonly sound: SoundName;
  /** Seconds after the change at which the sound should start. */
  readonly at: number;
}

/** Hands worth a fanfare rather than a plain win. */
const BIG_HANDS = new Set(['straight', 'flush', 'full-house', 'four-of-a-kind', 'straight-flush']);

/** How a step adds its sounds: `add` queues one, `spaced` gives the time of an animation. */
interface Timing {
  readonly add: (sound: SoundName, at?: number) => void;
  /** Seconds for an animation that lands after `ms`; with reduced motion nothing flies, so sounds are just spaced out. */
  readonly spaced: (ms: number, order: number) => number;
  readonly reduced: boolean;
}

/** A new hand: the shuffle, two rounds of cards round the table, and the blinds going in. */
function dealCues(next: GameState, { add, spaced }: Timing) {
  add('shuffle');
  const players = next.seats.filter((s) => s.hole.length > 0).length;
  for (let round = 0; round < 2; round++) {
    for (let order = 0; order < players; order++) {
      add('deal', spaced(holeDelay(order, round), round * players + order));
    }
  }
  add('chip', spaced(900, players * 2));
}

/** Whatever was done since: each move makes its sound, and each new board card lands with its own. */
function moveCues(prev: GameState, next: GameState, { add, spaced }: Timing) {
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

/** A plain win jingle, or a fanfare for a big hand. */
const winSound = (rank: HandRank | null | undefined): SoundName => (rank && BIG_HANDS.has(rank.category) ? 'bigWin' : 'win');

/** The sounds for how the hand went for you, each with the seconds after the result at which it plays. */
export function outcomeSounds(mine: SeatResult | undefined): [SoundName, number][] {
  const net = mine?.net ?? 0;
  if (net > 0) return [[winSound(mine?.rank), 0], ['payout', 0.25]];
  // Losing a showdown stings; losing the blinds or a fold quietly does not.
  if (net < 0) return mine?.rank ? [['lose', 0], ['sweep', 0.1]] : [['sweep', 0.1]];
  return [['payout', 0]];
}

/** The result, once the cards have landed. */
function settleCues(prev: GameState, next: GameState, { add, reduced }: Timing) {
  const at = reduced ? 0.2 : revealDelay(prev.board.length, next.board.length, next.showdown) / 1000;
  for (const [sound, after] of outcomeSounds(next.results[HUMAN_SEAT])) add(sound, at + after);
  if (isGameOver(next)) add('gameOver', at + 0.8);
}

/**
 * Which sounds a change of game state should make, and when. The times mirror the card
 * animations, so each card sound lands as its card does.
 */
export function cuesFor(prev: GameState, next: GameState, reduced = reducedMotion): Cue[] {
  const cues: Cue[] = [];
  const timing: Timing = {
    add: (sound, at = 0) => cues.push({ sound, at }),
    spaced: (ms, order) => (reduced ? order * 0.1 : ms / 1000),
    reduced,
  };

  if (next.hand !== prev.hand) dealCues(next, timing);
  else moveCues(prev, next, timing);

  if (next.phase === 'settled' && prev.phase !== 'settled') settleCues(prev, next, timing);
  return cues;
}

export function playCues(cues: readonly Cue[]): void {
  for (const cue of cues) playSound(cue.sound, cue.at);
}
