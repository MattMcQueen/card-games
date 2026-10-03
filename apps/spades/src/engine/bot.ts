import { botSkills, highest, lowest, quickCard } from '@card-games/cards-core';
import { BOTS, HAND_SIZE } from './constants';
import { isSpade, legalCards, rankValue, seatsOf, teamOf, winningPlay } from './game';
import type { Card, GameState, Player, Suit } from './types';

// The computer players. They only use what a player at a real table would know: their own hand, the
// bids, the tricks each player has taken and the cards played so far. Each seat has a skill from 0 to 1,
// and a less skilled player more often makes a careless move (any card it may play) instead of a thought-out one.

const SIDE_SUITS: readonly Suit[] = ['C', 'D', 'H'];

const ofSuit = (cards: readonly Card[], suit: Suit) => cards.filter((c) => c.suit === suit);
const has = (cards: readonly Card[], rank: Card['rank'], suit: Suit) => cards.some((c) => c.rank === rank && c.suit === suit);

const { skillOf, careless } = botSkills(BOTS);

/**
 * The tricks the top spades are likely to take: the rank, what it is worth with at least `guards` spades in
 * all (so it cannot be drawn out early), and what it is worth with fewer.
 */
const TOP_SPADES = [
  { rank: 'A', guards: 1, guarded: 1, bare: 1 },
  { rank: 'K', guards: 2, guarded: 1, bare: 0.4 },
  { rank: 'Q', guards: 3, guarded: 0.8, bare: 0.2 },
  { rank: 'J', guards: 4, guarded: 0.4, bare: 0 },
] as const;

/** What a void, a single card or two cards in a side suit are worth in tricks, given a spade to trump it with. */
const RUFFS = [1, 0.6, 0.25];

/** The tricks a hand's spades are likely to take: the top ones, and each beyond the third once the others have run out. */
function spadeTricks(spades: readonly Card[]): number {
  const n = spades.length;
  const top = TOP_SPADES.reduce((sum, t) => sum + (has(spades, t.rank, 'S') ? (n >= t.guards ? t.guarded : t.bare) : 0), 0);
  return top + Math.max(0, n - 3);
}

/** The tricks the high cards of a side suit are likely to take: aces and kings in a long suit are more likely to be trumped. */
function sideTricks(cards: readonly Card[], suit: Suit): number {
  const len = cards.length;
  const ace = has(cards, 'A', suit) ? (len >= 6 ? 0.6 : 1) : 0;
  const king = has(cards, 'K', suit) ? (len >= 2 && len <= 5 ? 0.75 : 0.2) : 0;
  const queen = has(cards, 'Q', suit) && len >= 3 && len <= 4 ? 0.3 : 0;
  return ace + king + queen;
}

/** The tricks a hand is likely to take: its high cards, its long spades, and spades to trump its short suits with. */
export function estimateTricks(hand: readonly Card[]): number {
  const spades = ofSuit(hand, 'S');
  // Spades not needed for length can trump suits the hand is short in.
  let spare = Math.max(0, Math.min(spades.length, 3) - 1);
  let tricks = spadeTricks(spades);
  for (const suit of SIDE_SUITS) {
    const cards = ofSuit(hand, suit);
    const ruffs = Math.min(spare, RUFFS[cards.length] ?? 0);
    tricks += sideTricks(cards, suit) + ruffs;
    spare -= Math.ceil(ruffs);
  }
  return tricks;
}

/** A hand that should be able to lose every trick: no high spades, few spades, and little else high. */
function nilWorthy(hand: readonly Card[]): boolean {
  const spades = ofSuit(hand, 'S');
  if (spades.length > 3 || spades.some((c) => rankValue(c) >= 10)) return false;
  // An unprotected high card in a short suit is likely to win a trick.
  return SIDE_SUITS.every((suit) => {
    const cards = ofSuit(hand, suit);
    const top = cards.length ? rankValue(highest(cards)) : 0;
    return top < 13 && (top < 11 || cards.length >= 4);
  });
}

