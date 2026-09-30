import type { Action } from '../engine';

const keys = new Map<string, Action>([
  ['h', 'hit'],
  ['s', 'stand'],
  ['d', 'double'],
  ['p', 'split'],
  ['r', 'surrender'],
  ['i', 'insure'],
  ['n', 'decline'],
]);

/**
 * The move a key press asks for, if it is one of the moves allowed right now. Presses with
 * Ctrl, Cmd or Alt are the browser's shortcuts, and a held key must not play the same move twice.
 */
export function shortcutFor(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>,
  allowed: readonly Action[],
): Action | undefined {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return undefined;
  return actionForKey(event.key, allowed);
}

/** The action a key press stands for, if it is one of the moves allowed right now. */
export function actionForKey(key: string, allowed: readonly Action[]): Action | undefined {
  const action = keys.get(key.toLowerCase());
  return action && allowed.includes(action) ? action : undefined;
}
