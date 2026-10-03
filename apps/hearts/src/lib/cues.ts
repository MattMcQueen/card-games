import { reducedMotion } from '@card-games/card-kit/motion';
import { cue, cuePlayer, dealCues, landingTime, playedCues, settleTime, type Cue as AnyCue } from '@card-games/card-kit/trickSounds';
import { HUMAN_SEAT, hasWon, isGameOver, isQueenOfSpades, type GameState } from '../engine';
import { playSound, type SoundName } from './synth';

type Cue = AnyCue<SoundName>;

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

/** Taking the queen of spades yourself stings, unless it completes your shooting the moon. */
function queenSting(prev: GameState, next: GameState): Cue[] {
  const yours = prev.winner === HUMAN_SEAT && prev.trick.some((p) => isQueenOfSpades(p.card));
  return yours && next.result?.moon !== HUMAN_SEAT ? [cue('lose', 0.1)] : [];
}

/** The end of the hand: how it went for you, and whether the game is over. */
function settleCues(next: GameState, reduced: boolean): Cue[] {
  if (next.phase !== 'settled') return [];
  const after = settleTime(reduced);
  const hand = handSounds(next).map((sound) => cue(sound, after));
  if (!isGameOver(next)) return hand;
  return [...hand, cue(hasWon(next) ? 'bigWin' : 'gameOver', after + 0.8)];
}

/**
 * Which sounds a change of game state should make, and when. The times mirror the card animations,
 * so each card sound lands as its card does.
 */
export function cuesFor(prev: GameState, next: GameState, reduced = reducedMotion): Cue[] {
  const landing = landingTime(reduced);
  if (next.hand !== prev.hand) return dealCues(reduced);
  // The cards passed to you land in your hand.
  if (prev.phase === 'passing' && next.phase !== 'passing') return next.players[HUMAN_SEAT]!.received.map((_, i) => cue('deal', landing + i * 0.08));
  // A card played to the trick, and a chime if it is the first heart.
  if (next.trick.length > prev.trick.length) return playedCues(next.heartsBroken && !prev.heartsBroken, reduced);
  if (prev.phase === 'collecting' && next.phase !== 'collecting') return [cue('gather'), ...queenSting(prev, next), ...settleCues(next, reduced)];
  return [];
}

export const playCues = cuePlayer(playSound);
