import { commonSounds, notes, soundPlayer, tone, type Sound } from '@card-games/card-kit/synth';

// Blackjack's sounds: the kit's card, chip and jingle sounds, the big fanfare for a blackjack, and a push.
const sounds = {
  ...commonSounds,

  blackjack: commonSounds.bigWin,

  push(c, t) {
    tone(c, t, { freq: notes.A4, dur: 0.18, gain: 0.16 });
    tone(c, t + 0.16, { freq: notes.A4, dur: 0.3, gain: 0.16 });
  },
} satisfies Record<string, Sound>;

export type SoundName = keyof typeof sounds;

export const playSound = soundPlayer(sounds);
