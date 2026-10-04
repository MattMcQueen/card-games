import type { Rank } from '@card-games/cards-core';
import { MAX_COUNT } from './constants';
import type { Card, Combo, Count, Peg } from './types';

// How cards score, in the show and in the play. Aces are low: a run can be A-2-3 but never Q-K-A.

const ORDER: Record<Rank, number> = {
  A: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13,
};

/** A card's place in a run: an ace is 1, up to 13 for a king. */
export const runRank = (card: Card): number => ORDER[card.rank];

/** What a card adds to the count, and to a fifteen: an ace is 1, a court card 10. */
export const pipValue = (card: Card): number => Math.min(ORDER[card.rank], 10);

/** The total of some cards' values. */
const total = (cards: readonly Card[]): number => cards.reduce((sum, c) => sum + pipValue(c), 0);

/** A hand sorted for cribbage: ace to king, which is how runs read, and by suit within a rank. */
export const sortHand = (cards: readonly Card[]): Card[] =>
  [...cards].sort((a, b) => runRank(a) - runRank(b) || a.suit.localeCompare(b.suit));

/** Each set of indexes into a list of `n` items, as bit masks, by how many items are in it: worked out once per `n`. */
const masks = new Map<number, number[][]>();
function masksOf(n: number): number[][] {
  let bySize = masks.get(n);
  if (!bySize) {
    bySize = Array.from({ length: n + 1 }, () => [] as number[]);
    for (let mask = 0; mask < 1 << n; mask++) {
      let size = 0;
      for (let bit = mask; bit; bit &= bit - 1) size++;
      bySize[size]!.push(mask);
    }
    masks.set(n, bySize);
  }
  return bySize;
}

/** Every combination of `size` of the items, in their order. */
export function choose<T>(items: readonly T[], size: number): T[][] {
  return (masksOf(items.length)[size] ?? []).map((mask) => items.filter((_, i) => mask & (1 << i)));
}

/** Every combination of two or more of the cards. */
const groups = (cards: readonly Card[]): Card[][] => cards.flatMap((_, i) => (i === 0 ? [] : choose(cards, i + 1)));

/** Whether the cards are all different ranks, one after another: a run, in any order. */
function isRun(cards: readonly Card[]): boolean {
  const ranks = cards.map(runRank).sort((a, b) => a - b);
  return ranks.every((r, i) => i === 0 || r === ranks[i - 1]! + 1);
}

/** Two points for each combination of cards adding up to fifteen. */
export const fifteens = (cards: readonly Card[]): Combo[] =>
  groups(cards)
    .filter((group) => total(group) === 15)
    .map((group) => ({ kind: 'fifteen', cards: group, points: 2 }));

/** Two points for each pair of cards of the same rank: three of a kind is three pairs, four of a kind six. */
export const pairs = (cards: readonly Card[]): Combo[] =>
  choose(cards, 2)
    .filter(([a, b]) => a!.rank === b!.rank)
    .map((pair) => ({ kind: 'pair', cards: pair, points: 2 }));

/**
 * A point a card for each run of three or more: only the longest runs count, but each different one does, so
 * 3-4-4-5 is two runs of three (a double run) and 3-3-4-4-5 four.
 */
function runs(cards: readonly Card[]): Combo[] {
  for (let size = cards.length; size >= 3; size--) {
    const found = choose(cards, size).filter(isRun);
    if (found.length > 0) return found.map((run) => ({ kind: 'run', cards: sortHand(run), points: size }));
  }
  return [];
}

/**
 * Four points if the four cards of a hand are one suit, or five if the starter is too. A crib only scores a flush
 * of all five.
 */
function flush(hand: readonly Card[], starter: Card, crib: boolean): Combo[] {
  const suit = hand[0]?.suit;
  if (!hand.every((c) => c.suit === suit)) return [];
  if (starter.suit === suit) return [{ kind: 'flush', cards: [...hand, starter], points: 5 }];
  return crib ? [] : [{ kind: 'flush', cards: hand, points: 4 }];
}

/** One point for his nob: the jack of the starter's suit, in the hand. */
const nob = (hand: readonly Card[], starter: Card): Combo[] =>
  hand.filter((c) => c.rank === 'J' && c.suit === starter.suit).map((jack) => ({ kind: 'nob', cards: [jack], points: 1 }));

/** Counts a hand (or the crib) of four cards with the starter, as in the show. */
export function countHand(hand: readonly Card[], starter: Card, crib = false): Count {
  const all = [...hand, starter];
  const combos = [...fifteens(all), ...pairs(all), ...runs(all), ...flush(hand, starter, crib), ...nob(hand, starter)];
  return { combos, total: combos.reduce((sum, c) => sum + c.points, 0) };
}

/**
 * The same total as `countHand`, worked out quickly without listing the combinations: the computer player counts
 * hundreds of hands to choose its discard. Runs come from how many cards there are of each rank: in five cards
 * there can only be one stretch of three or more ranks in a row.
 */
export function quickCount(hand: readonly Card[], starter: Card, crib = false): number {
  const all = [...hand, starter];
  const extras = [...flush(hand, starter, crib), ...nob(hand, starter)];
  return fifteenPoints(all.map(pipValue)) + rankPoints(all) + extras.reduce((sum, c) => sum + c.points, 0);
}

/** Two points for each set of the card `values` adding up to 15, counted by how many ways each total can be made. */
function fifteenPoints(values: readonly number[]): number {
  const ways = new Array<number>(16).fill(0);
  ways[0] = 1;
  for (const value of values) {
    for (let sum = 15; sum >= value; sum--) ways[sum]! += ways[sum - value]!;
  }
  return ways[15]! * 2;
}

/** The points for pairs and runs, from how many cards there are of each rank. */
function rankPoints(cards: readonly Card[]): number {
  const ofRank = new Array<number>(15).fill(0);
  for (const card of cards) ofRank[runRank(card)]!++;
  let points = 0;
  let run = { length: 0, ways: 1 };
  for (const n of ofRank) {
    points += n * (n - 1); // two points a pair
    if (n > 0) {
      run = { length: run.length + 1, ways: run.ways * n };
      continue;
    }
    if (run.length >= 3) points += run.length * run.ways;
    run = { length: 0, ways: 1 };
  }
  return points;
}

/** The points for the last card of a pile of `size` cards all of one rank: a pair, pair royal or double pair royal. */
const OF_A_KIND = [0, 0, 2, 6, 12];

/**
 * What the last card played scores in the play, given the cards played since the count was last 0 (that card
 * last): fifteen or thirty-one, a pair (or three or four of a kind) with the cards just before it, and a run
 * made by it and the cards just before it, in any order.
 */
export function peggingScores(pile: readonly Card[]): Peg[] {
  const pegs: Peg[] = [];
  const count = total(pile);
  if (count === 15) pegs.push({ kind: 'fifteen', points: 2 });
  if (count === MAX_COUNT) pegs.push({ kind: 'thirtyOne', points: 2 });

  const last = pile.at(-1);
  let same = 0;
  while (last && same < pile.length && pile[pile.length - 1 - same]!.rank === last.rank) same++;
  if (same >= 2) pegs.push({ kind: 'pair', points: OF_A_KIND[same]!, size: same });

  for (let size = pile.length; size >= 3; size--) {
    if (isRun(pile.slice(-size))) {
      pegs.push({ kind: 'run', points: size, size });
      break;
    }
  }
  return pegs;
}

/** The points of some pegs added up. */
export const pegPoints = (pegs: readonly Peg[]): number => pegs.reduce((sum, p) => sum + p.points, 0);
