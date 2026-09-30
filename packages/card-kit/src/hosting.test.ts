import { describe, expect, it } from 'vitest';
import config from '../public/staticwebapp.config.json';

const headers = config.globalHeaders;
const directives = Object.fromEntries(
  headers['Content-Security-Policy'].split('; ').map((part) => {
    const [name, ...values] = part.split(' ');
    return [name, values];
  }),
);

describe('security headers', () => {
  it('only lets the page load its own files, plus Ko-fi in a frame and Cloudflare Web Analytics', () => {
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['script-src']).toEqual(["'self'", 'https://static.cloudflareinsights.com']);
    expect(directives['frame-src']).toEqual(['https://ko-fi.com']);
    expect(directives['connect-src']).toEqual(["'self'", 'https://cloudflareinsights.com']);
  });

  it('never allows inline or eval code', () => {
    const csp = headers['Content-Security-Policy'];
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  it('blocks plugins, framing of this site and form posts', () => {
    expect(directives['object-src']).toEqual(["'none'"]);
    expect(directives['frame-ancestors']).toEqual(["'none'"]);
    expect(directives['form-action']).toEqual(["'none'"]);
    expect(directives['upgrade-insecure-requests']).toEqual([]);
  });

  it('sends the other standard protections', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Strict-Transport-Security']).toContain('max-age=');
    expect(headers['Referrer-Policy']).toBeTruthy();
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });
});

describe('caching', () => {
  it('keeps fingerprinted assets for a year, and checks the page for a new version every time', () => {
    const assets = config.routes.find((r) => r.route === '/assets/*') as { headers: Record<string, string> };
    expect(assets?.headers['Cache-Control']).toContain('immutable');
    // So a phone (or a game saved to the Home Screen) never keeps playing an old version after a deploy.
    expect(headers['Cache-Control']).toBe('no-cache');
  });
});

describe('pages', () => {
  it('serves the game for the addresses of its other pages, so they can be opened or refreshed', () => {
    for (const route of ['/how-to-play', '/about']) {
      expect(config.routes.find((r) => r.route === route)).toMatchObject({ rewrite: '/index.html' });
    }
  });

  it('has one rule per address, as Azure refuses to deploy a rule that differs only by a trailing slash (it matches those anyway)', () => {
    const addresses = config.routes.map((r) => r.route.replace(/\/$/, ''));
    expect(new Set(addresses).size).toBe(addresses.length);
  });
});
