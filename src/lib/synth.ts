// Every sound in the game is generated here with the Web Audio API: no audio files to
// download, license or cache. Each sound is a function taking the time (in audio-clock
// seconds) at which it should start.

export type SoundName =
  | 'deal'
  | 'shuffle'
  | 'chip'
  | 'payout'
  | 'sweep'
  | 'win'
  | 'blackjack'
  | 'lose'
  | 'push'
  | 'gameOver';

const MASTER_LEVEL = 0.7;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let silenced = false;

/** Creates the audio engine on first use. Must be called from a tap or key press on iOS. */
export function ensureAudio(): AudioContext | null {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();

    const limiter = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = silenced ? 0 : MASTER_LEVEL;
    master.connect(limiter);
    limiter.connect(ctx.destination);

    // One second of white noise, reused by every whoosh, snap and shuffle.
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSilenced(value: boolean): void {
  silenced = value;
  if (master && ctx) master.gain.setTargetAtTime(value ? 0 : MASTER_LEVEL, ctx.currentTime, 0.02);
}

interface BurstOptions {
  dur: number;
  from: number;
  to: number;
  q: number;
  gain: number;
  type?: BiquadFilterType;
}

/** A short burst of filtered noise: the basis of card snaps, whooshes and clicks. */
function burst(c: AudioContext, t: number, { dur, from, to, q, gain, type = 'bandpass' }: BurstOptions) {
  const source = c.createBufferSource();
  source.buffer = noise;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.006, dur / 3));
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  source.connect(filter).connect(env).connect(master as GainNode);
  source.start(t, Math.random() * 0.5);
  source.stop(t + dur + 0.03);
}

interface ToneOptions {
  freq: number;
  dur: number;
  gain: number;
  type?: OscillatorType;
  endFreq?: number;
}

function tone(c: AudioContext, t: number, { freq, dur, gain, type = 'sine', endFreq }: ToneOptions) {
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(master as GainNode);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

/** A ceramic chip clink: a few bright, quickly fading partials plus a tiny click. */
function clink(c: AudioContext, t: number, pitch = 1, level = 1) {
  tone(c, t, { freq: 2300 * pitch, dur: 0.09, gain: 0.16 * level });
  tone(c, t, { freq: 3350 * pitch, dur: 0.07, gain: 0.12 * level });
  tone(c, t, { freq: 5200 * pitch, dur: 0.05, gain: 0.08 * level });
  burst(c, t, { dur: 0.02, from: 6500, to: 5000, q: 1, gain: 0.22 * level });
}

const notes = { Bb3: 233.08, D4: 293.66, Eb4: 311.13, F4: 349.23, G4: 392, C4: 261.63, A4: 440, C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, E6: 1318.5 };

const sounds: Record<SoundName, (c: AudioContext, t: number) => void> = {
  // A card sliding off the shoe and landing on the felt.
  deal(c, t) {
    burst(c, t, { dur: 0.12, from: 1400, to: 5200, q: 0.9, gain: 0.5 });
    tone(c, t + 0.05, { freq: 170, endFreq: 70, dur: 0.06, gain: 0.25 });
    burst(c, t + 0.075, { dur: 0.03, from: 6000, to: 4000, q: 1.2, gain: 0.18 });
  },

  // A riffle shuffle: a run of rapid card flicks, then a second, softer one.
  shuffle(c, t) {
    for (let i = 0; i < 30; i++) {
      const at = t + i * 0.03 + Math.random() * 0.012;
      burst(c, at, { dur: 0.045, from: 2500, to: 4500, q: 1.1, gain: 0.1 + 0.08 * Math.sin((i / 29) * Math.PI) });
    }
    burst(c, t + 0.95, { dur: 0.16, from: 1200, to: 4200, q: 0.8, gain: 0.35 });
    tone(c, t + 1.0, { freq: 150, endFreq: 70, dur: 0.08, gain: 0.25 });
  },

  chip(c, t) {
    clink(c, t);
  },

  // Winnings pushed across: a quick cascade of clinks.
  payout(c, t) {
    [0, 0.07, 0.13, 0.22].forEach((offset, i) => clink(c, t + offset, 0.9 + i * 0.07, 0.85));
  },

  // Losing chips raked away: a low sweep and one muted clink.
  sweep(c, t) {
    burst(c, t, { dur: 0.35, from: 900, to: 300, q: 0.7, gain: 0.3 });
    clink(c, t + 0.2, 0.75, 0.6);
  },

  win(c, t) {
    [notes.C5, notes.E5, notes.G5].forEach((freq, i) => {
      tone(c, t + i * 0.11, { freq, dur: 0.35, gain: 0.2, type: 'triangle' });
    });
    tone(c, t + 0.33, { freq: notes.C6, dur: 0.5, gain: 0.14, type: 'sine' });
  },

  blackjack(c, t) {
    [notes.C5, notes.E5, notes.G5, notes.C6, notes.E6].forEach((freq, i) => {
      tone(c, t + i * 0.09, { freq, dur: 0.5, gain: 0.18, type: 'triangle' });
    });
    [notes.C5, notes.E5, notes.G5, notes.C6].forEach((freq) => {
      tone(c, t + 0.45, { freq, dur: 0.9, gain: 0.1, type: 'sine' });
    });
    [0.5, 0.58, 0.66].forEach((offset) => burst(c, t + offset, { dur: 0.06, from: 9000, to: 7000, q: 2, gain: 0.08 }));
  },

  lose(c, t) {
    tone(c, t, { freq: notes.Eb4, dur: 0.3, gain: 0.24, type: 'triangle' });
    tone(c, t + 0.22, { freq: notes.Bb3, dur: 0.55, gain: 0.24, type: 'triangle' });
  },

  push(c, t) {
    tone(c, t, { freq: notes.A4, dur: 0.18, gain: 0.16 });
    tone(c, t + 0.16, { freq: notes.A4, dur: 0.3, gain: 0.16 });
  },

  gameOver(c, t) {
    [notes.G4, notes.F4, notes.Eb4, notes.C4].forEach((freq, i) => {
      tone(c, t + i * 0.24, { freq, dur: i === 3 ? 1 : 0.5, gain: 0.22, type: 'triangle' });
    });
  },
};

export function playSound(name: SoundName, at = 0): void {
  const c = ensureAudio();
  if (!c || silenced) return;
  sounds[name](c, c.currentTime + 0.03 + at);
}