/** The bid a computer player makes: what its hand looks good for, or nil for a hand that can lose every trick. */
export function chooseBid(state: GameState, random: () => number = Math.random): number {
  const seat = state.toPlay;
  const hand = state.players[seat]?.hand ?? [];
  const partner = state.players[(seat + 2) % 4];
  const estimate = estimateTricks(hand);
  if (partner?.bid !== 0 && estimate < 1.5 && nilWorthy(hand)) return 0;
  let bid = Math.max(1, Math.floor(estimate));
  if (careless(seat, random)) bid = Math.max(1, bid + (random() < 0.5 ? -1 : 1));
  return Math.min(HAND_SIZE, bid);
}

/** What a player can see of the hand from where they sit. */
interface View {
  readonly state: GameState;
  readonly seat: number;
  readonly hand: readonly Card[];
  readonly legal: readonly Card[];
  readonly me: Player;
  readonly partner: Player;
  /** This player leads the trick. */
  readonly leading: boolean;
  /** Cards neither in this hand nor played: the other three hold them. */
  readonly unseen: readonly Card[];
}

function viewOf(state: GameState): View {
  const seat = state.toPlay;
  const hand = state.players[seat]!.hand;
  const known = new Set([...hand, ...state.played, ...state.trick.map((p) => p.card)].map((c) => c.rank + c.suit));
  const unseen: Card[] = [];
  for (const suit of ['S', 'H', 'D', 'C'] as const) {
    for (const rank of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const) {
      if (!known.has(rank + suit)) unseen.push({ rank, suit });
    }
  }
  const [me, partner] = [state.players[seat]!, state.players[(seat + 2) % 4]!];
  return { state, seat, hand, legal: legalCards(state), me, partner, leading: state.trick.length === 0, unseen };
}

/** A player who bid nil and has not yet taken a trick. */
const nilAlive = (p: Player) => p.bid === 0 && p.tricks === 0;

/** No unseen card of its suit is higher, so it wins a trick led in its suit unless someone trumps it. */
const isBoss = (view: View, card: Card) => !view.unseen.some((c) => c.suit === card.suit && rankValue(c) > rankValue(card));

/** Whether `card` would be winning the trick so far if played now. */
function wouldWin(view: View, card: Card): boolean {
  return winningPlay([...view.state.trick, { seat: view.seat, card }])?.seat === view.seat;
}

/** The tricks a partnership still needs to make its bid (not counting a nil bidder's). */
function stillNeeded(state: GameState, team: number): number {
  const players = seatsOf(team).map((s) => state.players[s]!);
  const bid = players.reduce((sum, p) => sum + (p.bid ?? 0), 0);
  return bid - players.reduce((sum, p) => sum + p.tricks, 0);
}

/** Losing the trick if it can: the highest card that still loses, or if every card wins, the highest (to be rid of it). */
function duck(view: View): Card {
  const losing = view.legal.filter((c) => !wouldWin(view, c));
  if (losing.length === 0) return highest(view.legal);
  // Following suit or discarding: off-suit cards are thrown away high, and spades kept back unless nothing else loses.
  const notSpades = losing.filter((c) => !isSpade(c) || view.state.trick[0]?.card.suit === 'S');
  return highest(notSpades.length > 0 ? notSpades : losing);
}

/** Leading while trying to lose: the lowest card, preferring a suit other than spades. */
function leadLow(view: View): Card {
  const notSpades = view.legal.filter((c) => !isSpade(c));
  return lowest(notSpades.length > 0 ? notSpades : view.legal);
}

/** Leading to win tricks: a card nobody can beat in its suit, then a low card from a short side suit (to trump it later). */
function leadToWin(view: View): Card {
  const bosses = view.legal.filter((c) => isBoss(view, c));
  const sideBoss = bosses.filter((c) => !isSpade(c));
  if (sideBoss.length > 0) return highest(sideBoss);
  // Drawing out the other players' spades with the top spade.
  if (bosses.length > 0 && ofSuit(view.hand, 'S').length >= 3) return highest(bosses);
  const side = view.legal.filter((c) => !isSpade(c));
  if (side.length === 0) return lowest(view.legal);
  const length = (suit: Suit) => ofSuit(view.hand, suit).length;
  const shortest = side.reduce((best, c) => (length(c.suit) < length(best.suit) ? c : best)).suit;
  return lowest(ofSuit(side, shortest));
}

