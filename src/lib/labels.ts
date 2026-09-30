import { HUMAN_SEAT, type ActionKind, type Card, type GameState, type LogEntry, type Rank, type Suit } from '../engine';

const RANK_NAMES: Record<Rank, string> = {
  A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', '10': 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven', '6': 'Six',
  '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two',
};
const SUIT_NAMES: Record<Suit, string> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };

export const cardName = (card: Card) => `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;

/** What a seat last did, for the label on its place: "Raise 60", "Check", "All-in 200". */
export function lastLabel(kind: ActionKind, amount: number): string {
  switch (kind) {
    case 'fold':
      return 'Fold';
    case 'check':
      return 'Check';
    case 'call':
      return `Call ${amount}`;
    case 'bet':
      return `Bet ${amount}`;
    case 'raise':
      return `Raise ${amount}`;
    case 'allin':
      return `All-in ${amount}`;
  }
}

function boardCards(entry: LogEntry, state: GameState): Card[] {
  if (entry.street === 'flop') return state.board.slice(0, 3);
  return state.board.slice(entry.street === 'turn' ? 3 : 4, entry.street === 'turn' ? 4 : 5);
}

/** A sentence for the hand history and for screen readers: "Terry raises to 60", "You fold". */
export function entryText(entry: LogEntry, state: GameState): string {
  const name = state.seats[entry.seat]?.name ?? '';
  const you = entry.seat === HUMAN_SEAT;
  // "You raise" but "Terry raises": pick the form of the verb to go with the name.
  const verb = (base: string, third: string) => `${name} ${you ? base : third}`;
  switch (entry.kind) {
    case 'small-blind':
      return `${verb('post', 'posts')} the small blind (${entry.amount})`;
    case 'big-blind':
      return `${verb('post', 'posts')} the big blind (${entry.amount})`;
    case 'fold':
      return verb('fold', 'folds');
    case 'check':
      return verb('check', 'checks');
    case 'call':
      return `${verb('call', 'calls')} ${entry.amount}`;
    case 'bet':
      return `${verb('bet', 'bets')} ${entry.amount}`;
    case 'raise':
      return `${verb('raise', 'raises')} to ${entry.amount}`;
    case 'allin':
      return `${verb('are', 'is')} all-in for ${entry.amount}`;
    case 'win':
      return `${verb('win', 'wins')} ${entry.amount}`;
    case 'board': {
      const street = entry.street[0]?.toUpperCase() + entry.street.slice(1);
      return `${street}: ${boardCards(entry, state).map(cardName).join(', ')}`;
    }
  }
}
