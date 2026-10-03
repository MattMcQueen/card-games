import { rankValue } from '@card-games/cards-core';
import { BOOK, HAND_SIZE, PLAYERS } from './constants';
import { DOUBLE, PASS, bid, callAllowed, cheapest, isMajor, lastBid, partnerOf, teamOf } from './game';
import type { Bid, Call, Card, GameState, Strain, Suit, Turn } from './types';

// How the computer players bid: a small natural system, the same for all of them (your partner included), and
// what they read into everyone's calls, yours too. Points are high-card points (ace 4, king 3, queen 2, jack 1)
// plus a point for each card over four in a suit. Openings: 1NT 15-17 and 2NT 20-21 balanced, 2♣ 22 or more,
// one of a suit with 12 or more (a five-card major, or the longer minor), weak twos and threes. Responses and
// overcalls are natural; a double of a suit bid low down, before your side has bid, is for takeout. After that,
// each player adds up what the partnership has, finds a fit of eight cards, and bids to the level it is worth.

const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];
const MAJORS: readonly Suit[] = ['S', 'H'];
/** Points between both hands for a game, a small slam and a grand slam, and to invite a game. */
const GAME = 25;
const INVITE = 23;
const SMALL_SLAM = 33;
const GRAND_SLAM = 37;
/** All the high-card points in the deck. */
const DECK_POINTS = 40;

/** What a player knows of their own hand. */
export interface Hand {
  readonly cards: readonly Card[];
  readonly hcp: number;
  /** High-card points plus a point for each card over four in a suit. */
  readonly pts: number;
  readonly len: Record<Suit, number>;
  /** No void or single card, and at most one doubleton. */
  readonly balanced: boolean;
}

const HCP: Partial<Record<Card['rank'], number>> = { A: 4, K: 3, Q: 2, J: 1 };

export function evaluate(cards: readonly Card[]): Hand {
  const len = { S: 0, H: 0, D: 0, C: 0 };
  for (const c of cards) len[c.suit]++;
  const hcp = cards.reduce((sum, c) => sum + (HCP[c.rank] ?? 0), 0);
  const lengths = Object.values(len);
  const balanced = lengths.every((n) => n >= 2) && lengths.filter((n) => n === 2).length <= 1;
  return { cards, hcp, pts: hcp + lengths.reduce((sum, n) => sum + Math.max(0, n - 4), 0), len, balanced };
}

/** The ace, king, queen, jack and ten held in a suit. */
const quality = (hand: Hand, suit: Suit) => hand.cards.filter((c) => c.suit === suit && rankValue(c) >= 10).length;

/** A suit the other side cannot run: the ace, the king and one more, the queen and two more, or the jack and three. */
function stopped(hand: Hand, suit: Suit): boolean {
  const n = hand.len[suit];
  const has = (rank: Card['rank']) => hand.cards.some((c) => c.suit === suit && c.rank === rank);
  return has('A') || (has('K') && n >= 2) || (has('Q') && n >= 3) || (has('J') && n >= 4);
}

/** Points for short suits, for a hand that will be the dummy with a fit: void 3, single card 2, doubleton 1. */
const shortness = (hand: Hand, trumps: Suit) =>
  SUITS.filter((s) => s !== trumps).reduce((sum, s) => sum + Math.max(0, 3 - hand.len[s]), 0);

/** Points counted with a trump fit: the shortness of the hand with fewer trumps, or the length of the one with more. */
const supportPoints = (hand: Hand, trumps: Suit) => hand.hcp + Math.max(shortness(hand, trumps), hand.pts - hand.hcp);

/** What everyone at the table can tell about a player's hand from their calls. */
export interface Picture {
  readonly min: number;
  readonly max: number;
  /** The fewest cards they have shown in each suit. */
  readonly len: Record<Suit, number>;
  readonly balanced: boolean;
}

const unknown = (): Picture => ({ min: 0, max: DECK_POINTS, len: { S: 0, H: 0, D: 0, C: 0 }, balanced: false });

/** What one call says, added to what was known. */
interface Shows {
  readonly min?: number;
  readonly max?: number;
  readonly len?: Partial<Record<Suit, number>>;
  readonly balanced?: boolean;
}

function learn(p: Picture, s: Shows): Picture {
  const min = Math.max(p.min, s.min ?? 0);
  const max = Math.max(min, Math.min(p.max, s.max ?? DECK_POINTS));
  const len = { ...p.len };
  for (const suit of SUITS) len[suit] = Math.max(len[suit], s.len?.[suit] ?? 0);
  return { min, max, len, balanced: p.balanced || (s.balanced ?? false) };
}

