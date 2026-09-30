import type { Card, HandCategory, HandRank, Rank } from './types';

const VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, J: 11, Q: 12, K: 13, A: 14,
};
const SUIT_INDEX = { S: 0, H: 1, D: 2, C: 3 } as const;

/** 2 to 14, with the ace high. */
export const rankValue = (rank: Rank): number => VALUES[rank];

const CATEGORIES: readonly HandCategory[] = [
  'high-card',
  'pair',
  'two-pair',
  'three-of-a-kind',
  'straight',
  'flush',
  'full-house',
  'four-of-a-kind',
  'straight-flush',
];

// A score packs the category and up to five ranks, four bits each, most important first:
// category (bits 20+), then the ranks that define the hand, then its kickers. Comparing two
// scores as plain numbers therefore compares the hands.
function pack(category: number, ranks: readonly number[]): number {
  let score = category << 20;
  ranks.forEach((rank, i) => (score |= rank << (16 - 4 * i)));
  return score;
}

/** The high card of the best straight in a set of ranks (bit v set for value v; the ace also sets bit 1), or 0. */
function straightHigh(mask: number): number {
  for (let high = 14; high >= 5; high--) {
    const needed = 0b11111 << (high - 4);
    if ((mask & needed) === needed) return high;
  }
  return 0;
}

/** The highest ranks with a card in `counts`, skipping `exclude`. */
function topRanks(counts: readonly number[], exclude: readonly number[], n: number): number[] {
  const found: number[] = [];
  for (let v = 14; v >= 2 && found.length < n; v--) {
    if ((counts[v] as number) > 0 && !exclude.includes(v)) found.push(v);
  }
  return found;
}

/** The value of the best five-card hand in 5 to 7 cards. */
export function evaluate(cards: readonly Card[]): number {
  const counts = new Array<number>(15).fill(0);
  const suitMask = [0, 0, 0, 0];
  const suitCount = [0, 0, 0, 0];
  let allMask = 0;
  for (const { rank, suit } of cards) {
    const v = VALUES[rank];
    const s = SUIT_INDEX[suit];
    counts[v] = (counts[v] as number) + 1;
    suitMask[s] = (suitMask[s] as number) | (1 << v);
    suitCount[s] = (suitCount[s] as number) + 1;
    allMask |= 1 << v;
  }
  if (counts[14]) {
    allMask |= 2; // an ace also plays low, in the wheel (A-2-3-4-5)
    for (let s = 0; s < 4; s++) if ((suitMask[s] as number) & (1 << 14)) suitMask[s] = (suitMask[s] as number) | 2;
  }

  let flush: number[] | null = null;
  for (let s = 0; s < 4; s++) {
    if ((suitCount[s] as number) < 5) continue;
    const mask = suitMask[s] as number;
    const high = straightHigh(mask);
    if (high) return pack(8, [high]);
    const ranks: number[] = [];
    for (let v = 14; v >= 2 && ranks.length < 5; v--) if (mask & (1 << v)) ranks.push(v);
    flush = ranks;
  }

  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  for (let v = 14; v >= 2; v--) {
    const n = counts[v] as number;
    if (n === 4) quads.push(v);
    else if (n === 3) trips.push(v);
    else if (n === 2) pairs.push(v);
  }

  const [quad] = quads;
  if (quad) return pack(7, [quad, ...topRanks(counts, [quad], 1)]);
  const [trip] = trips;
  if (trip && (trips.length > 1 || pairs.length > 0)) {
    // A second set of three plays as the pair.
    return pack(6, [trip, Math.max(trips[1] ?? 0, pairs[0] ?? 0)]);
  }
  if (flush) return pack(5, flush);
  const straight = straightHigh(allMask);
  if (straight) return pack(4, [straight]);
  if (trip) return pack(3, [trip, ...topRanks(counts, [trip], 2)]);
  const [high, low] = pairs;
  if (high && low) return pack(2, [high, low, ...topRanks(counts, [high, low], 1)]);
  if (high) return pack(1, [high, ...topRanks(counts, [high], 3)]);
  return pack(0, topRanks(counts, [], 5));
}

const SINGULAR: Record<number, string> = {
  2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten',
  11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace',
};
const PLURAL: Record<number, string> = {
  2: 'Twos', 3: 'Threes', 4: 'Fours', 5: 'Fives', 6: 'Sixes', 7: 'Sevens', 8: 'Eights', 9: 'Nines', 10: 'Tens',
  11: 'Jacks', 12: 'Queens', 13: 'Kings', 14: 'Aces',
};

export function categoryOf(score: number): HandCategory {
  return CATEGORIES[score >> 20] as HandCategory;
}

/** "Two pair, Kings and Fours", "Flush, Ace high", "Royal flush". */
export function describeScore(score: number): string {
  const a = (score >> 16) & 15;
  const b = (score >> 12) & 15;
  switch (categoryOf(score)) {
    case 'straight-flush':
      return a === 14 ? 'Royal flush' : `Straight flush, ${SINGULAR[a]} high`;
    case 'four-of-a-kind':
      return `Four of a kind, ${PLURAL[a]}`;
    case 'full-house':
      return `Full house, ${PLURAL[a]} full of ${PLURAL[b]}`;
    case 'flush':
      return `Flush, ${SINGULAR[a]} high`;
    case 'straight':
      return `Straight, ${SINGULAR[a]} high`;
    case 'three-of-a-kind':
      return `Three of a kind, ${PLURAL[a]}`;
    case 'two-pair':
      return `Two pair, ${PLURAL[a]} and ${PLURAL[b]}`;
    case 'pair':
      return `Pair of ${PLURAL[a]}`;
    default:
      return `${SINGULAR[a]} high`;
  }
}

/** Every way of choosing five of the cards. */
function fiveCardHands(cards: readonly Card[]): Card[][] {
  const hands: Card[][] = [];
  const pick = (start: number, chosen: Card[]) => {
    if (chosen.length === 5) {
      hands.push(chosen);
      return;
    }
    for (let i = start; i < cards.length; i++) pick(i + 1, [...chosen, cards[i] as Card]);
  };
  pick(0, []);
  return hands;
}

/** The best hand in 5 to 7 cards, with its name and the five cards that make it. */
export function rankHand(cards: readonly Card[]): HandRank {
  let best: Card[] = [];
  let score = -1;
  for (const hand of fiveCardHands(cards)) {
    const value = evaluate(hand);
    if (value > score) {
      score = value;
      best = hand;
    }
  }
  return { score, category: categoryOf(score), name: describeScore(score), best };
}
