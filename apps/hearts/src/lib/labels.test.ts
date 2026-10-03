import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { nextHand, playCard, type GameState } from '../engine';
import { autoplay, cards, playAll, seededGame, withHands } from '../engine/testing';
import { announcementFor, directionLabel, gameOverText, passText, statusText, trickText, turnText } from './labels';
import { bannerFor } from './verdict';

/** Hand number `hand` of a seeded game, the earlier ones played out. */
function handNumber(hand: number): GameState {
  let g = seededGame(3);
  for (let h = 1; h < hand; h++) g = nextHand(autoplay(g, h), seededRandomInt(h));
  return g;
}

const DEAL = {
  0: '2C 3C 4C 5C 2D 3D 4D 5D 6D 2S 3S 4S 5S',
  1: '6C 7C 8C 9C 6S 7S 8S 9S 2H 3H 7H 8H 9H',
  2: '10C JC QC KC 9D 10D JD QD KD 10S JS QS KS',
  3: 'AC AD AS 4H 5H 6H 10H JH QH KH AH 7D 8D',
};
/** The fourth hand (no passing) with the cards above, and you to lead the two of clubs. */
const table = (): GameState => ({ ...withHands(handNumber(4), DEAL), toPlay: 0 });

const scores = (g: GameState, list: number[]): GameState => ({ ...g, players: g.players.map((p, i) => ({ ...p, score: list[i]! })) });

describe('labels', () => {
  it('says where the cards go in each hand', () => {
    expect(passText(handNumber(1))).toBe('Terry, on your left');
    expect(passText(handNumber(2))).toBe('Priya, on your right');
    expect(passText(handNumber(3))).toBe('Margaret, across the table');
    expect([1, 2, 3, 4].map((h) => directionLabel(handNumber(h)))).toEqual(['Pass left', 'Pass right', 'Pass across', 'No passing']);
  });

  it('tells you what you may play', () => {
    const g = table();
    expect(turnText(g)).toMatch(/two of clubs/);
    // Back to you after the first trick: seat 3 led diamonds, and you have them.
    const yourTurn = { ...playAll(g, '2C 6C 10C AC  AD'), toPlay: 0 };
    expect(turnText(yourTurn)).toBe('Your turn: follow diamonds.');
    expect(turnText({ ...yourTurn, trick: [] })).toMatch(/any card but a heart/);
    expect(turnText({ ...yourTurn, trick: [], heartsBroken: true })).toBe('Your lead: any card.');
    const noDiamonds = withHands(yourTurn, { 0: '3C 4C 5C 2S 3S' });
    expect(turnText(noDiamonds)).toBe('You have no diamonds: play any card.');
  });

  it('says who took a trick and what it cost', () => {
    const last = (state: GameState, card: string) => playCard(state, cards(card)[0]!);
    const hearts = last(playAll(table(), '2C 6C 10C AC  AD 2D 2H'), '9D'); // Terry has no diamonds
    expect(hearts.phase).toBe('collecting');
    expect(trickText(hearts)).toBe('Priya takes the trick (1 point).');
    expect(trickText(last(playAll(table(), '2C 6C 10C'), 'AC'))).toBe('Priya takes the trick.');
  });

  it('says whose turn it is under the table', () => {
    const g = table();
    expect(statusText(g)).toBe(turnText(g));
    expect(statusText(playAll(g, '2C'))).toBe('Terry is thinking…');
  });

  it('tells you how the game ended', () => {
    const settled = autoplay(seededGame(1));
    expect(gameOverText(scores(settled, [40, 100, 60, 70]))).toBe('You win the game!');
    expect(gameOverText(scores(settled, [40, 100, 40, 70]))).toBe('You share the win with Margaret!');
    expect(gameOverText(scores(settled, [80, 100, 30, 30]))).toBe('Margaret and Priya share the win.');
    expect(gameOverText(scores(settled, [80, 100, 30, 70]))).toBe('Margaret wins the game.');
  });

  it('announces your turn and the cards played to screen readers', () => {
    const g = table();
    expect(announcementFor(handNumber(1), false)).toBe('Choose three cards to pass to Terry, on your left.');
    expect(announcementFor(g, true)).toMatch(/^Your lead/);
    expect(announcementFor(playAll(g, '2C'), false)).toBe('You play the two of clubs. ');
    const settled = autoplay(seededGame(1));
    expect(announcementFor(settled, false)).toMatch(/^This hand: you scored \d+ points?\. Your total is \d+\.$/);
  });
});

describe('the result banner', () => {
  it('is only shown once the hand is scored', () => {
    expect(bannerFor(seededGame())).toBeNull();
  });

  it('says how many points you took, and who took the queen', () => {
    const settled = autoplay(seededGame(1));
    const banner = bannerFor(settled)!;
    const mine = settled.result!.points[0]!;
    if (settled.result!.moon === null) {
      expect(banner.main).toBe(mine === 0 ? 'You took no points' : `You took ${mine} ${mine === 1 ? 'point' : 'points'}`);
      expect(banner.sub).toMatch(/took the queen of spades$/);
    }
  });

  it('cheers a moon you shot, and commiserates over someone else’s', () => {
    const settled = autoplay(seededGame(1));
    expect(bannerFor({ ...settled, result: { points: [0, 26, 26, 26], moon: 0 } })).toMatchObject({ tone: 'win', main: 'You shot the moon!' });
    expect(bannerFor({ ...settled, result: { points: [26, 26, 0, 26], moon: 2 } })).toMatchObject({ tone: 'lose', main: 'Margaret shot the moon' });
  });

  it('announces the end of the game', () => {
    const settled = autoplay(seededGame(1));
    expect(bannerFor(scores(settled, [20, 104, 50, 60]))).toMatchObject({ tone: 'win', main: 'You win the game!', sub: 'You finished on 20' });
    expect(bannerFor(scores(settled, [104, 20, 50, 60]))).toMatchObject({ tone: 'lose', main: 'Terry wins the game.' });
  });
});
