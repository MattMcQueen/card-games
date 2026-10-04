import { botSkills, cardKey, createDeck, quickCard } from '@card-games/cards-core';
import { BOT, BOT_SEAT, DISCARDS, MAX_COUNT } from './constants';
import { legalCards } from './game';
import { choose, fifteens, pairs, pegPoints, peggingScores, pipValue, quickCount, runRank } from './scoring';
import type { Card, GameState } from './types';

// The computer player. It only sees what a real player would: its own cards, the starter once it is cut, and the
// cards played.

const { careless, skillOf } = botSkills([BOT]);

/** The best of `items` by `weigh`; the first of equals. */
const best = <T>(items: readonly T[], weigh: (item: T) => number): T =>
  items.reduce((top, item) => (weigh(item) > weigh(top) ? item : top));

/**
 * Roughly what two cards are worth to a crib, before the other two and the starter are known: what they score
 * together, and a little for fives (which make fifteens with every ten-card) and for cards close enough to make runs.
 */
export function cribValue(cards: readonly Card[]): number {
  const [a, b] = cards as [Card, Card];
  const gap = Math.abs(runRank(a) - runRank(b));
  const together = [...fifteens(cards), ...pairs(cards)].reduce((sum, c) => sum + c.points, 0);
  const fives = cards.filter((c) => c.rank === '5').length;
  return together + fives * 1.5 + (gap === 1 ? 1 : gap === 2 ? 0.5 : 0);
}

/** What four kept cards score on average, over every starter that could be cut from the cards `unseen`. */
function expectedHand(kept: readonly Card[], unseen: readonly Card[]): number {
  return unseen.reduce((sum, starter) => sum + quickCount(kept, starter), 0) / unseen.length;
}

/**
 * The cards `seat` puts in the crib: the two that leave the best hand on average over every possible starter, with
 * what they add to the crib counted for it when it is its own crib and against it when it is the other player's.
 * A careless choice thinks only of its hand.
 */
export function chooseDiscard(state: GameState, seat = BOT_SEAT, random: () => number = Math.random): Card[] {
  const hand = state.players[seat]!.hand;
  const held = new Set(hand.map(cardKey));
  const unseen = createDeck().filter((c) => !held.has(cardKey(c)));
  const sign = careless(seat, random) ? 0 : state.dealer === seat ? 1 : -1;
  const options = choose(hand, DISCARDS).map((out) => ({ out, kept: hand.filter((c) => !out.includes(c)) }));
  return best(options, ({ out, kept }) => expectedHand(kept, unseen) + sign * cribValue(out)).out;
}

/** What leaving the count at `count` may give away: any of the sixteen ten-cards makes 15 from 5 or 31 from 21. */
function countRisk(count: number): number {
  if (count === 5 || count === 21) return 2;
  // From most other counts under 15 or 31, some card makes it.
  return (count > 5 && count < 15) || (count > 21 && count < MAX_COUNT) ? 0.5 : 0;
}

/** What playing `card` after `last` may give away: a pair invites three of a kind, and a near card a run. */
function matchRisk(last: Card | undefined, card: Card): number {
  if (!last) return 0;
  if (last.rank === card.rank) return 1.2;
  return Math.abs(runRank(last) - runRank(card)) <= 2 ? 0.7 : 0;
}

/**
 * How much the computer player wants to play `card` now: the points it pegs, less a guess at what it gives the
 * other player the chance to peg in reply.
 */
function weighPlay(state: GameState, card: Card): number {
  const pile = state.pile.map((p) => p.card);
  const points = pegPoints(peggingScores([...pile, card]));
  // Leading a card under five means the reply cannot make fifteen.
  const lead = pile.length === 0 && pipValue(card) < 5 ? 0.6 : 0;
  // Otherwise, play higher cards first, keeping low ones to play under 31 later.
  return points - countRisk(state.count + pipValue(card)) - matchRisk(pile.at(-1), card) + lead + pipValue(card) / 100;
}

/** The card the computer player plays: one it may play, chosen by `weighPlay` (or, now and then, carelessly). */
export function decide(state: GameState, random: () => number = Math.random): Card {
  const legal = legalCards(state);
  return quickCard(legal, skillOf(state.toPlay), random) ?? best(legal, (c) => weighPlay(state, c));
}
