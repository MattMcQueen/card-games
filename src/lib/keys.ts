export type Shortcut = 'fold' | 'call' | 'raise' | 'allin';

const keys = new Map<string, Shortcut>([
  ['f', 'fold'],
  ['c', 'call'],
  ['r', 'raise'],
  ['a', 'allin'],
]);

/**
 * The move a key press asks for. Presses with Ctrl, Cmd or Alt are the browser's shortcuts, and a
 * held key must not play the same move twice.
 */
export function shortcutFor(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>,
): Shortcut | undefined {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return undefined;
  return keys.get(event.key.toLowerCase());
}