/** A best guess at a player's points from their picture: the bottom of the range, and a little more if it is wide. */
const estimate = (p: Picture) => p.min + Math.min((p.max - p.min) / 2, 0.5);

/** One meaning a call can have in a situation: the call, what it shows, and the hands that make it. */
interface Option {
  readonly call: Call;
  readonly shows: Shows;
  readonly when: (hand: Hand) => boolean;
}

/** The auction so far, from where the player about to call sits. */
interface Ctx {
  readonly auction: readonly Turn[];
  readonly seat: number;
  readonly partner: number;
  readonly pictures: readonly Picture[];
}

const within = (n: number, lo: number, hi: number) => n >= lo && n <= hi;
const isOpponent = (ctx: Ctx, seat: number) => teamOf(seat) !== teamOf(ctx.seat);
const actions = (ctx: Ctx, seat: number) => ctx.auction.filter((t) => t.seat === seat && t.call.kind !== 'pass');

/** The suits the other side has bid. */
const theirSuits = (ctx: Ctx): Suit[] =>
  SUITS.filter((s) => ctx.auction.some((t) => isOpponent(ctx, t.seat) && t.call.kind === 'bid' && t.call.strain === s));

/** The lowest legal bid in `strain`, `jump` levels higher, if it can be made. */
function at(ctx: Ctx, strain: Strain, jump = 0): Bid | null {
  const low = cheapest(ctx.auction, strain);
  if (!low) return null;
  const b = bid(low.level + jump, strain);
  return callAllowed(ctx.auction, ctx.seat, b) ? b : null;
}

/** An option, if its call can be made now. */
function opt(ctx: Ctx, call: Call | null, shows: Shows, when: (hand: Hand) => boolean): Option[] {
  return call && callAllowed(ctx.auction, ctx.seat, call) ? [{ call, shows, when }] : [];
}

/** The suit among `suits` a hand would rather bid: the longest, the higher of two five-card suits, the lower of two fours. */
function favourite(hand: Hand, suits: readonly Suit[], minLen: number): Suit | null {
  const score = (s: Suit) => hand.len[s] * 10 + (hand.len[s] >= 5 ? -SUITS.indexOf(s) : SUITS.indexOf(s));
  const long = suits.filter((s) => hand.len[s] >= minLen);
  return long.length === 0 ? null : long.reduce((a, b) => (score(b) > score(a) ? b : a));
}

// --- Opening the bidding ---

/** Opens one of a suit: 12 or more, or 10 with the two longest suits making 20 or more (the rule of 20). */
function opensOne(hand: Hand): boolean {
  const [a, b] = Object.values(hand.len).sort((x, y) => y - x);
  return hand.hcp >= 12 || (hand.hcp >= 10 && hand.hcp + a! + b! >= 20);
}

/** The suit to open: a five-card major (spades with two), otherwise the longer minor (diamonds with two fours). */
function openingSuit(hand: Hand): Suit {
  const { S, H, D, C } = hand.len;
  if (S >= 5 || H >= 5) return S >= H ? 'S' : 'H';
  return D > C || (D === C && D >= 4) ? 'D' : 'C';
}

const OPENING_LENGTH: Record<Suit, number> = { S: 5, H: 5, D: 4, C: 3 };

function opening(ctx: Ctx): Option[] {
  return [
    ...opt(ctx, bid(2, 'C'), { min: 22 }, (h) => h.hcp >= 22),
    ...opt(ctx, bid(2, 'NT'), { min: 20, max: 21, balanced: true }, (h) => h.balanced && within(h.hcp, 20, 21)),
    ...opt(ctx, bid(1, 'NT'), { min: 15, max: 17, balanced: true }, (h) => h.balanced && within(h.hcp, 15, 17)),
    ...SUITS.flatMap((s) => opt(ctx, bid(1, s), { min: 12, max: 21, len: { [s]: OPENING_LENGTH[s] } }, (h) => opensOne(h) && openingSuit(h) === s)),
    ...(['S', 'H', 'D'] as const).flatMap((s) =>
      opt(ctx, bid(2, s), { min: 5, max: 10, len: { [s]: 6 } }, (h) => within(h.hcp, 5, 10) && h.len[s] === 6 && quality(h, s) >= 2),
    ),
    ...SUITS.flatMap((s) => opt(ctx, bid(3, s), { min: 5, max: 10, len: { [s]: 7 } }, (h) => within(h.hcp, 5, 10) && h.len[s] >= 7)),
    ...opt(ctx, PASS, { max: 12 }, () => true),
  ];
}

