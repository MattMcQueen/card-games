// Turns some of Kenney's CC0 "Casino Audio" recordings into small MP3 files for the game.
//
//   node scripts/build-sounds.mjs <folder holding the unzipped pack (it contains Audio/*.ogg)>
//
// The pack is https://kenney.nl/assets/casino-audio (Creative Commons Zero: no credit needed,
// though we give it). OGG is not played by every iPhone, so each clip is converted to a mono MP3.
// Output goes to src/lib/sounds/, named <sound>-<number>.mp3; the game picks one at random each time.
import { OggVorbisDecoder } from '@wasm-audio-decoders/ogg-vorbis';
import { Mp3Encoder } from '@breezystack/lamejs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/build-sounds.mjs <folder holding the unzipped pack>');
  process.exit(1);
}

// game sound -> Kenney clips used for it
const groups = {
  deal: ['card-slide-1', 'card-slide-2', 'card-slide-3', 'card-slide-4', 'card-slide-5', 'card-slide-6', 'card-slide-7', 'card-slide-8'],
  shuffle: ['card-shuffle'],
  chip: ['chip-lay-1', 'chip-lay-2', 'chip-lay-3'],
  payout: ['chips-stack-1', 'chips-stack-2', 'chips-stack-3', 'chips-stack-4', 'chips-stack-5', 'chips-stack-6'],
  sweep: ['chips-handle-1', 'chips-handle-2', 'chips-handle-5'],
};

const out = new URL('../src/lib/sounds/', import.meta.url);
await mkdir(out, { recursive: true });

const decoder = new OggVorbisDecoder();
await decoder.ready;

/** Stereo floats in [-1, 1] -> mono 16-bit samples. */
function toMono16(channels) {
  const length = channels[0].length;
  const mono = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (const channel of channels) sum += channel[i];
    const value = Math.max(-1, Math.min(1, sum / channels.length));
    mono[i] = Math.round(value * 32767);
  }
  return mono;
}

let total = 0;
let files = 0;
for (const [group, clips] of Object.entries(groups)) {
  for (const [index, clip] of clips.entries()) {
    const ogg = await readFile(join(source, 'Audio', `${clip}.ogg`));
    const { channelData, sampleRate } = await decoder.decodeFile(new Uint8Array(ogg));
    await decoder.reset();

    const encoder = new Mp3Encoder(1, sampleRate, 96);
    const samples = toMono16(channelData);
    const parts = [];
    for (let i = 0; i < samples.length; i += 1152) {
      const chunk = encoder.encodeBuffer(samples.subarray(i, i + 1152));
      if (chunk.length) parts.push(Buffer.from(chunk));
    }
    parts.push(Buffer.from(encoder.flush()));
    const mp3 = Buffer.concat(parts);

    await writeFile(new URL(`${group}-${index + 1}.mp3`, out), mp3);
    total += mp3.length;
    files++;
  }
}
console.log(`Wrote ${files} sounds, ${(total / 1024).toFixed(0)} KB in total`);
