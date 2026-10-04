import { DEAL_DURATION } from '@card-games/card-kit/motion';
import { COLLECT_DURATION } from '@card-games/card-kit/trickMotion';
import { describe, expect, it } from 'vitest';
import { collect, nextHand, sayGo } from '../engine';
import { autoplay, discardAll, playAll, seededGame, withHands } from '../engine/testing';
import { movingTime } from './motion';

const ready = () => discardAll(withHands(seededGame(), { 0: '5H 10D 2S 3S AC 2C', 1: '10C KD QH JS 4D 4H' }, '9C', 1), { 0: 'AC 2C', 1: '4D 4H' });

describe('movingTime', () => {
  it('waits for the deal, a card laid, and a count turned over', () => {
    const done = autoplay(seededGame(1));
    expect(movingTime(done, nextHand(done), false)).toBeGreaterThan(DEAL_DURATION);
    expect(movingTime(ready(), playAll(ready(), '5H'), false)).toBe(DEAL_DURATION);
    const over = playAll(sayGo(playAll(ready(), '5H 10C 10D')), '2S 3S');
    expect(movingTime(over, collect(over), false)).toBe(COLLECT_DURATION);
  });

  it('does not wait for a "go", or for anything with motion reduced', () => {
    const g = playAll(ready(), '5H 10C 10D');
    expect(movingTime(g, sayGo(g), false)).toBe(0);
    expect(movingTime(ready(), playAll(ready(), '5H'), true)).toBe(0);
  });
});