// --- Responding to partner's opening ---

/** Responses to one of a suit: raise with a fit, a new suit, no trumps, or pass with less than 6. */
function respondToSuit(ctx: Ctx, x: Suit, interfered: boolean): Option[] {
  const fitLen = isMajor(x) ? 3 : x === 'D' ? 4 : 5;
  const fit = (h: Hand) => h.len[x] >= fitLen;
  const sp = (h: Hand) => supportPoints(h, x);
  const others = SUITS.filter((s) => s !== x);
  const levelOne = others.filter((s) => at(ctx, s)?.level === 1);
  const levelTwo = others.filter((s) => at(ctx, s)?.level === 2);
  const twoLength = (s: Suit) => (isMajor(s) ? 5 : 4);
  return [
    ...(isMajor(x) ? opt(ctx, bid(4, x), { min: 13, max: 18, len: { [x]: 3 } }, (h) => fit(h) && sp(h) >= 13) : []),
    ...opt(ctx, bid(3, x), { min: 10, max: 12, len: { [x]: fitLen } }, (h) => fit(h) && within(sp(h), 10, 12)),
    ...(isMajor(x) ? opt(ctx, bid(2, x), { min: 6, max: 9, len: { [x]: 3 } }, (h) => fit(h) && within(sp(h), 6, 9)) : []),
    ...levelOne.flatMap((s) => opt(ctx, bid(1, s), { min: 6, max: 18, len: { [s]: 4 } }, (h) => h.pts >= 6 && favourite(h, levelOne, 4) === s)),
    ...levelTwo.flatMap((s) =>
      opt(ctx, bid(2, s), { min: 11, max: 18, len: { [s]: twoLength(s) } }, (h) => h.pts >= 11 && favourite(h, levelTwo.filter((t) => h.len[t] >= twoLength(t)), 1) === s),
    ),
    ...opt(ctx, bid(3, 'NT'), { min: 13, max: 15, balanced: true }, (h) => h.balanced && within(h.pts, 13, 15)),
    ...opt(ctx, bid(2, 'NT'), { min: 11, max: 12, balanced: true }, (h) => h.balanced && within(h.pts, 11, 12)),
    ...(isMajor(x) ? [] : opt(ctx, bid(2, x), { min: 6, max: 9, len: { [x]: fitLen } }, (h) => fit(h) && within(sp(h), 6, 9))),
    ...opt(ctx, bid(1, 'NT'), { min: 6, max: 10 }, (h) => within(h.pts, 6, 10)),
    ...opt(ctx, PASS, { max: interfered ? 9 : 5 }, (h) => h.pts < 6 || (interfered && h.pts <= 9)),
  ];
}

/** Responses to 1NT (or a 1NT overcall): natural, with a long major, or to the right level of no trumps. */
function respondToNoTrumps(ctx: Ctx): Option[] {
  return [
    ...MAJORS.flatMap((m) => opt(ctx, bid(4, m), { min: 10, max: 15, len: { [m]: 6 } }, (h) => h.len[m] >= 6 && within(h.pts, 10, 15))),
    ...MAJORS.flatMap((m) => opt(ctx, bid(3, m), { min: 10, len: { [m]: 5 } }, (h) => h.len[m] >= 5 && h.pts >= 10 && favourite(h, MAJORS, 5) === m)),
    ...opt(ctx, bid(7, 'NT'), { min: 21 }, (h) => h.pts >= 21),
    ...opt(ctx, bid(6, 'NT'), { min: 17, max: 20 }, (h) => h.pts >= 17),
    ...opt(ctx, bid(3, 'NT'), { min: 10, max: 16 }, (h) => within(h.pts, 10, 16)),
    ...MAJORS.flatMap((m) => opt(ctx, bid(2, m), { max: 7, len: { [m]: 5 } }, (h) => h.len[m] >= 5 && h.pts <= 7 && favourite(h, MAJORS, 5) === m)),
    ...opt(ctx, bid(2, 'NT'), { min: 8, max: 9 }, (h) => within(h.pts, 8, 9)),
    ...opt(ctx, PASS, { max: 7 }, () => true),
  ];
}

