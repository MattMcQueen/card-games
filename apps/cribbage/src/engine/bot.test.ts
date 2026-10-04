import { mulberry32 } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { chooseDiscard, cribValue, decide } from './bot';
import { cardKey, isGameOver, nextHand, sayGo, mustGo, playCard, type GameState } from './index';
import { autoplay, cards, discardAll, playAll, seededGame, withHands } from './testing';

/** Never careless: the computer player's considered choice. */
const thoughtful = () => 0.99;
const keys = (list: readonly { rank: string; suit: string }[]) => list.map((c) => c.rank + c.suit).sort();

describe('discarding', () => {
  it('keeps the cards that score together', () => {
    const g = withHands(seededGame(), { 1: '5C 5D 5H JS 9C 2D' });
    expect(keys(chooseDiscard(g, 1, thoughtful))).toEqual(['2D', '9C']);
  });

  it('values fives and pairs in a crib more than cards that go nowhere', () => {
    expect(cribValue(cards('5H 10C'))).toBeGreaterThan(cribValue(cards('2C 9D')));
    expect(cribValue(cards('7H 7C'))).toBeGreaterThan(cribValue(cards('KC 2D')));
  });

  it('throws better cards into its own crib than into yours', () => {
    let own = 0;
    let yours = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) {
      const g = seededGame(seed);
      own += cribValue(chooseDiscard({ ...g, dealer: 1 }, 1, thoughtful));
      yours += cribValue(chooseDiscard({ ...g, dealer: 0 }, 1, thoughtful));
    }
    expect(own).toBeGreaterThan(yours + 10);
  });
});

describe('the play', () => {
  /** A hand Ruth does not deal, with her four cards set and you to play second. */
  const ruthLeads = (ruth: string): GameState =>
    discardAll(withHands(seededGame(), { 0: '2S 3S 4S 6S AC 2C', 1: `${ruth} 3D 3H` }, '8C', 0), { 0: 'AC 2C', 1: '3D 3H' });

  it('makes fifteen and thirty-one when it can', () => {
    const youLead = discardAll(withHands(seededGame(), { 0: '10S 3S 4S 6S AC 2C', 1: '5D 9S 7H KC 3D 3H' }, '8C', 1), { 0: 'AC 2C', 1: '3D 3H' });
    expect(cardKey(decide(playAll(youLead, '10S'), thoughtful))).toBe('5D');
    const thirty = discardAll(withHands(seededGame(), { 0: '10S 10C AS 6S AC 2C', 1: 'KD 9S 7H 2D 3D 3H' }, '8C', 1), { 0: 'AC 2C', 1: '3D 3H' });
    // 10, K, 10 makes 30... and a 1 would make 31, but Ruth holds no ace: she must go.
    expect(mustGo(playAll(thirty, '10S KD 10C'))).toBe(true);
  });

  it('pairs your card when it can', () => {
    const youLead = discardAll(withHands(seededGame(), { 0: '9S 3S 4S 6S AC 2C', 1: '9D QS 7H 2D 3D 3H' }, '8C', 1), { 0: 'AC 2C', 1: '3D 3H' });
    expect(cardKey(decide(playAll(youLead, '9S'), thoughtful))).toBe('9D');
  });

  it('leads a low card rather than a five or a ten', () => {
    expect(cardKey(decide(ruthLeads('5H 4C 10S KD'), thoughtful))).toBe('4C');
  });

  it('only ever plays a card it may', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const random = mulberry32(seed);
      let g = discardAll(seededGame(seed), {}, random);
      // The first count of the hand, to 31 or a go: decide throws if it has no card it may play.
      while (g.phase === 'pegging') g = mustGo(g) ? sayGo(g) : playCard(g, decide(g, random));
      expect(g.phase).not.toBe('pegging');
    }
  });
});

describe('over many games', () => {
  it('scores like a fair player: hands, cribs and the play all count', () => {
    let hands = 0;
    let points = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      let g = seededGame(seed);
      for (;;) {
        g = autoplay(g, seed + g.hand);
        hands++;
        points += g.history.at(-1)!.reduce((sum, t) => sum + t.pegging + t.hand + t.crib, 0);
        if (isGameOver(g)) break;
        g = nextHand(g);
      }
    }
    // Good players average about 25 points a hand between them.
    expect(points / hands).toBeGreaterThan(18);
    expect(points / hands).toBeLessThan(32);
  });
});
