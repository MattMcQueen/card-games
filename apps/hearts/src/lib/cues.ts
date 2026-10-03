import { DEAL_DURATION, reducedMotion } from '@card-games/card-kit/motion';
import { HAND_SIZE, HUMAN_SEAT, hasWon, isGameOver, isQueenOfSpades, type GameState } from '../engine';
import { COLLECT_DURATION, dealDelay } from './motion';
import { playSound, type SoundName } from './synth';

export interface Cue {
  readonly sound: SoundName;
  /** Seconds after the change at which the sound should start. */
  readonly at: number;
}

/**
 * The sounds for how a hand went for you, once it is scored: a fanfare for shooting the moon, a
 * jingle for taking no points, and a groan when someone else shoots the moon on you.
 */
function handSounds(next: GameState): SoundName[] {
  const result = next.result;
  if (!result) return [];
  if (result.moon === HUMAN_SEAT) return ['bigWin'];
  if (result.moon !== null) return ['lose'];
  return result.points[HUMAN_SEAT] === 0 ? ['win'] : [];
}

const cue = (sound: SoundName, at = 0): Cue => ({ sound, at });

/** A new hand: the shuffle, then a card sound for each round of the deal. */
function dealCues(reduced: boolean): Cue[] {
  const rounds = Array.from({ length: HAND_SIZE }, (_, round) => cue('deal', reduced ? round * 0.05 : 0.9 + dealDelay(0, round) / 1000));
  return [cue('shuffle'), ...rounds];
}

/** A card played to the trick, and a chime if it is the first heart. */
function playedCues(prev: GameState, next: GameState, landing: number): Cue[] {
  const broken = next.heartsBroken && !prev.heartsBroken;
  return broken ? [cue('play', landing), cue('broken', landing + 0.15)] : [cue('play', landing)];
}

/** Taking the queen of spades yourself stings, unless it completes your shooting the moon. */
function queenSting(prev: GameState, next: GameState): Cue[] {
  const yours = prev.winner === HUMAN_SEAT && prev.trick.some((p) => isQueenOfSpades(p.card));
  return yours && next.result?.moon !== HUMAN_SEAT ? [cue('lose', 0.1)] : [];
}

/** The end of the hand: how it went for you, and whether the game is over. */
function settleCues(next: GameState, reduced: boolean): Cue[] {
  if (next.phase !== 'settled') return [];
  const after = reduced ? 0.2 : COLLECT_DURATION / 1000 + 0.2;
  const hand = handSounds(next).map((sound) => cue(sound, after));
  if (!isGameOver(next)) return hand;
  return [...hand, cue(hasWon(next) ? 'bigWin' : 'gameOver', after + 0.8)];
}

/**
 * Which sounds a change of game state should make, and when. The times mirror the card animations,
 * so each card sound lands as its card does.
 */
export function cuesFor(prev: GameState, next: GameState, reduced = reducedMotion): Cue[] {
  const landing = reduced ? 0 : (DEAL_DURATION * 0.55) / 1000;
  if (next.hand !== prev.hand) return dealCues(reduced);
  // The cards passed to you land in your hand.
  if (prev.phase === 'passing' && next.phase !== 'passing') return next.players[HUMAN_SEAT]!.received.map((_, i) => cue('deal', landing + i * 0.08));
  if (next.trick.length > prev.trick.length) return playedCues(prev, next, landing);
  if (prev.phase === 'collecting' && next.phase !== 'collecting') return [cue('gather'), ...queenSting(prev, next), ...settleCues(next, reduced)];
  return [];
}

export function playCues(cues: readonly Cue[]): void {
  for (const cue of cues) playSound(cue.sound, cue.at);
}
