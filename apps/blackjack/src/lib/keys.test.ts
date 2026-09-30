import { describe, expect, it } from 'vitest';
import { actionForKey, shortcutFor } from './keys';

describe('actionForKey', () => {
  const all = ['hit', 'stand', 'double', 'split', 'surrender', 'insure', 'decline'] as const;

  it('maps each key to its move, in either case', () => {
    expect(actionForKey('h', all)).toBe('hit');
    expect(actionForKey('S', all)).toBe('stand');
    expect(actionForKey('d', all)).toBe('double');
    expect(actionForKey('p', all)).toBe('split');
    expect(actionForKey('R', all)).toBe('surrender');
    expect(actionForKey('i', all)).toBe('insure');
    expect(actionForKey('n', all)).toBe('decline');
  });

  it('ignores moves that are not allowed right now', () => {
    expect(actionForKey('d', ['hit', 'stand'])).toBeUndefined();
    expect(actionForKey('h', ['insure', 'decline'])).toBeUndefined();
  });

  it('ignores other keys, including names that exist on every object', () => {
    expect(actionForKey('x', all)).toBeUndefined();
    expect(actionForKey('Enter', all)).toBeUndefined();
    expect(actionForKey('constructor', all)).toBeUndefined();
  });
});

describe('shortcutFor', () => {
  const press = { key: 'h', ctrlKey: false, metaKey: false, altKey: false, repeat: false };

  it('plays the move for a plain key press', () => {
    expect(shortcutFor(press, ['hit', 'stand'])).toBe('hit');
  });

  it('leaves the browser its own shortcuts, such as Ctrl+H', () => {
    for (const modifier of ['ctrlKey', 'metaKey', 'altKey'] as const) {
      expect(shortcutFor({ ...press, [modifier]: true }, ['hit', 'stand'])).toBeUndefined();
    }
  });

  it('does not repeat a move while the key is held down', () => {
    expect(shortcutFor({ ...press, repeat: true }, ['hit', 'stand'])).toBeUndefined();
  });

  it('ignores a move that is not allowed', () => {
    expect(shortcutFor(press, ['stand'])).toBeUndefined();
  });
});