function respondToTwoNoTrumps(ctx: Ctx): Option[] {
  return [
    ...opt(ctx, bid(6, 'NT'), { min: 12 }, (h) => h.pts >= 12),
    ...MAJORS.flatMap((m) => opt(ctx, bid(3, m), { min: 5, len: { [m]: 5 } }, (h) => h.len[m] >= 5 && h.pts >= 5 && favourite(h, MAJORS, 5) === m)),
    ...opt(ctx, bid(3, 'NT'), { min: 5, max: 11 }, (h) => h.pts >= 5),
    ...opt(ctx, PASS, { max: 4 }, () => true),
  ];
}

/** Responses to 2♣ (22 or more): a good five-card suit or 2NT with 8 or more, otherwise 2♦, which says nothing about diamonds. */
function respondToTwoClubs(ctx: Ctx): Option[] {
  return [
    ...(['H', 'S', 'C', 'D'] as const).flatMap((s) =>
      opt(ctx, at(ctx, s), { min: 8, len: { [s]: 5 } }, (h) => h.pts >= 8 && h.len[s] >= 5 && quality(h, s) >= 2 && favourite(h, SUITS, 5) === s),
    ),
    ...opt(ctx, bid(2, 'NT'), { min: 8, balanced: true }, (h) => h.pts >= 8 && h.balanced),
    ...opt(ctx, bid(2, 'D'), { max: 7 }, () => true),
  ];
}

// --- When the other side opened ---

function overcall(ctx: Ctx): Option[] {
  const theirs = theirSuits(ctx);
  const ours = SUITS.filter((s) => !theirs.includes(s));
  const last = lastBid(ctx.auction)!.bid;
  const levelOf = (s: Suit) => at(ctx, s)?.level ?? 99;
  const longSuits = (h: Hand) => ours.filter((s) => h.len[s] >= 5 && (quality(h, s) >= 2 || h.len[s] >= 6) && levelOf(s) <= 2);
  return [
    ...opt(ctx, at(ctx, 'NT')?.level === 1 ? bid(1, 'NT') : null, { min: 15, max: 18, balanced: true }, (h) => h.balanced && within(h.hcp, 15, 18) && theirs.every((s) => stopped(h, s))),
    ...ours.flatMap((s) => {
      const lowest = levelOf(s) === 1 ? 8 : 11;
      return opt(ctx, at(ctx, s), { min: lowest, max: 16, len: { [s]: 5 } }, (h) => within(h.hcp, lowest, 16) && favourite(h, longSuits(h), 5) === s);
    }),
    ...(last.strain !== 'NT' && last.level <= 3
      ? opt(ctx, DOUBLE, { min: 12, len: Object.fromEntries(ours.map((s) => [s, 3])) }, (h) => h.hcp >= 12 && theirs.every((s) => h.len[s] <= 2) && ours.every((s) => h.len[s] >= 3))
      : []),
    ...opt(ctx, PASS, { max: 15 }, () => true),
  ];
}

/** Answering partner's takeout double: the best suit they asked for, jumping with 9 to 11, or a game with 12 or more. */
function advanceDouble(ctx: Ctx): Option[] {
  const theirs = theirSuits(ctx);
  const unbid = SUITS.filter((s) => !theirs.includes(s));
  const best = (h: Hand) => favourite(h, unbid.filter((s) => isMajor(s) && h.len[s] >= 4), 4) ?? favourite(h, unbid, 0);
  const rhoActed = ctx.auction.at(-1)?.call.kind !== 'pass';
  if (rhoActed) {
    return [
      ...unbid.flatMap((s) => opt(ctx, at(ctx, s), { min: 6, len: { [s]: 5 } }, (h) => h.pts >= 6 && h.len[s] >= 5 && best(h) === s)),
      ...opt(ctx, PASS, {}, () => true),
    ];
  }
  return [
    ...opt(ctx, bid(3, 'NT'), { min: 12 }, (h) => h.pts >= 12 && theirs.every((s) => stopped(h, s)) && !unbid.some((s) => isMajor(s) && h.len[s] >= 4)),
    ...MAJORS.filter((m) => unbid.includes(m)).flatMap((m) => opt(ctx, bid(4, m), { min: 12, len: { [m]: 4 } }, (h) => h.pts >= 12 && h.len[m] >= 4 && best(h) === m)),
    ...unbid.flatMap((s) => opt(ctx, at(ctx, s, 1), { min: 9, max: 11, len: { [s]: 4 } }, (h) => h.pts >= 9 && best(h) === s)),
    ...unbid.flatMap((s) => opt(ctx, at(ctx, s), { max: 8, len: { [s]: 4 } }, (h) => best(h) === s)),
  ];
}

