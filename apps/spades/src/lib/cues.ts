import { reducedMotion } from '@card-games/card-kit/motion';
import { cue, cuePlayer, dealCues, playedCues, settledCue, settleTime, type Cue as AnyCue } from '@card-games/card-kit/trickSounds';
import { hasWon, isGameOver, type GameState } from '../engine';
import { playSound, type SoundName } from './synth';
import { bannerFor } from './verdict';

type Cue = AnyCue<SoundName>;

/** The end of the hand: a jingle if it went well for you, a groan if not, and whether the game is over. */
function settleCues(next: GameState, reduced: boolean): Cue[] {
  if (next.phase !== 'settled') return [];
  return [settledCue(isGameOver(next), hasWon(next), bannerFor(next)?.tone === 'win', settleTime(reduced))];
}

/**
 * Which sounds a change of game state should make, and when. The times mirror the card animations,
 * so each card sound lands as its card does.
 */
export function cuesFor(prev: GameState, next: GameState, reduced = reducedMotion): Cue[] {
  if (next.hand !== prev.hand) return dealCues(reduced);
  if (next.players.some((p, i) => p.bid !== prev.players[i]?.bid)) return [cue('bid')];
  // A card played to the trick, and a chime if it is the first spade.
  if (next.trick.length > prev.trick.length) return playedCues(next.spadesBroken && !prev.spadesBroken, reduced);
  if (prev.phase === 'collecting' && next.phase !== 'collecting') return [cue('gather'), ...settleCues(next, reduced)];
  return [];
}

export const playCues = cuePlayer(playSound);
