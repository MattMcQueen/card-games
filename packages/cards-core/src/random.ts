import type { RandomInt } from './deck';

/** A small seeded random generator (mulberry32) returning numbers in [0, 1). Fast, and repeatable for a given seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A deterministic random integer generator, so tests (and shuffles in them) are repeatable. */
export function seededRandomInt(seed: number): RandomInt {
  const next = mulberry32(seed);
  return (max) => Math.floor(next() * max);
}
