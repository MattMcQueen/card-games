import type { Card, Rank, Suit } from './cards';
import { createDeck, shuffle, type RandomInt } from './deck';
import { playedText } from './names';

// What every trick-taking game (Hearts, Spades, Bridge) has in common: four players round a table, each
// playing a card to a trick in turn, with aces high. The rules about which card may be played and
// who wins a trick stay in each game.

/** Players round the table. */
export const SEATS = 4;
/** You always sit in seat 0, at the bottom of the table; the computer players sit clockwise from you. */
export const YOUR_SEAT = 0;

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14,
};

/** A card's rank as a number: 2 to 10, then 11 for a jack up to 14 for an ace (aces are high). */
export const rankValue = (card: Card): number => RANK_VALUES[card.rank];

/** A card as text, such as "QS" or "10H": the same for equal cards, so it can be a key. */
export const cardKey = (card: Card): string => card.rank + card.suit;

/** The same card, whichever object it is. */
const same = (a: Card) => (b: Card) => cardKey(a) === cardKey(b);

/** A hand sorted by suit, in `suitOrder`, then by rank. */
export function sortHand(cards: readonly Card[], suitOrder: Record<Suit, number>): Card[] {
  return [...cards].sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit] || rankValue(a) - rankValue(b));
}

/** How much a player wants to play a card, when choosing the card it most or least wants. */
type Weigh = (card: Card) => number;

/** The card that weighs the most (by default the highest), or the least. */
export const highest = (cards: readonly Card[], weigh: Weigh = rankValue): Card =>
  cards.reduce((best, c) => (weigh(c) > weigh(best) ? c : best));
export const lowest = (cards: readonly Card[], weigh: Weigh = rankValue): Card =>
  cards.reduce((best, c) => (weigh(c) < weigh(best) ? c : best));

/** The seat after `seat`, going round to the left (clockwise). */
export const nextSeat = (seat: number): number => (seat + 1) % SEATS;

/** A card played to a trick, and who played it. */
export interface Play {
  readonly seat: number;
  readonly card: Card;
}

/** What every player at a trick-taking table has. */
export interface Seat {
  readonly id: number;
  readonly name: string;
  readonly human: boolean;
  /** The cards in hand, sorted by suit and then rank. */
  readonly hand: readonly Card[];
}

/** A fresh shuffled deck dealt one card at a time, starting with the player on the `dealer`'s left: each seat's hand. */
export function dealHands(dealer: number, randomInt: RandomInt): Card[][] {
  const deck = shuffle(createDeck(), randomInt);
  return Array.from({ length: SEATS }, (_, seat) => deck.filter((_, i) => i % SEATS === (seat - dealer - 1 + SEATS * 2) % SEATS));
}

/** The four players at the start of a game: you, then the computer players `bots` clockwise from your left. */
export function seatPlayers(bots: readonly { readonly name: string }[]): Seat[] {
  return Array.from({ length: SEATS }, (_, id) => ({
    id,
    name: id === YOUR_SEAT ? 'You' : (bots[id - 1]?.name ?? `Player ${id}`),
    human: id === YOUR_SEAT,
    hand: [],
  }));
}

/** The hand of `seat`, if it is their turn to play a card; null if it is not. */
export function handToPlay(state: { readonly phase: string; readonly toPlay: number; readonly players: readonly Seat[] }, seat: number): readonly Card[] | null {
  return state.phase === 'playing' && seat === state.toPlay ? (state.players[seat]?.hand ?? []) : null;
}

/** The cards of `hand` in the suit led, if it has any, which it must play; otherwise all of them. */
export function following(hand: readonly Card[], led: Suit): Card[] {
  const suited = hand.filter((c) => c.suit === led);
  return suited.length > 0 ? suited : [...hand];
}

/** The parts of a game's state a card being played changes. */
interface Table<P extends Seat> {
  readonly players: readonly P[];
  readonly trick: readonly Play[];
  readonly toPlay: number;
}

