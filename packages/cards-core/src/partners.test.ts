import { describe, expect, it } from 'vitest';
import { teamLabel, teamName, teamOf, winnersText } from './partners';

const players = ['You', 'Arjun', 'Helen', 'Mei'].map((name) => ({ name }));

describe('partnerships', () => {
  it('puts you with the player across the table', () => {
    expect([0, 1, 2, 3].map(teamOf)).toEqual([0, 1, 0, 1]);
    expect(teamName(players, 0)).toBe('You and Helen');
    expect(teamName(players, 1)).toBe('Arjun and Mei');
    expect([teamLabel(0), teamLabel(1)]).toEqual(['Us', 'Them']);
  });

  it('cheers your side winning, and not the other', () => {
    expect(winnersText(players, 0, 'the rubber')).toBe('You and Helen win the rubber!');
    expect(winnersText(players, 1, 'the game')).toBe('Arjun and Mei win the game.');
  });
});
