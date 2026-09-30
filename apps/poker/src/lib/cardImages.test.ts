import { describe, expect, it } from 'vitest';
import { RANKS, SUITS } from '../engine';
import { cardImage } from './cardImages';

describe('cardImage', () => {
  it('has artwork for all 52 cards, each a different file', () => {
    const urls = new Set<string>();
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const url = cardImage({ rank, suit });
        expect(url, `${rank}${suit}`).toBeTruthy();
        urls.add(url as string);
      }
    }
    expect(urls.size).toBe(52);
  });
});