/** Answering partner's overcall in suit `x`: raise with three or more, bid a good suit of your own, or no trumps. */
function advanceOvercall(ctx: Ctx, x: Suit): Option[] {
  const theirs = theirSuits(ctx);
  const fit = (h: Hand) => h.len[x] >= 3;
  const sp = (h: Hand) => supportPoints(h, x);
  const own = SUITS.filter((s) => s !== x && !theirs.includes(s));
  const lowNt = at(ctx, 'NT');
  return [
    ...(isMajor(x) ? opt(ctx, bid(4, x), { min: 13, len: { [x]: 3 } }, (h) => fit(h) && sp(h) >= 13) : []),
    ...opt(ctx, at(ctx, x, 1), { min: 10, max: 12, len: { [x]: 3 } }, (h) => fit(h) && within(sp(h), 10, 12)),
    ...opt(ctx, at(ctx, x), { min: 6, max: 9, len: { [x]: 3 } }, (h) => fit(h) && within(sp(h), 6, 9) && (at(ctx, x)?.level ?? 9) <= 3),
    ...own.flatMap((s) =>
      opt(ctx, at(ctx, s), { min: 8, len: { [s]: 5 } }, (h) => h.pts >= 8 && (at(ctx, s)?.level ?? 9) <= 2 && favourite(h, own.filter((t) => quality(h, t) >= 2), 5) === s),
    ),
    ...opt(ctx, lowNt && lowNt.level <= 2 ? lowNt : null, { min: 8, max: 11 }, (h) => within(h.pts, 8, 11) && theirs.every((s) => stopped(h, s))),
    ...opt(ctx, bid(3, 'NT'), { min: 12 }, (h) => h.pts >= 12 && theirs.every((s) => stopped(h, s))),
    ...opt(ctx, PASS, { max: 9 }, () => true),
  ];
}

/** Answers to partner's opening `first`, before you have made a call of your own. */
function partnerOpened(ctx: Ctx, first: Turn & { call: Bid }): Option[] | null {
  const { level, strain } = first.call;
  const interfered = ctx.auction.slice(ctx.auction.indexOf(first) + 1).some((t) => t.call.kind !== 'pass');
  if (level === 1 && strain !== 'NT') return respondToSuit(ctx, strain, interfered);
  if (interfered || level > 2) return null;
  if (level === 1) return respondToNoTrumps(ctx);
  if (strain === 'NT') return respondToTwoNoTrumps(ctx);
  return strain === 'C' ? respondToTwoClubs(ctx) : null;
}

/** After the other side opened: an overcall, or an answer to partner's one call. */
function theyOpened(ctx: Ctx, partners: readonly Turn[]): Option[] | null {
  if (partners.length === 0) return overcall(ctx);
  const [only] = partners;
  if (partners.length > 1 || !only) return null;
  const call = only.call;
  if (call.kind === 'double') {
    // A double of 1NT, or of a bid at the four level or higher, is for penalties: it is left in.
    const doubled = lastBid(ctx.auction.slice(0, ctx.auction.indexOf(only)))!.bid;
    return doubled.strain === 'NT' || doubled.level > 3 ? opt(ctx, PASS, {}, () => true) : advanceDouble(ctx);
  }
  if (call.kind !== 'bid') return null;
  return call.strain === 'NT' ? respondToNoTrumps(ctx) : advanceOvercall(ctx, call.strain);
}

/** The calls with set meanings in this situation, or null when the players are on their own (see `plan`). */
function situation(ctx: Ctx): Option[] | null {
  const first = ctx.auction.find((t): t is Turn & { call: Bid } => t.call.kind === 'bid');
  if (!first) return opening(ctx);
  if (actions(ctx, ctx.seat).length > 0) return null;
  const partners = actions(ctx, ctx.partner);
  if (first.seat === ctx.partner) return partners.length > 1 ? null : partnerOpened(ctx, first);
  return isOpponent(ctx, first.seat) ? theyOpened(ctx, partners) : null;
}

// --- After the first round: adding up the partnership's points and placing the contract ---

/** The level of a game in each strain: 3NT, four of a major, five of a minor. */
const gameLevel = (strain: Strain) => (strain === 'NT' ? 3 : isMajor(strain) ? 4 : 5);

