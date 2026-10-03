import { DEAL_DURATION } from './motion';
import { burst, sample, type Sound } from './synth';
import { COLLECT_DURATION, dealDelay } from './trickMotion';

// The sounds of a trick-taking game (Hearts, Spades), and when they play: each game adds its own.

/** A card put down on the trick, and the four cards of a trick swept together. */
export const trickSounds = {
  // The deal recording, a little softer.
  play(c, t) {
    if (sample(c, t, 'deal', 0.7)) return;
    burst(c, t, { dur: 0.09, from: 1600, to: 4200, q: 0.9, gain: 0.35 });
  },

  // A soft slide.
  gather(c, t) {
    if (sample(c, t, 'deal', 0.4)) return;
    burst(c, t, { dur: 0.16, from: 1800, to: 900, q: 0.8, gain: 0.25 });
  },
} satisfies Record<string, Sound>;

/** A sound, and when it starts: seconds after the change of the game that makes it. */
export interface Cue<Name extends string> {
  readonly sound: Name;
  readonly at: number;
}

export const cue = <Name extends string>(sound: Name, at = 0): Cue<Name> => ({ sound, at });

/** When a card played lands on the trick, in seconds. */
export const landingTime = (reduced: boolean): number => (reduced ? 0 : (DEAL_DURATION * 0.55) / 1000);

/** When a hand's result can be heard, once its last trick has been taken. */
export const settleTime = (reduced: boolean): number => (reduced ? 0.2 : COLLECT_DURATION / 1000 + 0.2);

/** A new hand: the shuffle, then a card sound for each round of the deal. */
export function dealCues(reduced: boolean): Cue<'shuffle' | 'deal'>[] {
  const rounds = Array.from({ length: 13 }, (_, round) => cue('deal' as const, reduced ? round * 0.05 : 0.9 + dealDelay(0, round) / 1000));
  return [cue('shuffle'), ...rounds];
}

/** A card played to the trick, and a chime if it is the first of the suit that must be `broken` (hearts or spades). */
export function playedCues(broken: boolean, reduced: boolean): Cue<'play' | 'broken'>[] {
  const landing = landingTime(reduced);
  return broken ? [cue('play', landing), cue('broken', landing + 0.15)] : [cue('play', landing)];
}

/** Plays cues with a game's sound player. */
export function cuePlayer<Name extends string>(playSound: (name: Name, at: number) => void) {
  return (cues: readonly Cue<Name>[]): void => {
    for (const { sound, at } of cues) playSound(sound, at);
  };
}
