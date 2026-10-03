import { burst, commonSounds, notes, sample, soundPlayer, tone, type Sound } from '@card-games/card-kit/synth';

// Hearts's sounds: the kit's card sounds and jingles, plus a card played to a trick, a trick being
// gathered up, and a chime when hearts are broken.
const sounds = {
  ...commonSounds,

  // A card put down on the trick: the deal recording, a little softer.
  play(c, t) {
    if (sample(c, t, 'deal', 0.7)) return;
    burst(c, t, { dur: 0.09, from: 1600, to: 4200, q: 0.9, gain: 0.35 });
  },

  // The four cards of a trick swept together into a pile: a soft slide.
  gather(c, t) {
    if (sample(c, t, 'deal', 0.4)) return;
    burst(c, t, { dur: 0.16, from: 1800, to: 900, q: 0.8, gain: 0.25 });
  },

  // Hearts are broken: two soft falling notes.
  broken(c, t) {
    tone(c, t, { freq: notes.E5, dur: 0.25, gain: 0.12, type: 'triangle' });
    tone(c, t + 0.12, { freq: notes.C5, dur: 0.4, gain: 0.12, type: 'triangle' });
  },
} satisfies Record<string, Sound>;

export type SoundName = keyof typeof sounds;

export const playSound = soundPlayer(sounds);
