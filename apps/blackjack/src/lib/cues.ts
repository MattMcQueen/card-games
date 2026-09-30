import { reducedMotion } from '@card-games/card-kit/motion';
import { isGameOver, roundNet, type GameState, type PlayerHand } from '../engine';
import { DEAL_GAP, dealerDelay, settleDelay } from './motion';
import { playSound, type SoundName } from './synth';

export interface Cue {
  readonly sound: SoundName;
  /** Seconds after the action at which the sound should start. */
  readonly at: number;
}

const cardCount = (hands: readonly PlayerHand[]) => hands.reduce((n, h) => n + h.cards.length, 0);
const betTotal = (hands: readonly PlayerHand[]) => hands.reduce((n, h) => n + h.bet, 0);

/** How a step adds its sounds: `add` queues one, `when` gives the time of an animation. */
interface Timing {
  readonly add: (sound: SoundName, at?: number) => void;
  /** Seconds for an animation that lands after `ms`; with reduced motion, the sounds are just spaced out. */
  readonly when: (ms: number, order: number) => number;
  readonly reduced: boolean;
}

/** The bet goes down and the opening cards are dealt: player, dealer, player, then the dealer's own. */
function dealCues(next: GameState, { add, when }: Timing) {
  add('chip');
  if (next.shuffled) add('shuffle');
  add('deal', 0);
  add('deal', when(DEAL_GAP, 1));
  add('deal', when(2 * DEAL_GAP, 2));
  for (let i = 1; i < next.dealer.length; i++) add('deal', when(dealerDelay(i), i + 2));
}

/** Cards the dealer was dealt while the player's move was being made. */
function dealerCues(prev: GameState, next: GameState, { add, when }: Timing) {
  for (let i = prev.dealer.length; i < next.dealer.length; i++) add('deal', when(dealerDelay(i), i));
}

/** The player's own move: a split, a double or a hit, and whatever the dealer then plays. */
function playerCues(prev: GameState, next: GameState, timing: Timing) {
  const { add, when } = timing;
  if (next.hands.length > prev.hands.length) {
    // Split: a second bet goes down and each new hand is dealt a card.
    add('chip');
    add('deal', when(2 * DEAL_GAP, 1));
    add('deal', when(2 * DEAL_GAP + 40, 2));
  } else {
    if (betTotal(next.hands) > betTotal(prev.hands)) add('chip'); // double down
    if (cardCount(next.hands) > cardCount(prev.hands)) add('deal', 0);
  }
  dealerCues(prev, next, timing);
}

/** The result, once the dealer's cards have landed. */
function settleCues(next: GameState, { add, reduced }: Timing) {
  const at = reduced ? 0.2 : settleDelay(next.dealer.length) / 1000;
  const net = roundNet(next);
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

/**
 * Which sounds a change of game state should make, and when. The times mirror the card
 * animations in HandView, so each card sound lands as its card does.
 */
export function cuesFor(prev: GameState, next: GameState, reduced = reducedMotion): Cue[] {
  const cues: Cue[] = [];
  const timing: Timing = {
    add: (sound, at = 0) => cues.push({ sound, at }),
    when: (ms, order) => (reduced ? order * 0.12 : ms / 1000),
    reduced,
  };

  if (prev.phase === 'betting' && next.phase !== 'betting') {
    dealCues(next, timing);
  } else if (prev.phase === 'insurance') {
    if (next.insurance > prev.insurance) timing.add('chip'); // insurance taken
    dealerCues(prev, next, timing);
  } else if (prev.phase === 'player') {
    playerCues(prev, next, timing);
  }

  if (next.phase === 'settled' && prev.phase !== 'settled') settleCues(next, timing);
  return cues;
}

export function playCues(cues: readonly Cue[]): void {
  for (const cue of cues) playSound(cue.sound, cue.at);
}