/** What the partnership is worth in points, and its best trump fit: eight cards or more, majors first. */
function partnership(ctx: Ctx, hand: Hand) {
  const partner = ctx.pictures[ctx.partner]!;
  const fits = SUITS.filter((s) => hand.len[s] + partner.len[s] >= 8);
  const fitLength = (s: Suit) => hand.len[s] + partner.len[s];
  const fit = fits.length === 0 ? null : fits.reduce((a, b) => (isMajor(b) !== isMajor(a) ? (isMajor(b) ? b : a) : fitLength(b) > fitLength(a) ? b : a));
  const mine = fit ? supportPoints(hand, fit) : hand.pts;
  // Slams are bid on what partner is known to have at least, not on a guess.
  return { partner, fit, fitLength: fit ? fitLength(fit) : 0, total: mine + estimate(partner), sure: mine + partner.min };
}

/** The contract worth aiming for with `total` points between the two hands, in `strain`. */
function targetLevel(total: number, sure: number, strain: Strain, fitLength: number): number {
  if (sure >= GRAND_SLAM) return 7;
  if (sure >= SMALL_SLAM) return 6;
  if (total >= GAME + (strain === 'C' || strain === 'D' ? 3 : 0)) return gameLevel(strain);
  if (total >= INVITE) return strain === 'NT' ? 2 : 3;
  // A part score: as high as the number of trumps between the hands allows (eight trumps, the two level).
  return strain === 'NT' ? 1 : Math.max(2, fitLength - BOOK);
}

/** Partner's last bid was a new suit below game, which asks for another call. */
function forced(ctx: Ctx): boolean {
  const last = ctx.auction.at(-2);
  if (!last || last.seat !== ctx.partner || last.call.kind !== 'bid' || ctx.auction.at(-1)?.call.kind !== 'pass') return false;
  const { strain, level } = last.call;
  if (strain === 'NT' || level >= gameLevel(strain)) return false;
  const before = ctx.auction.slice(0, -2);
  const shownBefore = before.some((t) => !isOpponent(ctx, t.seat) && t.call.kind === 'bid' && t.call.strain === strain);
  return !shownBefore && ctx.pictures[ctx.partner]!.max > 9;
}

/** A penalty double: the other side has bid past what the partnership wanted, holding most of the points. */
function penaltyDouble(ctx: Ctx, total: number): Call | null {
  const last = lastBid(ctx.auction)!;
  if (!isOpponent(ctx, last.seat) || !callAllowed(ctx.auction, ctx.seat, DOUBLE)) return null;
  const weBid = ctx.auction.some((t) => !isOpponent(ctx, t.seat) && t.call.kind === 'bid');
  const defence = (total / DECK_POINTS) * HAND_SIZE;
  return weBid && total >= INVITE && defence >= HAND_SIZE - BOOK - last.bid.level + 2 ? DOUBLE : null;
}

/** The suits a player has shown four or more cards in. */
const shownSuits = (p: Picture) => SUITS.filter((s) => p.len[s] >= 4);

/** A new suit, the cheapest, of four cards at the one level or five higher up, below 3NT. */
function newSuit(ctx: Ctx, hand: Hand, fresh: readonly Suit[]): Bid | null {
  const best = favourite(hand, fresh, 4);
  const b = best ? at(ctx, best) : null;
  if (!best || !b || b.level > 3) return null;
  return hand.len[best] >= (b.level === 1 ? 4 : 5) ? b : null;
}

/** No trumps, with the other side's suits stopped: 3NT with the values for game, otherwise the cheapest. */
function noTrumpsBid(ctx: Ctx, hand: Hand, total: number): Bid | null {
  if (!theirSuits(ctx).every((s) => stopped(hand, s))) return null;
  const nt = total >= GAME ? bid(3, 'NT') : at(ctx, 'NT');
  return nt && callAllowed(ctx.auction, ctx.seat, nt) && nt.level <= 3 ? nt : null;
}

/** Back to partner's suit with two cards or more, jumping to show the values for game. */
function preferenceBid(ctx: Ctx, hand: Hand, total: number): Bid | null {
  const partner = ctx.pictures[ctx.partner]!;
  const preference = favourite(hand, shownSuits(partner).filter((s) => hand.len[s] >= 2), 2);
  const low = preference ? at(ctx, preference) : null;
  if (!preference || !low) return null;
  return total >= GAME && low.level < gameLevel(preference) ? (at(ctx, preference, 1) ?? low) : low;
}

