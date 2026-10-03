import { seededRandomInt } from '@card-games/cards-core';
import { describe, expect, it } from 'vitest';
import { collect, legalCards, makeCall, nextHand, playCard, type GameState } from '../engine';
import { auction, autoplay, calls, cards, playAll, seededGame, withHands } from '../engine/testing';
import { cuesFor } from './cues';
import { announcementFor, bidPrompt, callText, callWords, contractBy, gameOverText, resultText, sideCount, statusText, teamName, turnText } from './labels';
import { bannerFor } from './verdict';

const HANDS = {
  0: 'AS KS QS JS 10S 9S 8S 7S 6S 5S 4S 3S 2S',
  1: 'AH KH QH JH 10H 9H 8H 7H 6H 5H 4H 3H 2H',
  2: 'AD KD QD JD 10D 9D 8D 7D 6D 5D 4D 3D 2D',
  3: 'AC KC QC JC 10C 9C 8C 7C 6C 5C 4C 3C 2C',
};
const rigged = () => withHands(seededGame(), HANDS);

describe('labels', () => {
  it('writes calls and contracts', () => {
    expect(calls('1H 3NT P X XX').map(callText)).toEqual(['1♥', '3NT', 'Pass', 'Double', 'Redouble']);
    expect(calls('1H 3NT P').map(callWords)).toEqual(['1 heart', '3 no trumps', 'pass']);
    const g = auction(rigged(), 'P P 4D X P P P');
    expect(contractBy(g, g.contract!)).toBe('4♦ doubled by Helen');
    expect(teamName(g, 1)).toBe('Arjun and Mei');
  });

  it('asks for your call with what has been said since your last one', () => {
    expect(bidPrompt(seededGame())).toBe('You deal, so you call first.');
    expect(bidPrompt(auction(seededGame(), '1C 1H P 2H'))).toBe('Arjun 1♥, Helen pass, Mei 2♥. Your call.');
  });

  it('tells you what to play, from your hand or the dummy', () => {
    const yours = auction(rigged(), '1S P P P');
    expect(statusText(yours)).toBe('Arjun is choosing a card…');
    const dummyTurn = playAll(yours, '2H');
    expect(turnText(dummyTurn)).toBe('No hearts in the dummy: play any card.');
    expect(statusText(dummyTurn)).toBe('No hearts in the dummy: play any card.');
    expect(statusText(playAll(yours, '2H 2D'))).toBe('Mei is choosing a card…');
  });

  it('counts tricks against what each side needs', () => {
    const g = autoplay(auction(rigged(), '1S P P P'));
    expect(sideCount(g, 0)).toEqual({ took: 13, need: 7 });
    expect(sideCount(g, 1)).toEqual({ took: 0, need: 7 });
    expect(resultText(g, g.result!)).toBe('1♠ by you, made with 6 over');
  });

  it('announces calls and the contract to screen readers', () => {
    const g = auction(seededGame(), '1C');
    expect(announcementFor(g, false)).toBe('You say 1 club. ');
    expect(announcementFor(auction(g, 'P P'), false)).toBe('Helen says pass. ');
    expect(announcementFor(auction(rigged(), 'P P 1D P P P'), false)).toBe('The contract is 1♦ by Helen.');
  });
});

describe('the result banner', () => {
  it('cheers a contract made by your side, and says when it went down', () => {
    const made = autoplay(auction(rigged(), '1S P P P'));
    expect(bannerFor(made)).toMatchObject({ tone: 'win', main: 'You made 1♠ with 6 over', sub: 'Us +360, them 0' });
    const down = autoplay(auction(rigged(), '7NT X P P P'));
    expect(bannerFor(down)).toMatchObject({ tone: 'lose', main: 'You went down 13 in 7NT doubled' });
  });

  it('says when a hand was passed out, and how the rubber ended', () => {
    expect(bannerFor(auction(seededGame(), 'P P P P'))).toMatchObject({ main: 'Passed out' });
    let g: GameState = autoplay(auction(rigged(), '4S P P P'));
    g = autoplay(auction(withHands(nextHand(g, seededRandomInt(2)), HANDS), 'P 4S P P P'));
    expect(gameOverText(g)).toBe('You and Helen win the rubber!');
    expect(bannerFor(g)).toMatchObject({ tone: 'win', sub: expect.stringMatching(/^The final score is \d+ to 0$/) });
  });
});

describe('sounds', () => {
  const sounds = (prev: GameState, next: GameState) => cuesFor(prev, next, true).map((c) => c.sound);

  it('a tap for a call, a sharper one for a double, and the deal', () => {
    const g = seededGame();
    expect(sounds(g, makeCall(g, calls('1C')[0]!))).toEqual(['bid']);
    const opened = auction(g, '1C');
    expect(sounds(opened, makeCall(opened, calls('X')[0]!))).toEqual(['double']);
    const done = autoplay(g);
    expect(sounds(done, nextHand(done, seededRandomInt(3)))[0]).toBe('shuffle');
  });

  it('plays a card, gathers the trick, and a jingle at the end of the hand', () => {
    const g = auction(rigged(), '1S P P P');
    expect(sounds(g, playCard(g, cards('2H')[0]!))).toEqual(['play']);
    let last = g;
    while (last.taken.length < 12 || last.phase !== 'collecting') {
      last = last.phase === 'collecting' ? collect(last) : playCard(last, legalCards(last)[0]!);
    }
    expect(sounds(last, collect(last))).toEqual(['gather', 'win']);
  });
});
