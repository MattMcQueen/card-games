import { reducedMotion } from '@card-games/card-kit/motion';
import { cue, cuePlayer, dealCues, landingTime, settledCue, settleTime, type Cue as AnyCue } from '@card-games/card-kit/trickSounds';
import { hasWon, isGameOver, type GameState } from '../engine';
import { playSound, type SoundName } from './synth';
import { bannerFor } from './verdict';

type Cue = AnyCue<SoundName>;

/** The end of the hand: a jingle if it went well for you, a groan if not, and whether the rubber is over. */
function settleCues(next: GameState, after: number): Cue[] {
  if (next.phase !== 'settled' || !next.result?.contract) return [];
  return [settledCue(isGameOver(next), hasWon(next), bannerFor(next)?.tone === 'win', after)];
}

/**
 * Which sounds a change of game state should make, and when. The times mirror the card animations,
 * so each card sound lands as its card does.
 */
export function cuesFor(prev: GameState, next: GameState, reduced = reducedMotion): Cue[] {
  if (next.hand !== prev.hand) return dealCues(reduced);
  const call = next.auction.length > prev.auction.length ? next.auction.at(-1)!.call : null;
  if (call) return [cue(call.kind === 'double' || call.kind === 'redouble' ? 'double' : 'bid')];
  if (next.trick.length > prev.trick.length) return [cue('play', landingTime(reduced))];
  if (prev.phase === 'collecting' && next.phase !== 'collecting') return [cue('gather'), ...settleCues(next, settleTime(reduced))];
  return [];
}

export const playCues = cuePlayer(playSound);