/** Looking for a fit with the values for game: a new suit, a long suit again, no trumps, or back to partner's suit. */
function explore(ctx: Ctx, hand: Hand, total: number): Call | null {
  const me = ctx.pictures[ctx.seat]!;
  const shown = [...shownSuits(me), ...shownSuits(ctx.pictures[ctx.partner]!)];
  const fresh = SUITS.filter((s) => !shown.includes(s) && !theirSuits(ctx).includes(s));
  const long = favourite(hand, shownSuits(me), 6);
  const again = long ? at(ctx, long) : null;
  const rebid = again && again.level <= 3 ? again : null;
  return newSuit(ctx, hand, fresh) ?? rebid ?? noTrumpsBid(ctx, hand, total) ?? preferenceBid(ctx, hand, total);
}

/** What the partnership is worth, and where the auction stands for it. */
type Standing = ReturnType<typeof partnership> & { readonly last: { seat: number; bid: Bid } | null; readonly ours: boolean };

/** Partner has chosen a game (and there is no slam), or doubled the other side for penalties: leave it there. */
function leaveIt(ctx: Ctx, st: Standing): boolean {
  if (st.ours && st.last && st.last.bid.level >= gameLevel(st.last.bid.strain) && st.sure < SMALL_SLAM) return true;
  const lastAction = ctx.auction.filter((t) => t.call.kind !== 'pass').at(-1);
  return lastAction?.seat === ctx.partner && lastAction.call.kind === 'double';
}

/** The strain to play in: a major fit, no trumps with the values and the other side's suits stopped, or a minor fit. */
function strainFor(ctx: Ctx, hand: Hand, st: Standing): Strain | null {
  const { fit, total, partner } = st;
  if (fit && isMajor(fit)) return fit;
  const stoppers = theirSuits(ctx).every((s) => stopped(hand, s));
  const evenly = hand.balanced || partner.balanced || !fit || total < GAME + 4;
  return total >= INVITE && stoppers && evenly ? 'NT' : fit;
}

/** Bidding towards the contract the points are worth in `strain`: straight there, or for a part score no higher than needed. */
function bidTowards(ctx: Ctx, st: Standing, strain: Strain): Call {
  const level = targetLevel(st.total, st.sure, strain, st.fitLength);
  const sameStrain = st.ours && st.last?.bid.strain === strain;
  if (sameStrain && st.last!.bid.level >= level) return PASS;
  const target = bid(level, strain);
  if (!callAllowed(ctx.auction, ctx.seat, target)) return penaltyDouble(ctx, st.total) ?? PASS;
  return st.total >= INVITE ? target : partScore(ctx, st, strain, level, sameStrain);
}

/** A part score: no higher than `level`, and not at all if the contract is already ours and playable. */
function partScore(ctx: Ctx, st: Standing, strain: Strain, level: number, sameStrain: boolean): Call {
  if (st.ours && (sameStrain || !forced(ctx))) return PASS;
  const low = at(ctx, strain);
  return low && low.level <= level ? low : PASS;
}

/** No fit yet: explore with the values for game (or when asked to), compete with a long suit, or double. */
function withoutFit(ctx: Ctx, hand: Hand, st: Standing): Call {
  const explored = st.total >= INVITE || forced(ctx) ? explore(ctx, hand, st.total) : null;
  if (explored) return explored;
  if (st.ours) return PASS;
  return longSuit(ctx, hand) ?? penaltyDouble(ctx, st.total) ?? PASS;
}

/** Competing with a six-card suit of your own, at the two level at most, with 10 points or more. */
function longSuit(ctx: Ctx, hand: Hand): Bid | null {
  const long = favourite(hand, SUITS.filter((s) => !theirSuits(ctx).includes(s)), 6);
  const b = long ? at(ctx, long) : null;
  return b && b.level <= 2 && hand.pts >= 10 ? b : null;
}

/** A player on their own: aims for the contract the partnership's points and fit are worth. */
function plan(ctx: Ctx, hand: Hand): Call {
  const last = lastBid(ctx.auction);
  const st: Standing = { ...partnership(ctx, hand), last, ours: last !== null && !isOpponent(ctx, last.seat) };
  if (leaveIt(ctx, st)) return PASS;
  const strain = strainFor(ctx, hand, st);
  return strain ? bidTowards(ctx, st, strain) : withoutFit(ctx, hand, st);
}

