import type { Action, LegalActions } from '../engine';

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

/**
 * The move a shortcut stands for right now, or nothing if it is not allowed: "raise" bets the amount
 * that is set up, "all-in" bets everything (or calls, if there is no more raising to do), and "call"
 * is a check when there is nothing to call.
 */
export function moveFor(shortcut: Shortcut, legal: LegalActions, amount: number): Action | undefined {
  switch (shortcut) {
    case 'fold':
      return { type: 'fold' };
    case 'call':
      return { type: legal.canCall ? 'call' : 'check' };
    case 'raise':
      return legal.canRaise ? { type: 'raise', to: amount } : undefined;
    case 'allin':
      if (legal.canRaise) return { type: 'raise', to: legal.maxRaiseTo };
      return legal.canCall ? { type: 'call' } : undefined;
  }
}

/** The move a key press asks for, if it is one of the moves allowed right now. */
export function keyMove(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'repeat'>,
  legal: LegalActions,
  amount: number,
): Action | undefined {
  const shortcut = shortcutFor(event);
  return shortcut && moveFor(shortcut, legal, amount);
}

/** Whether the keys should play a move at all: on the game page, on your turn, and not while a panel has the keyboard. */
export function keysActive(onGamePage: boolean, yourTurn: boolean, panelOpen: boolean): boolean {
  return onGamePage && yourTurn && !panelOpen;
}
