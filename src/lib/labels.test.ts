import { describe, expect, it } from 'vitest';
import { act, legalActions } from '../engine';
import { gameWithButton, play } from '../engine/testing';
import { announcementFor, entryText, lastLabel, seatStatus } from './labels';

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
