import { isGameOver, roundNet, type GameState } from '../engine';
import { outcomeLabel, signed } from './labels';

export interface Banner {
  readonly kind: 'win' | 'lose' | 'push';
  readonly text: string;
}

/** What the insurance bet won (2 to 1) or lost this round. */
export const insuranceNet = (game: GameState) => game.insuranceReturned - game.insurance;

/**
 * One result for a settled round. With several hands each one is also labelled on the table;
 * with one hand this is the only place the result is shown.
 */
export function bannerFor(game: GameState): Banner {
  const net = roundNet(game);
  const outcomes = game.results.map((result) => result.outcome);
  const only = outcomes.length === 1 ? outcomes[0] : undefined;

  // Not when insurance made up for it: then it is shown as the win or push it came to.
  if (only === 'surrender' && net < 0) return { kind: 'lose', text: `Surrendered, lose ${-net}` };

  const lead = outcomes.includes('blackjack') ? 'Blackjack! ' : only === 'bust' ? 'Bust! ' : '';
  if (net > 0) return { kind: 'win', text: `${lead}You win ${net}` };
  if (net < 0) return { kind: 'lose', text: `${lead}Dealer wins ${-net}` };
  return { kind: 'push', text: game.insuranceReturned > 0 ? 'Even: insurance paid' : 'Push' };
}

/** The small note about the insurance bet once the round is settled. */
export function insuranceNote(game: GameState): string {
  return game.insuranceReturned > 0
    ? `Insurance pays +${insuranceNet(game)}`
    : `Insurance lost −${game.insurance}`;
}

/** What a screen reader is told when the round is over. */
export function announcementFor(game: GameState): string {
  const parts = game.results.map((result) => `${outcomeLabel[result.outcome]} ${signed(result.net)}`);
  if (game.insurance > 0) parts.push(`Insurance ${signed(insuranceNet(game))}`);
  const broke = isGameOver(game) ? ' You are out of chips.' : '';
  return `Round over. ${parts.join(', ')}. You have ${game.chips} chips.${broke}`;
}
