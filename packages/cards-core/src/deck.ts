import { RANKS, SUITS, type Card } from './cards';

/** Returns a uniformly distributed integer in [0, max). */
export type RandomInt = (max: number) => number;

/** Unbiased random integer from the browser's cryptographic generator. */
export const secureRandomInt: RandomInt = (max) => {
  if (!Number.isInteger(max) || max < 1 || max > 0x100000000) {
    throw new RangeError(`max must be an integer between 1 and 2^32, got ${max}`);
  }
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while ((buffer[0] as number) >= limit);
  return (buffer[0] as number) % max;
};

/** An ordered (unshuffled) deck, or a shoe of several 52-card decks one after another. */
export function createDeck(decks = 1): Card[] {
  const deck = SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
  return Array.from({ length: decks }, () => deck).flat();
}

/** Fisher-Yates shuffle; returns a new array and leaves the input untouched. */
export function shuffle<T>(items: readonly T[], randomInt: RandomInt = secureRandomInt): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}
