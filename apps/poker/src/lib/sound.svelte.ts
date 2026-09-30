import type { Cue } from './cues';
import { ensureAudio, playSound, setSilenced } from './synth';

/** Sound starts on. The choice is not stored: a refresh turns it back on. */
export const audio = $state({ muted: false });

export function setMuted(value: boolean): void {
  audio.muted = value;
  setSilenced(value);
}

/** Wakes the audio engine. Browsers only allow this from a tap or key press. */
export function unlockAudio(): void {
  ensureAudio();
}

export function playCues(cues: readonly Cue[]): void {
  for (const cue of cues) playSound(cue.sound, cue.at);
}
