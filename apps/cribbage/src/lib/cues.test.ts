import { mulberry32, seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { collect, nextHand, sayGo, showNext, type GameState } from '../engine';
import { autoplay, discardAll, playAll, seededGame, step, withHands } from '../engine/testing';
import { cuesFor } from './cues';

const sounds = (prev: GameState, next: GameState) => cuesFor(prev, next, true).map((c) => c.sound);
const deal = (starter: string) => withHands(seededGame(), { 0: '5H 10D 2S 3S AC 2C', 1: '10C KD QH JS 4D 4H' }, starter, 1);
const ready = () => discardAll(deal('9C'), { 0: 'AC 2C', 1: '4D 4H' });

describe('cuesFor', () => {
  it('shuffles and deals six rounds for a new hand', () => {
    const done = autoplay(seededGame(1));
    const cues = sounds(done, nextHand(done, seededRandomInt(2)));
    expect(cues[0]).toBe('shuffle');
    expect(cues.filter((s) => s === 'deal')).toHaveLength(6);
  });

  it('lays the crib, and pegs for his heels', () => {
    expect(sounds(deal('9C'), ready())).toEqual(['play', 'play']);
    const heels = deal('JC');
    expect(sounds(heels, discardAll(heels, { 0: 'AC 2C', 1: '4D 4H' }))).toEqual(['play', 'play', 'peg']);
  });

  it('plays a card, and pegs when it scores', () => {
    const g = playAll(ready(), '5H');
    expect(sounds(ready(), g)).toEqual(['play']);
    expect(sounds(g, playAll(g, '10C'))).toEqual(['play', 'peg']);
  });

  it('says go, and gathers a finished count', () => {
    const g = playAll(ready(), '5H 10C 10D');
    const said = sayGo(g);
    expect(sounds(g, said)).toEqual(['go']);
    const done = playAll(said, '2S 3S');
    expect(sounds(done, collect(done))).toEqual(['gather']);
  });

  it('counts the show, and plays a jingle or groan at the end of the hand', () => {
    const random = mulberry32(4);
    let g = seededGame(4);
    while (g.phase !== 'showing') g = step(g, random);
    const dealers = showNext(g);
    const crib = showNext(dealers);
    expect(sounds(dealers, crib)[0]).toBe('play');
    expect(['win', 'lose']).toContain(sounds(dealers, crib).at(-1));
  });
});
