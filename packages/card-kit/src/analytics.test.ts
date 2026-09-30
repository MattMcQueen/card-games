import { describe, expect, it } from 'vitest';
import { isLiveSite } from './analytics';

describe('isLiveSite', () => {
  it('counts the games on their own addresses', () => {
    expect(isLiveSite('blackjack.matt-rarely-writes.co.uk')).toBe(true);
    expect(isLiveSite('poker.matt-rarely-writes.co.uk')).toBe(true);
  });

  it('never counts local previews, the tests or Azure’s own addresses', () => {
    expect(isLiveSite('localhost')).toBe(false);
    expect(isLiveSite('127.0.0.1')).toBe(false);
    expect(isLiveSite('ambitious-hill-0d418c310.2.azurestaticapps.net')).toBe(false);
  });

  it('is not fooled by a look-alike address', () => {
    expect(isLiveSite('matt-rarely-writes.co.uk.example.com')).toBe(false);
    expect(isLiveSite('evil-matt-rarely-writes.co.uk')).toBe(false);
  });
});
