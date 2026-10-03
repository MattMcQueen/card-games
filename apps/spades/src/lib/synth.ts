import { commonSounds, notes, soundPlayer, tone, type Sound } from '@card-games/card-kit/synth';
import { trickSounds } from '@card-games/card-kit/trickSounds';

// Spades's sounds: the kit's card sounds and jingles, a card played to a trick and a trick being
// gathered up, plus a bid and a chime when spades are broken.
const sounds = {
  ...commonSounds,
  ...trickSounds,

  // A bid said aloud: a soft tap on the table.
  bid(c, t) {
    tone(c, t, { freq: notes.G4, dur: 0.12, gain: 0.08, type: 'triangle' });
  },

  // Spades are broken: two low notes.
  broken(c, t) {
    tone(c, t, { freq: notes.C5, dur: 0.25, gain: 0.12, type: 'triangle' });
    tone(c, t + 0.12, { freq: notes.G4, dur: 0.4, gain: 0.12, type: 'triangle' });
  },
} satisfies Record<string, Sound>;

export type SoundName = keyof typeof sounds;

export const playSound = soundPlayer(sounds);
