// Turns Byron Knoll's public-domain vector playing cards into small WebP images.
//
//   node scripts/build-cards.mjs <folder with the downloaded SVGs>
//
// The SVGs come from https://commons.wikimedia.org/wiki/Category:Playing_cards_set_by_Byron_Knoll
// (all public domain). Save these 52 files, with spaces in the names replaced by underscores:
//   "2 of clubs.svg" ... "10 of spades.svg", "Ace of <suit>.svg", and the detailed courts
//   "Jack of <suit>2.svg", "Queen of <suit>2.svg", "King of <suit>2.svg".
// The output goes to src/lib/cards/, named by rank and suit: AS.webp, 10H.webp, KC.webp ...
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/build-cards.mjs <folder with the downloaded SVGs>');
  process.exit(1);
}

const out = new URL('../src/lib/cards/', import.meta.url);
await mkdir(out, { recursive: true });

const suits = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
const words = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };
const WIDTH = 300; // about 3x the largest size the card is shown at, so it stays sharp on phones

let total = 0;
for (const [code, suit] of Object.entries(suits)) {
  for (const rank of ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']) {
    const court = 'JQK'.includes(rank);
    const name = `${words[rank] ?? rank}_of_${suit}${court ? '2' : ''}.svg`;
    const svg = await readFile(join(source, name));
    const file = new URL(`${rank}${code}.webp`, out);
    const image = await sharp(svg, { density: 300 }).resize({ width: WIDTH }).webp({ quality: 82 }).toBuffer();
    await writeFile(file, image);
    total += image.length;
  }
}
console.log(`Wrote 52 cards, ${(total / 1024).toFixed(0)} KB in total`);
await stat(new URL('AS.webp', out)); // fail loudly if nothing was written
