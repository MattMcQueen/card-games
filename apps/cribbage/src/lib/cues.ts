import { reducedMotion } from '@card-games/card-kit/motion';
import { cue, cuePlayer, dealCues, landingTime, settledCue, settleTime, type Cue as AnyCue } from '@card-games/card-kit/trickSounds';
import { DEAL_SIZE, HUMAN_SEAT, PLAYERS, handTotal, hasWon, isGameOver, type GameState } from '../engine';
import { playSound, type SoundName } from './synth';

type Cue = AnyCue<SoundName>;

/** A peg moving, `at` seconds on, if any points were pegged by the change. */
function pegCues(prev: GameState, next: GameState, at: number): Cue[] {
  const moved = next.players.some((p, i) => p.score !== prev.players[i]!.score);
  return moved ? [cue('peg', at)] : [];
}

/** The end of the hand or the game: a jingle if the hand went your way, a groan if not. */
function settleCues(prev: GameState, next: GameState, reduced: boolean): Cue[] {
  if (next.phase !== 'settled' || prev.phase === 'settled') return [];
  const yours = handTotal(next.tally[HUMAN_SEAT]!);
  const theirs = handTotal(next.tally[1 - HUMAN_SEAT]!);
  return [settledCue(isGameOver(next), hasWon(next), yours >= theirs, settleTime(reduced))];
}

/**
 * Which sounds a change of game state should make, and when. The times mirror the card animations, so each card
 * sound lands as its card does, and a peg moves once it has.
 */
export function cuesFor(prev: GameState, next: GameState, reduced = reducedMotion): Cue[] {
  if (next.hand !== prev.hand) return dealCues(reduced, DEAL_SIZE, PLAYERS);
  const landing = landingTime(reduced);
  let cues: Cue[] = [];
  if (prev.phase === 'discarding' && next.phase !== 'discarding') {
    // The crib made, and the starter turned (two for his heels, if it is a jack).
    cues = [cue('play'), cue('play', 0.25), ...pegCues(prev, next, 0.7)];
  } else if (next.pile.length > prev.pile.length) {
    cues = [cue('play', landing), ...pegCues(prev, next, landing + 0.15)];
  } else if (next.go.some((g, i) => g && !prev.go[i])) {
    cues = [cue('go'), ...pegCues(prev, next, 0.3)];
  } else if (next.shows.length > prev.shows.length) {
    // A hand laid out in the show and counted (after the pile is turned over, at the first count).
    cues = [...(prev.phase === 'collecting' ? [cue('gather')] : []), cue('play', landing), ...pegCues(prev, next, landing + 0.3)];
  } else if (prev.phase === 'collecting' && next.phase !== 'collecting') {
    cues = [cue('gather')];
  }
  return [...cues, ...settleCues(prev, next, reduced)];
}

export const playCues = cuePlayer(playSound);
