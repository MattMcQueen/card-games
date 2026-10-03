import { describe, expect, it } from 'vitest';
import { cardName, playedText } from './names';

describe('names', () => {
  it('names cards in words', () => {
    expect(cardName({ rank: 'Q', suit: 'S' })).toBe('Queen of spades');
    expect(cardName({ rank: '10', suit: 'H' })).toBe('Ten of hearts');
  });

  it('says who played a card', () => {
    expect(playedText({ human: true, name: 'You' }, { rank: '2', suit: 'C' })).toBe('You play the two of clubs. ');
    expect(playedText({ human: false, name: 'Grace' }, { rank: 'A', suit: 'S' })).toBe('Grace plays the ace of spades. ');
  });
});
