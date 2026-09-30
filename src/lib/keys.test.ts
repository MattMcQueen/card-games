import { describe, expect, it } from 'vitest';
import type { LegalActions } from '../engine';
import { keyMove, keysActive, moveFor, shortcutFor } from './keys';

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

describe('moveFor', () => {
  const legal: LegalActions = { canCheck: false, canCall: true, toCall: 20, canRaise: true, minRaiseTo: 40, maxRaiseTo: 500 };

  it('folds, calls, raises the amount set up, and goes all-in', () => {
    expect(moveFor('fold', legal, 60)).toEqual({ type: 'fold' });
    expect(moveFor('call', legal, 60)).toEqual({ type: 'call' });
    expect(moveFor('raise', legal, 60)).toEqual({ type: 'raise', to: 60 });
    expect(moveFor('allin', legal, 60)).toEqual({ type: 'raise', to: 500 });
  });

  it('checks when there is nothing to call', () => {
    expect(moveFor('call', { ...legal, canCall: false, canCheck: true, toCall: 0 }, 60)).toEqual({ type: 'check' });
  });

  it('ignores a raise that is not allowed, and calls instead of going all-in when it cannot raise', () => {
    const cannotRaise = { ...legal, canRaise: false };
    expect(moveFor('raise', cannotRaise, 60)).toBeUndefined();
    expect(moveFor('allin', cannotRaise, 60)).toEqual({ type: 'call' });
    expect(moveFor('allin', { ...cannotRaise, canCall: false }, 60)).toBeUndefined();
  });
});

describe('keyMove', () => {
  const legal: LegalActions = { canCheck: true, canCall: false, toCall: 0, canRaise: true, minRaiseTo: 10, maxRaiseTo: 300 };

  it('turns a key press into the move it stands for', () => {
    expect(keyMove(press('c'), legal, 40)).toEqual({ type: 'check' });
    expect(keyMove(press('R'), legal, 40)).toEqual({ type: 'raise', to: 40 });
    expect(keyMove(press('a'), legal, 40)).toEqual({ type: 'raise', to: 300 });
  });

  it('does nothing for other keys, browser shortcuts or a held key', () => {
    expect(keyMove(press('x'), legal, 40)).toBeUndefined();
    expect(keyMove(press('f', { ctrlKey: true }), legal, 40)).toBeUndefined();
    expect(keyMove(press('f', { repeat: true }), legal, 40)).toBeUndefined();
  });
});

describe('keysActive', () => {
  it('is on only on the game page, on your turn, with no panel open', () => {
    expect(keysActive(true, true, false)).toBe(true);
    expect(keysActive(false, true, false)).toBe(false);
    expect(keysActive(true, false, false)).toBe(false);
    expect(keysActive(true, true, true)).toBe(false);
  });
});
