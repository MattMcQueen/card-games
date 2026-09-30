import { describe, expect, it } from 'vitest';
import { shortcutFor } from './keys';

const press = (key: string, extra: object = {}) => ({ key, ctrlKey: false, metaKey: false, altKey: false, repeat: false, ...extra });

describe('shortcutFor', () => {
  it('maps each key to its move, in either case', () => {
    expect(shortcutFor(press('f'))).toBe('fold');
    expect(shortcutFor(press('C'))).toBe('call');
    expect(shortcutFor(press('r'))).toBe('raise');
    expect(shortcutFor(press('A'))).toBe('allin');
  });

  it('ignores other keys', () => {
    expect(shortcutFor(press('x'))).toBeUndefined();
    expect(shortcutFor(press('Enter'))).toBeUndefined();
  });

  it('leaves the browser shortcuts and held keys alone', () => {
    expect(shortcutFor(press('c', { ctrlKey: true }))).toBeUndefined();
    expect(shortcutFor(press('r', { metaKey: true }))).toBeUndefined();
    expect(shortcutFor(press('f', { altKey: true }))).toBeUndefined();
    expect(shortcutFor(press('f', { repeat: true }))).toBeUndefined();
  });
});
