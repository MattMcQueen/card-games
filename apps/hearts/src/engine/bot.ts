import { botSkills, highest, lowest, quickCard } from '@card-games/cards-core';
import { BOTS, PASS_SIZE } from './constants';
import { isQueenOfSpades, legalCards, pointsIn, rankValue, trickWinner } from './game';
import type { Card, GameState } from './types';

// The computer players. They only use what a player at a real table would know: their own hand,
// the trick in front of them and the cards played so far. Each seat has a skill from 0 to 1, and
// a less skilled player more often makes a careless move (any card it may play) instead of a thought-out one.

/** Points for how much a player wants to be rid of a card. */
type Weigh = (card: Card) => number;

const isHighSpade = (card: Card) => card.suit === 'S' && rankValue(card) > 12; // the king or ace

const { skillOf, careless } = botSkills(BOTS);

/** Every card that has been played in this hand, including the trick on the table. */
function played(state: GameState): Card[] {
  return [...state.players.flatMap((p) => p.taken), ...state.trick.map((p) => p.card)];
}

/** The queen of spades is still to come: nobody has played it and it is not in this hand. */
function queenOut(state: GameState, hand: readonly Card[]): boolean {
  return ![...played(state), ...hand].some(isQueenOfSpades);
}

/** How badly a player wants to pass a card on: the queen and high spades unless well guarded, high hearts, and short suits. */
function passWeight(hand: readonly Card[]): Weigh {
  const guards = hand.filter((c) => c.suit === 'S' && rankValue(c) < 12).length;
  const count = (suit: Card['suit']) => hand.filter((c) => c.suit === suit).length;
  return (card) => {
    const value = rankValue(card);
    if (isQueenOfSpades(card) || isHighSpade(card)) return guards >= 3 ? value - 10 : 40 + value;
    if (card.suit === 'H') return 10 + value * 2;
    if (card.suit === 'S') return value - 10; // low spades guard against the queen: keep them
    // A short club or diamond suit is worth emptying, so the player can throw away points later.
    return value + Math.max(0, 4 - count(card.suit)) * 4;
  };
}

/** The cards a computer player passes on. */
export function choosePass(state: GameState, seat: number, random: () => number = Math.random): Card[] {
  const hand = [...(state.players[seat]?.hand ?? [])];
  const weigh = passWeight(hand);
  const picks: Card[] = [];
  for (let i = 0; i < PASS_SIZE; i++) {
    const pool = hand.filter((c) => !picks.includes(c));
    picks.push(careless(seat, random) ? (pool[Math.floor(random() * pool.length)] as Card) : highest(pool, weigh));
  }
  return picks;
}

/** Leading: a low card, not a heart if it can help it, and never a high spade while the queen is out. */
function lead(state: GameState, hand: readonly Card[], legal: readonly Card[]): Card {
  const out = queenOut(state, hand);
  const flushing = out && !hand.some(isHighSpade); // low spades can force the queen out
  return lowest(legal, (card) => {
    let weight = rankValue(card);
    if (card.suit === 'H') weight += 4;
    if (card.suit === 'S' && out && isHighSpade(card)) weight += 30;
    if (isQueenOfSpades(card)) weight += 30;
    if (card.suit === 'S' && flushing && rankValue(card) < 12) weight -= 3;
    return weight;
  });
}

/** What a player following suit can see of the trick so far. */
interface TrickView {
  /** The rank of the card winning it so far. */
  readonly best: number;
  readonly points: number;
  /** This player is the last to play to it. */
  readonly last: boolean;
}

function viewOf(state: GameState): TrickView {
  const winning = state.trick.find((p) => p.seat === trickWinner(state.trick))!;
  return { best: rankValue(winning.card), points: pointsIn(state.trick.map((p) => p.card)), last: state.trick.length === 3 };
}

/**
 * The plays that come first when following suit: dropping the queen on a king or ace of spades, and (when
 * someone is taking every point) spending a little to take a trick with points in it and stop them.
 */
function forcedFollow(following: readonly Card[], best: number, points: number, moonThreat: boolean): Card | undefined {
  const queen = following.find(isQueenOfSpades);
  if (queen && best > 12) return queen;
  const above = following.filter((c) => rankValue(c) > best);
  return moonThreat && points > 0 && above.length > 0 ? lowest(above) : undefined;
}

/**
 * Following suit: drop the queen on a king or ace of spades; otherwise play the highest card that
 * still loses, or take a pointless trick with a high card when last. If it must win, it wins with its highest card, never the queen.
 */
function follow(state: GameState, following: readonly Card[], moonThreat: boolean): Card {
  const { best, points, last } = viewOf(state);
  const queen = following.find(isQueenOfSpades);
  const forced = forcedFollow(following, best, points, moonThreat);
  if (forced) return forced;
  const notQueen = following.filter((c) => !isQueenOfSpades(c));
  const highestSafe = highest(notQueen.length > 0 ? notQueen : following);
  // Nothing can cost points: the first trick, or the last card of a trick without points (unless it would be the queen).
  if (state.tricksPlayed === 0 || (last && points === 0 && !queen)) return highestSafe;
  const below = following.filter((c) => rankValue(c) < best);
  return below.length > 0 ? highest(below) : highestSafe;
}

/** Throwing away a card of another suit: the queen first, then high spades while she is out, high hearts, then high cards of short suits. */
function discard(state: GameState, hand: readonly Card[], legal: readonly Card[]): Card {
  const out = queenOut(state, hand);
  const count = (suit: Card['suit']) => hand.filter((c) => c.suit === suit).length;
  return highest(legal, (card) => {
    if (isQueenOfSpades(card)) return 1000;
    if (out && isHighSpade(card)) return 500 + rankValue(card);
    if (card.suit === 'H') return 100 + rankValue(card);
    return rankValue(card) + (count(card.suit) <= 2 ? 8 : 0);
  });
}

/** One other player has taken every point so far, and enough of them to be heading for the moon. */
function moonThreatFor(state: GameState, seat: number): boolean {
  const scored = state.players.filter((p) => pointsIn(p.taken) > 0);
  return scored.length === 1 && scored[0]!.id !== seat && pointsIn(scored[0]!.taken) >= 10;
}

/** The card the computer player whose turn it is plays. */
export function decide(state: GameState, random: () => number = Math.random): Card {
  const seat = state.toPlay;
  const hand = state.players[seat]?.hand ?? [];
  const legal = legalCards(state);
  const quick = quickCard(legal, skillOf(seat), random);
  if (quick) return quick;
  const led = state.trick[0]?.card.suit;
  if (!led) return lead(state, hand, legal);
  const following = legal.filter((c) => c.suit === led);
  if (following.length > 0) return follow(state, following, skillOf(seat) > 0.7 && moonThreatFor(state, seat));
  return discard(state, hand, legal);
}

