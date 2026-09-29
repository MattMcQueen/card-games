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
  it('only lets the page load its own files, plus Ko-fi in a frame', () => {
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['script-src']).toEqual(["'self'"]);
    expect(directives['frame-src']).toEqual(['https://ko-fi.com']);
    expect(directives['connect-src']).toEqual(["'self'"]);
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
  it('keeps fingerprinted assets for a year and pages for ten minutes', () => {
    const assets = config.routes.find((r) => r.route === '/assets/*');
    expect(assets?.headers['Cache-Control']).toContain('immutable');
    expect(headers['Cache-Control']).toBe('public, max-age=600');
  });
});
