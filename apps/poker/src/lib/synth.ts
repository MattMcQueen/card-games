import { burst, commonSounds, sample, soundPlayer, tone, type Sound } from '@card-games/card-kit/synth';

// Poker's sounds: the kit's card, chip and jingle sounds, plus a fold and a check.
const sounds = {
  ...commonSounds,

  // Cards pushed face down into the muck: a short, soft slide.
  fold(c, t) {
    if (sample(c, t, 'deal', 0.45)) return;
    burst(c, t, { dur: 0.1, from: 1800, to: 3200, q: 0.9, gain: 0.25 });
  },

  // Knuckles on the felt: two dull knocks.
  check(c, t) {
    [0, 0.11].forEach((offset) => {
      tone(c, t + offset, { freq: 190, endFreq: 90, dur: 0.07, gain: 0.32 });
      burst(c, t + offset, { dur: 0.03, from: 900, to: 500, q: 1, gain: 0.2 });
    });
  },
} satisfies Record<string, Sound>;

export type SoundName = keyof typeof sounds;

export const playSound = soundPlayer(sounds);
