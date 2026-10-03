import { commonSounds, notes, soundPlayer, tone, type Sound } from '@card-games/card-kit/synth';
import { trickSounds } from '@card-games/card-kit/trickSounds';

// Bridge's sounds: the kit's card sounds and jingles, a card played to a trick and a trick being
// gathered up, plus a call in the auction and a sharper one for a double.
const sounds = {
  ...commonSounds,
  ...trickSounds,

  // A call said aloud: a soft tap on the table.
  bid(c, t) {
    tone(c, t, { freq: notes.G4, dur: 0.12, gain: 0.08, type: 'triangle' });
  },

  // A double or redouble: two quick, higher taps.
  double(c, t) {
    tone(c, t, { freq: notes.C5, dur: 0.1, gain: 0.1, type: 'triangle' });
    tone(c, t + 0.1, { freq: notes.E5, dur: 0.14, gain: 0.1, type: 'triangle' });
  },
} satisfies Record<string, Sound>;

export type SoundName = keyof typeof sounds;

export const playSound = soundPlayer(sounds);
