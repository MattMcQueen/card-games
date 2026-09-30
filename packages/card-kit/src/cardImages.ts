import type { Card } from '@card-games/cards-core';

// Byron Knoll's public-domain card artwork, converted by scripts/build-cards.mjs. Vite gives each
// file a fingerprinted name, so browsers keep them for a year.
const images = import.meta.glob<string>('./cards/*.webp', {
  eager: true,
  import: 'default',
  query: '?url',
});

export function cardImage(card: Card): string | undefined {
  return images[`./cards/${card.rank}${card.suit}.webp`];
}

let preloaded = false;

/**
 * Fetches all 52 card images in the background so they are ready by the time they are dealt.
 * Called on the visitor's first tap or key press, not on page load, so someone who only looks
 * at the page never downloads them.
 */
export function preloadCards(): void {
  if (preloaded) return;
  preloaded = true;
  for (const url of Object.values(images)) {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
  }
}
