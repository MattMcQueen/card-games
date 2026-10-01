import { handValue, type Action, type Card, type GameState } from '../engine';

/** What basic strategy says to do, and the cheat-sheet rule behind it. */
export interface Hint {
  readonly action: Action;
  readonly text: string;
}

/**
 * The cheat-sheet hint for the decision in front of the player, or nothing when the sheet has no
 * line for it. Based on blackjackoddstrainer.com's cheat sheet, with its S17 changes, because this
 * dealer stands on every 17. Surrender is not on the sheet, so it is never suggested.
 */
export function hintFor(state: GameState, allowed: readonly Action[]): Hint | undefined {
  if (state.phase === 'insurance') {
    return { action: 'decline', text: 'Never take insurance: it is a side bet with a built-in house edge.' };
  }
  const hand = state.hands[state.active];
  const upCard = state.dealer[0];
  if (state.phase !== 'player' || !hand || hand.done || !upCard) return undefined;

  const up = upValue(upCard);
  const can = (action: Action) => allowed.includes(action);
  const pair = can('split') ? pairHint(hand.cards, up) : undefined;
  if (pair) return pair;

  const { total, soft } = handValue(hand.cards);
  const line = soft ? softLine(total, up) : hardLine(total, up);
  if (!line) return undefined;
  const [wanted, text] = line;
  if (wanted !== 'double' || can('double')) return { action: wanted, text };
  // A double that is not allowed (after a hit, or without the chips) becomes a hit, or a stand on soft 18.
  const instead = soft && total === 18 ? 'stand' : 'hit';
  return { action: instead, text: `${text} You cannot double now, so ${instead}.` };
}

/** The dealer's up-card as 2 to 11, with an ace as 11. */
function upValue(card: Card): number {
  if (card.rank === 'A') return 11;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10;
  return Number(card.rank);
}

const between = (up: number, low: number, high: number) => up >= low && up <= high;

/** A pair that basic strategy splits; any other pair is played as its total. */
function pairHint(cards: readonly Card[], up: number): Hint | undefined {
  const split = (text: string): Hint => ({ action: 'split', text });
  switch (cards[0]?.rank) {
    case 'A':
    case '8':
      return split('Always split aces and 8s, against any dealer card.');
    case '2':
    case '3':
    case '7':
      return between(up, 2, 7) ? split('Split 2s, 3s and 7s against 2 to 7, otherwise hit.') : undefined;
    case '6':
      return between(up, 2, 6) ? split('Split 6s against 2 to 6, otherwise hit.') : undefined;
    case '9':
      return between(up, 2, 9) && up !== 7
        ? split('Split 9s against 2 to 9 except 7. Stand against 7, 10 and ace.')
        : undefined;
    case '4':
      return between(up, 5, 6) ? split('Split 4s against 5 and 6, otherwise hit.') : undefined;
    default:
      return undefined;
  }
}

type Line = [Action, string];

function hardLine(total: number, up: number): Line {
  if (total <= 8) return ['hit', 'Always hit 8 or less.'];
  if (total === 9) return [between(up, 3, 6) ? 'double' : 'hit', 'Double 9 against 3 to 6, otherwise hit.'];
  if (total === 10) return [between(up, 2, 9) ? 'double' : 'hit', 'Double 10 against 2 to 9, otherwise hit.'];
  if (total === 11) {
    return [up === 11 ? 'hit' : 'double', 'Double 11 against 2 to 10. Against an ace, hit (this dealer stands on soft 17).'];
  }
  if (total === 12) return [between(up, 4, 6) ? 'stand' : 'hit', 'Stand on 12 against 4 to 6, otherwise hit.'];
  if (total <= 16) return [between(up, 2, 6) ? 'stand' : 'hit', 'Stand on 13 to 16 against 2 to 6, otherwise hit.'];
  return ['stand', 'Always stand on hard 17 or more.'];
}

/** Soft totals by the hand they match: soft 13 is A,2 and so on. Soft 12 (two aces) is not on the sheet. */
function softLine(total: number, up: number): Line | undefined {
  if (total === 13 || total === 14) {
    return [between(up, 5, 6) ? 'double' : 'hit', 'Soft 13 or 14 (A,2 or A,3): double against 5 and 6, otherwise hit.'];
  }
  if (total === 15 || total === 16) {
    return [between(up, 4, 6) ? 'double' : 'hit', 'Soft 15 or 16 (A,4 or A,5): double against 4 to 6, otherwise hit.'];
  }
  if (total === 17) return [between(up, 3, 6) ? 'double' : 'hit', 'Soft 17 (A,6): double against 3 to 6, otherwise hit.'];
  if (total === 18) {
    const action = between(up, 3, 6) ? 'double' : up <= 8 ? 'stand' : 'hit';
    return [action, 'Soft 18 (A,7): double against 3 to 6, stand against 2, 7 and 8, hit against 9, 10 and ace.'];
  }
  if (total >= 19) return ['stand', 'Always stand on soft 19 or more.'];
  return undefined;
}
