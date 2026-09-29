import { describe, expect, it } from 'vitest';
import { DECKS, MAX_BET, MAX_HANDS, MIN_BET, RESHUFFLE_AT, STARTING_CHIPS } from './constants';

describe('table rules', () => {
  it('match the agreed rule sheet', () => {
    expect(DECKS).toBe(6);
    expect(STARTING_CHIPS).toBe(100);
    expect([MIN_BET, MAX_BET]).toEqual([1, 20]);
    expect(RESHUFFLE_AT).toBe(52);
    expect(MAX_HANDS).toBe(4);
  });
});
