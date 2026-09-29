import { describe, expect, it } from 'vitest';
import { pathFor, routeFor, routes } from './routes';

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