/** The partner is winning the trick with a card that will hold: the last card played, the best left, or a trump. */
function partnerHolds(view: View): boolean {
  const best = winningPlay(view.state.trick)!;
  if (best.seat !== view.partner.id || nilAlive(view.partner)) return false;
  return view.state.trick.length === 3 || isBoss(view, best.card) || isSpade(best.card);
}

/**
 * Taking the trick with one of the `winners`: as cheaply as will do when last to play, trumping, or holding the
 * best card left of the suit; otherwise with the highest, so the players still to come cannot beat it.
 */
function take(view: View, winners: readonly Card[]): Card {
  const led = view.state.trick[0]!.card.suit;
  const following = winners.filter((c) => c.suit === led);
  if (following.length === 0) return lowest(winners);
  if (view.state.trick.length === 3) return lowest(following);
  const boss = following.filter((c) => isBoss(view, c));
  return boss.length > 0 ? lowest(boss) : highest(following);
}

/** Playing to a trick to win it: cheaply if possible, and not over a partner already winning it with a good card. */
function followToWin(view: View): Card {
  if (partnerHolds(view)) return throwAway(view);
  const winners = view.legal.filter((c) => wouldWin(view, c));
  return winners.length > 0 ? take(view, winners) : throwAway(view);
}

/** A card that will not win: the lowest of the suit led, or a low card of another suit (not a spade). */
function throwAway(view: View): Card {
  const { legal, hand } = view;
  const notSpades = legal.filter((c) => !isSpade(c));
  if (notSpades.length === 0) return lowest(legal);
  // Emptying a short suit makes room to trump it later.
  const length = (suit: Suit) => ofSuit(hand, suit).length;
  return notSpades.reduce((best, c) => {
    const a = rankValue(c) + length(c.suit) * 2;
    const b = rankValue(best) + length(best.suit) * 2;
    return a < b ? c : best;
  });
}

/** Bid nil and still on track: lose every trick. */
function keepNil(view: View): Card | undefined {
  if (!nilAlive(view.me)) return undefined;
  return view.leading ? leadLow(view) : duck(view);
}

/** A partner going nil needs covering: win the tricks they might otherwise take, playing high over them. */
function coverPartner(view: View): Card | undefined {
  const { state, partner } = view;
  if (!nilAlive(partner)) return undefined;
  if (view.leading) return leadToWin(view);
  const partnerPlayed = state.trick.some((p) => p.seat === partner.id);
  if (partnerPlayed && winningPlay(state.trick)?.seat !== partner.id) return undefined;
  const winners = view.legal.filter((c) => wouldWin(view, c));
  return winners.length > 0 ? highest(winners) : undefined;
}

/** An opponent going nil is winning the trick: leave them holding it. */
function setNil(view: View): Card | undefined {
  const winning = winningPlay(view.state.trick)?.seat;
  const target = seatsOf(1 - teamOf(view.seat)).find((s) => s === winning && nilAlive(view.state.players[s]!));
  return target === undefined ? undefined : duck(view);
}

/** Win tricks while the partnership still needs them, or to stop the other side making their bid; otherwise lose them, to avoid bags. */
function playForBid(view: View): Card {
  const { state, seat } = view;
  const ours = stillNeeded(state, teamOf(seat));
  const theirs = stillNeeded(state, 1 - teamOf(seat));
  const wantTricks = ours > 0 || (theirs > 0 && theirs <= HAND_SIZE - state.tricksPlayed);
  if (view.leading) return wantTricks ? leadToWin(view) : leadLow(view);
  return wantTricks ? followToWin(view) : duck(view);
}

/** The card the computer player whose turn it is plays. */
export function decide(state: GameState, random: () => number = Math.random): Card {
  const view = viewOf(state);
  return quickCard(view.legal, skillOf(view.seat), random) ?? keepNil(view) ?? coverPartner(view) ?? setNil(view) ?? playForBid(view);
}
