import { isGameOver, type GameState, type PlayerHand } from '../engine';
import { dealerDelay, reducedMotion, settleDelay } from './motion';
import type { SoundName } from './synth';

export interface Cue {
  readonly sound: SoundName;
  /** Seconds after the action at which the sound should start. */
  readonly at: number;
}

const cardCount = (hands: readonly PlayerHand[]) => hands.reduce((n, h) => n + h.cards.length, 0);
const betTotal = (hands: readonly PlayerHand[]) => hands.reduce((n, h) => n + h.bet, 0);

/**
 * Which sounds a change of game state should make, and when. The times mirror the card
 * animations in HandView, so each card sound lands as its card does.
 */
export function cuesFor(prev: GameState, next: GameState, reduced = reducedMotion): Cue[] {
  const cues: Cue[] = [];
  const add = (sound: SoundName, at = 0) => cues.push({ sound, at });
  // With reduced motion nothing waits for an animation, so just space the sounds out a little.
  const when = (ms: number, order: number) => (reduced ? order * 0.12 : ms / 1000);

  if (prev.phase === 'betting' && next.phase !== 'betting') {
    add('chip');
    if (next.shuffled) add('shuffle');
    add('deal', 0);
    add('deal', when(230, 1));
    add('deal', when(460, 2));
    for (let i = 1; i < next.dealer.length; i++) add('deal', when(dealerDelay(i), i + 2));
  } else if (prev.phase === 'player') {
    if (next.hands.length > prev.hands.length) {
      // Split: a second bet goes down and each new hand is dealt a card.
      add('chip');
      add('deal', when(460, 1));
      add('deal', when(500, 2));
    } else {
      if (betTotal(next.hands) > betTotal(prev.hands)) add('chip'); // double down
      if (cardCount(next.hands) > cardCount(prev.hands)) add('deal', 0);
    }
    for (let i = prev.dealer.length; i < next.dealer.length; i++) {
      add('deal', when(dealerDelay(i), i));
    }
  }

  if (next.phase === 'settled' && prev.phase !== 'settled') {
    const at = reduced ? 0.2 : settleDelay(next.dealer.length) / 1000;
    const net = next.results.reduce((sum, r) => sum + r.net, 0);
    if (net > 0) {
      add(next.results.some((r) => r.outcome === 'blackjack') ? 'blackjack' : 'win', at);
      add('payout', at + 0.25);
    } else if (net < 0) {
      add('lose', at);
      add('sweep', at + 0.1);
      if (isGameOver(next)) add('gameOver', at + 0.8);
    } else {
      add('push', at);
    }
  }

  return cues;
}