/**
 * The points a bid made on a player's own shows, given `est`, what they took partner to have: enough for a slam, a
 * game, or to invite one (three of a suit or 2NT, with no bid from the other side in between).
 */
function pointsShown(ctx: Ctx, call: Bid, est: number): Shows {
  if (call.level >= 6) return { min: SMALL_SLAM - est };
  if (call.level >= gameLevel(call.strain)) return { min: GAME - est };
  const last = lastBid(ctx.auction);
  const invites = call.level === (call.strain === 'NT' ? 2 : 3) && last !== null && !isOpponent(ctx, last.seat);
  return invites ? { min: INVITE - est, max: GAME - est } : {};
}

/** The cards a suit bid made on a player's own shows: support for partner's suit, a longer suit again, or four. */
function lengthShown(ctx: Ctx, suit: Suit): number {
  const partner = ctx.pictures[ctx.partner]!.len[suit];
  const mine = ctx.pictures[ctx.seat]!.len[suit];
  if (partner >= 3) return Math.max(2, 8 - partner);
  return mine >= 4 ? Math.min(6, mine + 1) : 4;
}

/** What a call made on a player's own (by `plan`) tells the others. */
function planShows(ctx: Ctx, call: Call): Shows {
  const est = estimate(ctx.pictures[ctx.partner]!);
  if (call.kind === 'pass') {
    // Passing below game: not enough for partner to go on.
    const last = lastBid(ctx.auction);
    const ours = last !== null && !isOpponent(ctx, last.seat);
    return ours && last.bid.level < gameLevel(last.bid.strain) ? { max: Math.max(0, INVITE - est) } : {};
  }
  if (call.kind !== 'bid') return {};
  const points = pointsShown(ctx, call, est);
  return call.strain === 'NT' ? points : { ...points, len: { [call.strain]: lengthShown(ctx, call.strain) } };
}

/** The context for the player about to call after `auction`, with what each player's calls have shown. */
function contextAfter(auction: readonly Turn[]): Ctx {
  let pictures: Picture[] = Array.from({ length: PLAYERS }, unknown);
  for (let i = 0; i < auction.length; i++) {
    const { seat, call } = auction[i]!;
    const ctx: Ctx = { auction: auction.slice(0, i), seat, partner: partnerOf(seat), pictures };
    const shows = meaning(ctx, call);
    pictures = pictures.map((p, s) => (s === seat ? learn(p, shows) : p));
  }
  const seat = auction.length === 0 ? -1 : (auction.at(-1)!.seat + 1) % PLAYERS;
  return { auction, seat, partner: partnerOf(seat), pictures };
}

/** What a call shows, read the way the computer players would have meant it. */
function meaning(ctx: Ctx, call: Call): Shows {
  const options = situation(ctx);
  if (!options) return planShows(ctx, call);
  const same = options.filter((o) => sameCall(o.call, call));
  // A call with more than one meaning shows only what they have in common.
  if (same.length === 0) return planShows(ctx, call);
  const [firstShows, ...rest] = same.map((o) => o.shows);
  return rest.reduce<Shows>((a, b) => ({
    min: Math.min(a.min ?? 0, b.min ?? 0),
    max: Math.max(a.max ?? DECK_POINTS, b.max ?? DECK_POINTS),
    len: Object.fromEntries(SUITS.map((s) => [s, Math.min(a.len?.[s] ?? 0, b.len?.[s] ?? 0)])),
    balanced: (a.balanced ?? false) && (b.balanced ?? false),
  }), firstShows!);
}

export const sameCall = (a: Call, b: Call): boolean =>
  a.kind === b.kind && (a.kind !== 'bid' || (b.kind === 'bid' && a.level === b.level && a.strain === b.strain));

/** The call the player whose turn it is would make with their cards. */
export function chooseCall(state: GameState): Call {
  const base = contextAfter(state.auction);
  const ctx: Ctx = { ...base, seat: state.toPlay, partner: partnerOf(state.toPlay) };
  const hand = evaluate(state.players[state.toPlay]!.hand);
  const options = situation(ctx);
  const chosen = options?.find((o) => o.when(hand))?.call ?? plan(ctx, hand);
  return callAllowed(ctx.auction, ctx.seat, chosen) ? chosen : PASS;
}

/** What everyone can tell of each player's hand from the auction so far, by seat. */
export const picturesOf = (auction: readonly Turn[]): readonly Picture[] => contextAfter(auction).pictures;
