import { describe, expect, it } from 'vitest';
import { seededRandomInt } from '@card-games/cards-core';
import { act, legalActions, nextHand } from '../engine';
import { gameWithButton, play, rig, withChips } from '../engine/testing';
import { announcementFor, blindsNote, entryText, gameOverText, lastLabel, seatStatus } from './labels';

// Seat 0 (you) has the button; seats 1 and 2 post the blinds and seat 3 (Nigel) acts first.
const start = () => gameWithButton(0);

describe('lastLabel', () => {
  it('says what a seat did, with its bet', () => {
    expect(lastLabel('fold', 0)).toBe('Fold');
    expect(lastLabel('check', 0)).toBe('Check');
    expect(lastLabel('call', 20)).toBe('Call 20');
    expect(lastLabel('bet', 30)).toBe('Bet 30');
    expect(lastLabel('raise', 60)).toBe('Raise 60');
    expect(lastLabel('allin', 500)).toBe('All-in 500');
  });
});

describe('entryText', () => {
  const texts = (g: ReturnType<typeof start>) => g.log.map((entry) => entryText(entry, g));

  it('reads the blinds and moves, with the right verb for you and for the others', () => {
    const g = play(start(), 'raise 30', 'call', 'fold', 'allin');
    expect(texts(g)).toEqual([
      'Terry posts the small blind (5)',
      'Margaret posts the big blind (10)',
      'Nigel raises to 30',
      'Priya calls 30',
      'Gary folds',
      'You are all-in for 1000',
    ]);
  });

  it('uses "you" forms for the human seat', () => {
    const g = gameWithButton(4); // you are the big blind
    const played = play(g, 'raise 30', 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(texts(played)).toContain('You post the big blind (10)');
    expect(texts(played)).toContain('You fold');
  });

  it('reads a bet, a check and a win', () => {
    const g = play(start(), 'call', 'call', 'call', 'call', 'call', 'check', 'check', 'raise 40', 'fold', 'fold');
    expect(texts(g)).toContain('Terry checks');
    expect(texts(g)).toContain('Margaret bets 40');
    const won = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(texts(won).at(-1)).toBe('Margaret wins 10');
  });

  it('names the cards of the flop, and of the turn and river', () => {
    const g = play(start(), 'call', 'call', 'call', 'call', 'call', 'check');
    const [flop] = g.log.filter((e) => e.kind === 'board');
    expect(flop && entryText(flop, g)).toMatch(/^Flop: \w+ of \w+, \w+ of \w+, \w+ of \w+$/);
    const turned = play(g, 'check', 'check', 'check', 'check', 'check', 'check');
    const turn = turned.log.filter((e) => e.kind === 'board')[1];
    expect(turn && entryText(turn, turned)).toMatch(/^Turn: \w+ of \w+$/);
  });
});

const BOARD = '2c 7d 9h Jc 4s';
const settled = () => play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');

describe('gameOverText', () => {
  it('says where you finished when you run out of chips', () => {
    // You go all-in with 30 chips and lose to Terry's aces: the first one out, so 6th.
    const g = play(rig(withChips(start(), { 0: 30 }), { 0: 'Ks Kd', 1: 'As Ad' }, BOARD), 'fold', 'fold', 'fold', 'allin', 'call', 'fold');
    expect(gameOverText(g)).toBe('Game over: you finished 6th of 6.');
  });

  it('says you won once everyone else is out', () => {
    const headsUp = nextHand(withChips(settled(), { 0: 1000, 1: 0, 2: 0, 3: 1000, 4: 0, 5: 0 }), seededRandomInt(4));
    const g = play(rig(headsUp, { 0: 'As Ad', 3: '5c 3h' }, BOARD), 'allin', 'call');
    expect(gameOverText(g)).toBe('You won! Everyone else is out of chips.');
    expect(announcementFor(g, legalActions(g), false, true)).toBe('You won! Everyone else is out of chips.');
  });
});

describe('an empty seat', () => {
  it('shows where its player finished', () => {
    const g = play(rig(withChips(start(), { 0: 30 }), { 0: 'Ks Kd', 1: 'As Ad' }, BOARD), 'fold', 'fold', 'fold', 'allin', 'call', 'fold');
    expect(seatStatus(g.seats[0]!, undefined)).toBe('6th');
    const headsUp = nextHand(withChips(settled(), { 0: 1000, 1: 0, 2: 0, 3: 1000, 4: 0, 5: 0 }), seededRandomInt(4));
    const won = play(rig(headsUp, { 0: 'As Ad', 3: '5c 3h' }, BOARD), 'allin', 'call');
    expect(seatStatus(won.seats[3]!, undefined)).toBe('2nd');
  });
});

describe('blindsNote', () => {
  it('names the blinds that are in, and says when they have gone up', () => {
    expect(blindsNote(start())).toBe('Nothing yet: the blinds (5/10) are in.');
    expect(blindsNote(nextHand({ ...settled(), hand: 10 }, seededRandomInt(4)))).toBe('The blinds are up to 10/20.');
    expect(blindsNote(nextHand({ ...settled(), hand: 11 }, seededRandomInt(4)))).toBe('Nothing yet: the blinds (10/20) are in.');
  });
});

describe('announcementFor', () => {
  it('prompts you on your turn, with what it costs', () => {
    const g = play(start(), 'fold', 'fold', 'fold');
    expect(announcementFor(g, legalActions(g), true, false)).toBe('Your turn. 10 to call.');
    const checked = play(start(), 'call', 'call', 'call', 'call', 'call', 'check', 'check', 'check', 'check', 'check');
    expect(announcementFor(checked, legalActions(checked), true, false)).toBe('Your turn. You can check or bet.');
  });

  it('otherwise reports the latest move', () => {
    const g = start();
    const next = act(g, { type: 'fold' });
    expect(announcementFor(next, legalActions(next), false, false)).toBe('Nigel folds');
  });

  it('says nothing about a settled hand until its result is shown', () => {
    const g = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(announcementFor(g, legalActions(g), false, false)).toBe('');
    expect(announcementFor(g, legalActions(g), false, true)).toBe('Margaret wins 10');
  });
});

describe('seatStatus', () => {
  it('says what a seat has just done, or that it has put in a blind', () => {
    const g = start();
    expect(seatStatus(g.seats[1]!, undefined)).toBe('Blind 5');
    expect(seatStatus(g.seats[4]!, undefined)).toBe('');
    const played = play(g, 'raise 30', 'call', 'fold');
    expect(seatStatus(played.seats[3]!, undefined)).toBe('Raise 30');
    expect(seatStatus(played.seats[4]!, undefined)).toBe('Call 30');
    expect(seatStatus(played.seats[5]!, undefined)).toBe('Fold');
  });

  it('says all-in, and what a winner won once the result shows', () => {
    const g = play(start(), 'allin');
    expect(seatStatus(g.seats[3]!, undefined)).toBe('All-in 1000');
    const won = play(start(), 'fold', 'fold', 'fold', 'fold', 'fold');
    expect(seatStatus(won.seats[2]!, won.results[2])).toBe('+5');
    expect(seatStatus(won.seats[1]!, won.results[1])).toBe('Fold');
  });
});
