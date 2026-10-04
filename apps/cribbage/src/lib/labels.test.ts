import { describe, expect, it } from 'vitest';
import { collect, sayGo, showNext, type GameState } from '../engine';
import { cards, discardAll, playAll, seededGame, withHands } from '../engine/testing';
import { announcementFor, countCalls, countText, cutText, gameOverText, nextCountText, pegText, scoredText, short, statusText, turnText } from './labels';
import { bannerFor } from './verdict';

/** A hand Ruth deals, so you play first: you keep 10C 10D 5H 4S, Ruth KC 9D 8H 7S, the starter is the 6 of clubs. */
const goHand = (): GameState =>
  discardAll(withHands(seededGame(), { 0: '10C 10D 5H 4S AC 2C', 1: 'KC 9D 8H 7S 3D 3H' }, '6C', 1), { 0: 'AC 2C', 1: '3D 3H' });

const withScores = (g: GameState, yours: number, theirs: number): GameState => ({
  ...g,
  players: g.players.map((p) => ({ ...p, score: p.id === 0 ? yours : theirs })),
});

describe('labels', () => {
  it('writes cards short, with their suits', () => {
    expect(cards('7H 10S AC QD').map(short)).toEqual(['7♥', '10♠', 'A♣', 'Q♦']);
  });

  it('says how the first deal was cut, in the first hand only', () => {
    const g = seededGame(1);
    expect(cutText(g)).toMatch(/^You cut the .+ and Ruth the .+, so (you deal|Ruth deals)\.$/);
    expect(cutText({ ...g, hand: 2 })).toBe('');
  });

  it('calls what was pegged in the play', () => {
    expect(pegText({ kind: 'pair', points: 6, size: 3 })).toBe('three of a kind for 6');
    expect(pegText({ kind: 'run', points: 4, size: 4 })).toBe('a run of 4 for 4');
    expect(pegText({ kind: 'heels', points: 2 })).toBe('two for his heels');
    const g = playAll(discardAll(withHands(seededGame(), { 0: '5H 10D 2S 3S AC 2C', 1: '10C KD QH JS 4D 4H' }, '9C', 1), { 0: 'AC 2C', 1: '4D 4H' }), '5H 10C');
    expect(scoredText(g)).toBe('Ruth: fifteen for 2');
  });

  it('tells you what you may play, and when you must say go', () => {
    const g = goHand();
    expect(turnText(g)).toBe('Your lead: play any card.');
    expect(turnText(playAll(g, '10C KC'))).toBe('The count is 20: your turn.');
    expect(turnText({ ...playAll(g, '10C KC 10D'), toPlay: 0, players: g.players.map((p) => (p.id === 0 ? { ...p, hand: cards('5H') } : p)) })).toBe(
      'The count is 30: you cannot play without going over 31, so say go.',
    );
    expect(statusText(playAll(g, '10C'))).toBe('Ruth is choosing a card…');
  });

  it('calls a count the way players say it', () => {
    let g = playAll(collect(sayGo(playAll(goHand(), '10C KC 10D'))), '9D 4S 8H 5H');
    g = collect(playAll(collect(sayGo(g)), '7S'));
    const yours = g.shows[0]!;
    expect(countCalls(yours).map((c) => c.text)).toEqual(['fifteen 2', 'fifteen 4', 'fifteen 6', 'a pair is 8', 'a run of 3 is 11']);
    expect(countText(g, yours)).toBe('Your hand with the six of clubs: fifteen 2, fifteen 4, fifteen 6, a pair is 8 and a run of 3 is 11.');
    expect(nextCountText(g)).toBe("Count Ruth's hand");
    expect(nextCountText(showNext(g))).toBe("Count Ruth's crib");
  });

  it('says nineteen for a hand with nothing in it', () => {
    const g = { ...goHand(), starter: cards('QH')[0]! };
    expect(countText(g, { seat: 0, crib: false, cards: cards('2C 4D 6H 10S'), count: { combos: [], total: 0 } })).toMatch(/nineteen/);
  });

  it('announces the end of the game, and skunks', () => {
    const g = goHand();
    expect(gameOverText(withScores(g, 121, 100))).toBe('You win the game!');
    expect(gameOverText(withScores(g, 121, 80))).toBe('You win the game, and skunked Ruth!');
    expect(gameOverText(withScores(g, 90, 121))).toBe('Ruth wins the game: you were skunked.');
    expect(gameOverText(withScores(g, 60, 70))).toBe('');
    expect(bannerFor(withScores(g, 121, 100))).toMatchObject({ tone: 'win', sub: 'The final score is 121 to 100' });
    expect(bannerFor(g)).toBeNull();
  });

  it('tells screen readers what happens', () => {
    expect(announcementFor(seededGame(1))).toMatch(/Choose 2 cards for (your|Ruth's) crib\.$/);
    expect(announcementFor(playAll(goHand(), '10C'))).toBe('You play the ten of clubs for 10.');
    expect(announcementFor(playAll(goHand(), '10C KC'))).toBe('Ruth plays the king of clubs for 20. The count is 20: your turn.');
  });
});
