import { describe, expect, it } from 'vitest';
import { isPlainClick, pathFor, routeFor, routes } from './routes';

describe('routeFor', () => {
  it('finds each page by its address', () => {
    for (const { route, path } of routes) expect(routeFor(path)).toBe(route);
  });

  it('ignores a trailing slash', () => {
    expect(routeFor('/about/')).toBe('about');
    expect(routeFor('/how-to-play/')).toBe('how-to-play');
  });

  it('falls back to the game', () => {
    expect(routeFor('/')).toBe('game');
    expect(routeFor('/nothing-here')).toBe('game');
  });

  it('round-trips with pathFor', () => {
    expect(pathFor('about')).toBe('/about');
  });
});

describe('isPlainClick', () => {
  const click = { button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false };

  it('is true for a plain left click', () => {
    expect(isPlainClick(click)).toBe(true);
  });

  it('is false for other buttons and for clicks that mean "open in a new tab or window"', () => {
    expect(isPlainClick({ ...click, button: 1 })).toBe(false);
    for (const key of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'] as const) {
      expect(isPlainClick({ ...click, [key]: true })).toBe(false);
    }
  });
});
