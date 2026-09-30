import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { act, nextHand } from '../engine';
import { gameWithButton, play } from '../engine/testing';
import { animationTime, boardDelay, boardTime, dealTime, holeDelay, revealDelay, thinkTime } from './motion';

const start = () => gameWithButton(0);

describe('board timing', () => {
  it('lands the cards of the flop together, and each later street a beat after', () => {
    expect([0, 1, 2].map((i) => boardDelay(i, 0))).toEqual([0, 260, 520]);
    expect([boardDelay(3, 0), boardDelay(4, 0)]).toEqual([1100, 2200]);
  });

  it('counts a single new card from when it is dealt', () => {
    expect(boardDelay(3, 3)).toBe(0);
    expect(boardDelay(4, 3)).toBe(1100);
  });

  it('takes no time when there is nothing new, and longer for more', () => {
    expect(boardTime(5, 5)).toBe(0);
    expect(boardTime(3, 4)).toBeGreaterThan(0);
    expect(boardTime(0, 5)).toBeGreaterThan(boardTime(0, 3));
    expect(revealDelay(3, 5, true)).toBeGreaterThan(revealDelay(3, 5, false));
  });
});

describe('deal timing', () => {
  it('deals one card round the table and then another', () => {
    expect(holeDelay(0, 0)).toBe(0);
    expect(holeDelay(1, 0)).toBeGreaterThan(holeDelay(0, 0));
    expect(holeDelay(0, 1)).toBeGreaterThan(holeDelay(5, 0));
    expect(dealTime()).toBeGreaterThan(holeDelay(5, 1));
  });
});

describe('animationTime', () => {
  it('is the deal for a new hand, the new board cards after a street, and nothing for a bet', () => {
    const g = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(animationTime(g, nextHand(g, seededRandomInt(3)))).toBe(dealTime());
    const flop = start();
    const before = play(flop, 'call', 'call', 'call', 'call', 'call');
    expect(animationTime(before, act(before, { type: 'check' }))).toBe(boardTime(0, 3));
    expect(animationTime(flop, act(flop, { type: 'call' }))).toBe(0);
  });
});

describe('thinkTime', () => {
  it('gives you a beat to follow while you are in the hand, and hurries once you have folded', () => {
    expect(thinkTime(true, 0, 0)).toBe(650);
    expect(thinkTime(true, 0, 1)).toBe(1300);
    expect(thinkTime(false, 0, 0.5)).toBe(200);
  });

  it('waits for cards that are still landing', () => {
    expect(thinkTime(true, 500, 0)).toBe(1150);
    expect(thinkTime(true, -300, 0)).toBe(650);
  });
});
