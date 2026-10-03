import { describe, expect, it } from 'vitest';
import { placeBid, playCard, type GameState } from '../engine';
import { scoreTeam } from '../engine/game';
import { autoplay, bidAll, cards, playAll, seededGame, withHands } from '../engine/testing';
import { announcementFor, bidPrompt, gameOverText, score, signed, statusText, teamName, trickText, turnText } from './labels';
import { bannerFor } from './verdict';

const DEAL = {
  0: '2C 3C 4C 5C 2D 3D 4D 5D 2H 3H 4H 5H 2S',
  1: '6C 7C 8C 9C 6D 7D 8D 9D 6H 7H 8H 9H 3S',
  2: '10C JC QC KC 10D JD QD KD 10H JH QH KH 4S',
  3: 'AC AD AH 5S 6S 7S 8S 9S 10S JS QS KS AS',
};
/** The first hand with the cards above, bid 3 each, and you to lead. */
const table = (): GameState => bidAll(withHands(seededGame(3), DEAL), [3, 3, 3, 3]);

const play = (state: GameState, card: string) => playCard(state, cards(card)[0]!);
const scores = (g: GameState, us: number, them: number): GameState => ({ ...g, teams: [{ score: us, bags: 0 }, { score: them, bags: 0 }] });

/** A settled hand with the given bids and tricks taken, by seat. */
function settled(bids: number[], tricks: number[]): GameState {
  const g = autoplay(seededGame(1));
  const players = g.players.map((p, i) => ({ ...p, bid: bids[i]!, tricks: tricks[i]! }));
  const result = [0, 1].map((t) => scoreTeam([players[t]!, players[t + 2]!], 0));
  return { ...g, players, result };
}

describe('labels', () => {
  it('names the partnerships', () => {
    expect(teamName(seededGame(), 0)).toBe('You and Grace');
    expect(teamName(seededGame(), 1)).toBe('Omar and Lena');
  });

  it('asks for your bid, saying what has been bid so far', () => {
    const g = seededGame();
    expect(bidPrompt(g)).toBe('How many tricks will you take?');
    // In the second hand you bid last.
    const late = { ...g, players: g.players.map((p) => (p.human ? p : { ...p, bid: p.id === 2 ? 0 : 4 })) };
    expect(bidPrompt(late)).toBe('Omar bid 4, Grace bid nil, Lena bid 4. How many tricks will you take? Your partner is going nil: cover them.');
  });

  it('tells you what you may play', () => {
    const g = table();
    expect(turnText(g)).toMatch(/any card but a spade/);
    expect(turnText({ ...g, spadesBroken: true })).toBe('Your lead: any card.');
    const followClubs = { ...playAll(g, '2C 6C 10C AC  AD'), toPlay: 0 };
    expect(turnText(followClubs)).toBe('Your turn: follow diamonds.');
    expect(turnText(withHands(followClubs, { 0: '3C 2S' }))).toBe('You have no diamonds: play any card, or trump it with a spade.');
  });

  it('says who took a trick', () => {
    expect(trickText(play(playAll(table(), '2C 6C 10C'), 'AC'))).toBe('Lena takes the trick.');
    expect(trickText({ ...table(), winner: 0 })).toBe('You take the trick.');
  });

  it('says whose turn it is under the table', () => {
    expect(statusText(placeBid(seededGame(), 3))).toBe('Omar is bidding…');
    expect(statusText(playAll(table(), '2C'))).toBe('Omar is choosing a card…');
  });

  it('tells you how the game ended', () => {
    const g = autoplay(seededGame(1));
    expect(gameOverText(scores(g, 510, 300))).toBe('You and Grace win the game!');
    expect(gameOverText(scores(g, 510, 530))).toBe('Omar and Lena win the game.');
    expect(gameOverText(scores(g, 300, 200))).toBe('');
  });

  it('announces bids, cards played and results to screen readers', () => {
    const g = seededGame();
    expect(announcementFor(g, false)).toBe('Your bid: how many tricks will you take?');
    expect(announcementFor(placeBid(g, 4), false)).toBe('You bid 4. ');
    expect(announcementFor(playAll(table(), '2C'), false)).toBe('You play the two of clubs. ');
    expect(announcementFor(autoplay(seededGame(1)), false)).toMatch(/^This hand: us, bid \d+, took \d+ tricks?: −?\d+ points?; them, .* The score is −?\d+ to −?\d+\.$/);
  });
});

describe('the result banner', () => {
  it('is only shown once the hand is scored', () => {
    expect(bannerFor(seededGame())).toBeNull();
  });

  it('cheers a bid made, and says when you were set', () => {
    expect(bannerFor(settled([3, 2, 4, 2], [4, 2, 4, 3]))).toMatchObject({ tone: 'win', main: 'You and Grace made 7 and 1 over', sub: 'Us +71, them +41' });
    expect(bannerFor(settled([3, 2, 4, 2], [2, 5, 4, 2]))).toMatchObject({ tone: 'lose', main: 'Set! You and Grace took 6 of 7', sub: 'Us −70, them +43' });
  });

  it('tells you how your nil went', () => {
    expect(bannerFor(settled([0, 4, 5, 3], [0, 4, 6, 3]))).toMatchObject({ tone: 'win', main: 'Your nil made!' });
    expect(bannerFor(settled([0, 4, 5, 3], [1, 4, 5, 3]))).toMatchObject({ tone: 'lose', main: 'Your nil failed: you took 1' });
  });

  it('announces the end of the game', () => {
    const g = settled([3, 2, 4, 2], [4, 2, 4, 3]);
    expect(bannerFor(scores(g, 512, -40))).toMatchObject({ tone: 'win', main: 'You and Grace win the game!', sub: 'The final score is 512 to −40' });
  });

  it('writes scores with a proper minus sign', () => {
    expect([score(-70), score(0), signed(51), signed(-70), signed(0)]).toEqual(['−70', '0', '+51', '−70', '0']);
  });
});
