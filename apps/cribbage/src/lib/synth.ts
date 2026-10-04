import { commonSounds, notes, soundPlayer, tone, type Sound } from '@card-games/card-kit/synth';
import { trickSounds } from '@card-games/card-kit/trickSounds';

// Cribbage's sounds: the kit's card sounds and jingles, a card laid on the pile and the pile turned over, plus a peg
// moving on the board and a "go".
const sounds = {
  ...commonSounds,
  ...trickSounds,

  // A peg pushed into the board: two quick wooden taps.
  peg(c, t) {
    tone(c, t, { freq: 880, endFreq: 520, dur: 0.05, gain: 0.16, type: 'triangle' });
    tone(c, t + 0.07, { freq: 1180, endFreq: 700, dur: 0.05, gain: 0.12, type: 'triangle' });
  },

  // "Go": a soft low note.
  go(c, t) {
    tone(c, t, { freq: notes.D4, dur: 0.18, gain: 0.1, type: 'triangle' });
  },
} satisfies Record<string, Sound>;

export type SoundName = keyof typeof sounds;

export const playSound = soundPlayer(sounds);