/**
 * The player whose turn it is plays `card`, which must be one of the `legal` cards: it leaves their hand
 * and joins the trick. The game then says what follows, such as whose turn it is.
 */
export function addToTrick<P extends Seat>(state: Table<P>, card: Card, legal: readonly Card[]): { players: P[]; trick: Play[] } {
  const seat = state.toPlay;
  if (!legal.some(same(card))) throw new Error(`${state.players[seat]?.name ?? 'Nobody'} may not play ${cardKey(card)} now`);
  const players = state.players.map((p) => (p.id === seat ? { ...p, hand: p.hand.filter((c) => !same(card)(c)) } : p));
  return { players, trick: [...state.trick, { seat, card }] };
}

/**
 * The winner of the complete trick takes it, and leads the next: `give` hands the trick to them (a game keeps
 * a count of tricks, or the cards). The game then adds what else follows, such as scoring the hand.
 */
export function takeTrick<P extends Seat>(
  state: { readonly phase: string; readonly players: readonly P[]; readonly winner: number },
  give: (player: P) => P,
) {
  if (state.phase !== 'collecting') throw new Error('No trick to collect');
  return {
    phase: 'playing' as const,
    players: state.players.map((p) => (p.id === state.winner ? give(p) : p)),
    trick: [] as Play[],
    toPlay: state.winner,
    winner: -1,
  };
}

/** A computer player of this `skill` (0 to 1) makes a careless move this time: a less skilled one more often. */
const isCareless = (skill: number, random: () => number): boolean => random() < (1 - skill) * 0.6;

/**
 * The skill of each computer player in `bots` (from seat 1, on your left), from 0 to 1, and whether it plays
 * carelessly this time: a less skilled player more often makes a careless move instead of a thought-out one.
 */
export function botSkills(bots: readonly { readonly skill: number }[]) {
  const skillOf = (seat: number): number => bots[seat - 1]?.skill ?? 1;
  return { skillOf, careless: (seat: number, random: () => number): boolean => isCareless(skillOf(seat), random) };
}

/**
 * The first move of a computer player's turn: the only card it may play, or (a less skilled player more
 * often) a careless one, any it may play. Undefined when it should think it over.
 */
export function quickCard(legal: readonly Card[], skill: number, random: () => number): Card | undefined {
  if (legal.length === 0) throw new Error('No card to play');
  if (legal.length === 1) return legal[0];
  if (isCareless(skill, random)) return legal[Math.floor(random() * legal.length)];
  return undefined;
}

/** What a game says about the hand being played, in its own words. */
export interface TableTexts {
  /** Who is taking the complete trick. */
  taking: () => string;
  /** What you may do on your turn. */
  yourTurn: () => string;
  /** Who it is waiting for. */
  waiting: () => string;
  /** How the hand went, once it is over. */
  settled: () => string;
}

/** What the texts below need of a game's state. */
interface Said {
  readonly phase: string;
  readonly toPlay: number;
  readonly players: readonly Seat[];
  readonly trick: readonly Play[];
}

/** The line under the table while a hand is played: who is taking the trick, your prompt, or who it is waiting for. */
export function tableNote(state: Said, say: TableTexts): string {
  if (state.phase === 'collecting') return say.taking();
  return state.toPlay === YOUR_SEAT ? say.yourTurn() : say.waiting();
}

/** What screen readers hear: who took a trick, the hand's result, or the latest card played (and your prompt on your turn). */
export function tableAnnouncement(state: Said, yourTurn: boolean, say: TableTexts): string {
  if (state.phase === 'collecting') return say.taking();
  if (state.phase === 'settled') return say.settled();
  const last = state.trick.at(-1);
  const played = last ? playedText(state.players[last.seat], last.card) : '';
  return yourTurn ? `${played}${say.yourTurn()}` : played;
}
