import {
  HUMAN_SEAT,
  hasWon,
  isGameOver,
  type ActionKind,
  type Card,
  type GameState,
  type LegalActions,
  type LogEntry,
  type LogKind,
  type Seat,
  type SeatResult,
  type Rank,
  type Suit,
} from '../engine';

const RANK_NAMES: Record<Rank, string> = {
  A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', '10': 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven', '6': 'Six',
  '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two',
};
const SUIT_NAMES: Record<Suit, string> = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };

const cardName = (card: Card) => `${RANK_NAMES[card.rank]} of ${SUIT_NAMES[card.suit]}`;

const LAST_LABELS: Record<ActionKind, (amount: number) => string> = {
  fold: () => 'Fold',
  check: () => 'Check',
  call: (amount) => `Call ${amount}`,
  bet: (amount) => `Bet ${amount}`,
  raise: (amount) => `Raise ${amount}`,
  allin: (amount) => `All-in ${amount}`,
};

/** What a seat last did, for the label on its place: "Raise 60", "Check", "All-in 200". */
export function lastLabel(kind: ActionKind, amount: number): string {
  return LAST_LABELS[kind](amount);
}

/** The line under a seat's name: what it won, or what it last did. */
export function seatStatus(seat: Seat, result: SeatResult | undefined): string {
  if (result && result.net > 0) return `+${result.net}`;
  if (seat.place !== null && seat.chips === 0) return placeName(seat.place); // out of the game
  if (seat.folded) return 'Fold';
  if (seat.last) return lastLabel(seat.last.kind, seat.last.amount);
  if (seat.allIn) return 'All-in';
  if (seat.bet > 0) return `Blind ${seat.bet}`; // a blind: the only bet made without a move
  return '';
}

/** How a log entry reads: the verb for "You" and for a named player, then what follows it. */
interface Phrase {
  readonly you: string;
  readonly other: string;
  readonly after?: (amount: number) => string;
}

const PHRASES: Record<Exclude<LogKind, 'board'>, Phrase> = {
  'small-blind': { you: 'post', other: 'posts', after: (a) => ` the small blind (${a})` },
  'big-blind': { you: 'post', other: 'posts', after: (a) => ` the big blind (${a})` },
  fold: { you: 'fold', other: 'folds' },
  check: { you: 'check', other: 'checks' },
  call: { you: 'call', other: 'calls', after: (a) => ` ${a}` },
  bet: { you: 'bet', other: 'bets', after: (a) => ` ${a}` },
  raise: { you: 'raise', other: 'raises', after: (a) => ` to ${a}` },
  allin: { you: 'are', other: 'is', after: (a) => ` all-in for ${a}` },
  win: { you: 'win', other: 'wins', after: (a) => ` ${a}` },
};

/** The cards a "board" entry dealt: the three of the flop, or the single turn or river card. */
function dealtCards(entry: LogEntry, state: GameState): Card[] {
  if (entry.street === 'flop') return state.board.slice(0, 3);
  return state.board.slice(entry.street === 'turn' ? 3 : 4, entry.street === 'turn' ? 4 : 5);
}

/** A sentence for the hand history and for screen readers: "Terry raises to 60", "You fold". */
export function entryText(entry: LogEntry, state: GameState): string {
  if (entry.kind === 'board') {
    const street = entry.street[0]?.toUpperCase() + entry.street.slice(1);
    return `${street}: ${dealtCards(entry, state).map(cardName).join(', ')}`;
  }
  const phrase = PHRASES[entry.kind];
  const name = state.seats[entry.seat]?.name ?? '';
  const verb = entry.seat === HUMAN_SEAT ? phrase.you : phrase.other;
  return `${name} ${verb}${phrase.after?.(entry.amount) ?? ''}`;
}

/** A finishing place in words: 1st, 2nd, 3rd, 4th... */
function placeName(place: number): string {
  return `${place}${['st', 'nd', 'rd'][place - 1] ?? 'th'}`;
}

/** How the game ended for you: won, or the place you finished in. */
export function gameOverText(game: GameState): string {
  if (hasWon(game)) return 'You won! Everyone else is out of chips.';
  return `Game over: you finished ${placeName(game.seats[HUMAN_SEAT]?.place ?? game.seats.length)} of ${game.seats.length}.`;
}

/** What screen readers hear: your prompt when it is your turn, how the game ended, or the latest move. */
export function announcementFor(game: GameState, legal: LegalActions, yourTurn: boolean, revealed: boolean): string {
  if (revealed && isGameOver(game)) return gameOverText(game);
  if (yourTurn) {
    return legal.canCall ? `Your turn. ${legal.toCall} to call.` : 'Your turn. You can check or bet.';
  }
  const latest = game.log.at(-1);
  return latest && (game.phase === 'action' || revealed) ? entryText(latest, game) : '';
}
