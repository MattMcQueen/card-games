import { botSkills, highest, lowest, quickCard } from '@card-games/cards-core';
import { BOOK, BOTS } from './constants';
import { controllerOf, dummyOf, dummyShown, legalCards, partnerOf, rankValue, sideTricks, teamOf, trumpsOf, winningPlay } from './game';
import type { Card, GameState, Suit } from './types';

// The computer players' card play. They only use what a player at a real table would know: their own hand, the
// dummy once it is face up (the declarer sees it from the start, as its owner), the auction and the cards played
// so far. Each seat has a skill from 0 to 1, and a less skilled player more often plays a careless card (any card
// it may play) instead of a thought-out one.

const SUITS: readonly Suit[] = ['S', 'H', 'D', 'C'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

const { skillOf } = botSkills(BOTS);

const ofSuit = (cards: readonly Card[], suit: Suit) => cards.filter((c) => c.suit === suit);
const key = (c: Card) => c.rank + c.suit;

/** What the player choosing the card can see from where they sit. */
interface View {
  readonly state: GameState;
  /** The seat whose card is being played: the controller's own, or the dummy. */
  readonly seat: number;
  readonly hand: readonly Card[];
  readonly legal: readonly Card[];
  /** The partner's hand, when it can be seen: the declarer's or the dummy's, for the declarer. */
  readonly partnerHand: readonly Card[] | null;
  /** The dummy's hand, for a defender once it is face up. */
  readonly dummyHand: readonly Card[] | null;
  readonly trumps: Suit | null;
  readonly declaring: boolean;
  /** Cards neither seen nor played: the players this one cannot see hold them. */
  readonly unseen: readonly Card[];
}

function viewOf(state: GameState): View {
  const seat = state.toPlay;
  const controller = controllerOf(state, seat);
  const declarer = state.contract!.declarer;
  const dummy = dummyOf(state.contract);
  const declaring = teamOf(controller) === teamOf(declarer);
  const hand = state.players[seat]!.hand;
  const partnerHand = declaring ? state.players[partnerOf(seat)]!.hand : null;
  const dummyHand = !declaring && dummyShown(state) ? state.players[dummy]!.hand : null;
  const seen = [hand, partnerHand ?? [], dummyHand ?? [], state.trick.map((p) => p.card), state.taken.flatMap((t) => t.map((p) => p.card))].flat();
  const known = new Set(seen.map(key));
  const unseen = SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit }))).filter((c) => !known.has(key(c)));
  return { state, seat, hand, legal: legalCards(state), partnerHand, dummyHand, trumps: trumpsOf(state.contract), declaring, unseen };
}

/** No unseen card of its suit is higher: it wins a trick in its suit unless it is trumped. */
const isBoss = (view: View, card: Card) => !view.unseen.some((c) => c.suit === card.suit && rankValue(c) > rankValue(card));

/** Whether `card` would be winning the trick so far if played now. */
const wouldWin = (view: View, card: Card) => winningPlay([...view.state.trick, { seat: view.seat, card }], view.trumps)?.seat === view.seat;

/** The top card of a run of two or more touching honours (such as K from K-Q-x), if the suit has one. */
function sequenceTop(cards: readonly Card[]): Card | null {
  const sorted = [...cards].sort((a, b) => rankValue(b) - rankValue(a));
  for (let i = 0; i + 1 < sorted.length; i++) {
    const [a, b] = [sorted[i]!, sorted[i + 1]!];
    if (rankValue(a) >= 11 && rankValue(a) - rankValue(b) === 1) return a;
  }
  return null;
}

/** The suits the partner of `seat` bid in the auction, most recent first. */
function partnersSuits(state: GameState, seat: number): Suit[] {
  const partner = partnerOf(seat);
  return state.auction.flatMap((t) => (t.seat === partner && t.call.kind === 'bid' && t.call.strain !== 'NT' ? [t.call.strain] : [])).reverse();
}

/** The suits the other side bid. */
function theirSuits(state: GameState, seat: number): Suit[] {
  return state.auction.flatMap((t) => (teamOf(t.seat) !== teamOf(seat) && t.call.kind === 'bid' && t.call.strain !== 'NT' ? [t.call.strain] : []));
}

/** The card to lead in a suit: the top of a doubleton or of touching honours, otherwise a low one (the fourth highest from four or more). */
function cardOf(cards: readonly Card[]): Card {
  if (cards.length <= 2) return highest(cards);
  const top = sequenceTop(cards);
  if (top) return top;
  const sorted = [...cards].sort((a, b) => rankValue(b) - rankValue(a));
  return sorted[Math.min(3, sorted.length - 1)]!;
}

/** The opening lead: partner's suit, the top of touching honours, a single card to ruff later, or a long suit. */
function openingLead(view: View): Card {
  const { hand, trumps, state, seat } = view;
  const side = SUITS.filter((s) => s !== trumps && ofSuit(hand, s).length > 0);
  const choices = side.length > 0 ? side : SUITS.filter((s) => ofSuit(hand, s).length > 0);
  const partners = partnersSuits(state, seat).find((s) => choices.includes(s));
  if (partners) return cardOf(ofSuit(hand, partners));
  const sequence = choices.find((s) => sequenceTop(ofSuit(hand, s)) !== null);
  if (sequence) return sequenceTop(ofSuit(hand, sequence))!;
  if (trumps && ofSuit(hand, trumps).length > 0 && ofSuit(hand, trumps).length <= 3) {
    const single = choices.find((s) => ofSuit(hand, s).length === 1);
    if (single) return ofSuit(hand, single)[0]!;
  }
  // A long suit the other side did not bid, without leading away from an ace in a trump contract.
  const theirs = theirSuits(state, seat);
  const fine = choices.filter((s) => !theirs.includes(s) && (!trumps || !ofSuit(hand, s).some((c) => c.rank === 'A')));
  const pool = fine.length > 0 ? fine : choices;
  const longest = pool.reduce((a, b) => (ofSuit(hand, b).length > ofSuit(hand, a).length ? b : a));
  return cardOf(ofSuit(hand, longest));
}

/** A defender's lead after the first trick: a winner, back to partner's suit, or a low card from a long suit. */
function defenderLead(view: View): Card {
  const { hand, trumps, state, seat } = view;
  const side = hand.filter((c) => c.suit !== trumps);
  const winners = side.filter((c) => isBoss(view, c));
  if (winners.length > 0) return highest(winners);
  // The suit partner led first.
  const partnerLed = state.taken.flatMap((t) => (t[0]?.seat === partnerOf(seat) ? [t[0].card.suit] : []))[0];
  if (partnerLed && ofSuit(hand, partnerLed).length > 0 && partnerLed !== trumps) {
    const cards = ofSuit(hand, partnerLed);
    return cards.length <= 2 ? highest(cards) : lowest(cards);
  }
  const pool = side.length > 0 ? side : hand;
  const length = (s: Suit) => ofSuit(hand, s).length;
  const dummyLength = (s: Suit) => (view.dummyHand ? ofSuit(view.dummyHand, s).length : 0);
  // Not into the dummy's long suit.
  return lowest(pool, (c) => rankValue(c) - length(c.suit) * 3 + dummyLength(c.suit) * 2);
}

/** Tricks a suit will take off the top for the declarer's side: cards higher than any the defenders hold, no more than the longer hand has. */
function topTricks(view: View, suit: Suit): number {
  const mine = ofSuit(view.hand, suit);
  const other = ofSuit(view.partnerHand ?? [], suit);
  const theirs = view.unseen.filter((c) => c.suit === suit);
  const best = theirs.length > 0 ? rankValue(highest(theirs)) : 0;
  const top = [...mine, ...other].filter((c) => rankValue(c) > best).length;
  return Math.min(top, Math.max(mine.length, other.length));
}

/** A loser to ruff: a suit the other hand has none of, while it still has a few trumps to ruff with (fewer than this hand). */
function ruffLead(view: View, trumps: Suit): Card | null {
  const other = view.partnerHand ?? [];
  const otherTrumps = ofSuit(other, trumps).length;
  if (otherTrumps === 0 || otherTrumps > 3 || ofSuit(view.hand, trumps).length <= otherTrumps) return null;
  const losers = (s: Suit) => ofSuit(view.hand, s).length > 0 && !ofSuit(view.hand, s).some((c) => isBoss(view, c));
  const ruffable = SUITS.find((s) => s !== trumps && ofSuit(other, s).length === 0 && losers(s));
  return ruffable ? lowest(ofSuit(view.hand, ruffable)) : null;
}

/** In a trump contract: ruff in the hand with fewer trumps, or draw the other side's trumps. */
function trumpLead(view: View, trumps: Suit): Card | null {
  const ruff = ruffLead(view, trumps);
  if (ruff) return ruff;
  const mine = ofSuit(view.hand, trumps);
  const otherTrumps = ofSuit(view.partnerHand ?? [], trumps).length;
  const theirTrumps = view.unseen.filter((c) => c.suit === trumps).length;
  if (theirTrumps === 0 || mine.length === 0 || mine.length + otherTrumps <= theirTrumps) return null;
  const bosses = mine.filter((c) => isBoss(view, c));
  return lowest(bosses.length > 0 ? bosses : mine);
}

/** The sure winners between the two hands are fewer than the tricks the declarer still needs. */
function shortOfTricks(view: View): boolean {
  const contract = view.state.contract!;
  const needed = BOOK + contract.level - sideTricks(view.state, teamOf(contract.declarer));
  return SUITS.reduce((sum, s) => sum + topTricks(view, s), 0) < needed;
}

/** Setting up a long suit (seven cards or more between the hands): its top winners first, from the shorter hand to unblock, then a low card. */
function establish(view: View): Card | null {
  const other = view.partnerHand ?? [];
  const length = (s: Suit) => ofSuit(view.hand, s).length + ofSuit(other, s).length;
  const longer = (s: Suit) => Math.max(ofSuit(view.hand, s).length, ofSuit(other, s).length);
  const candidates = SUITS.filter((s) => s !== view.trumps && ofSuit(view.hand, s).length > 0 && topTricks(view, s) < longer(s));
  if (candidates.length === 0) return null;
  const s = candidates.reduce((a, b) => (length(b) > length(a) ? b : a));
  if (length(s) < 7) return null;
  const cards = ofSuit(view.hand, s);
  const shorter = cards.length < ofSuit(other, s).length;
  const top = cards.filter((c) => isBoss(view, c));
  if (top.length > 0) return shorter ? highest(top) : lowest(top);
  const honours = cards.filter((c) => rankValue(c) >= 10);
  const othersTop = ofSuit(other, s).some((c) => isBoss(view, c));
  return shorter && honours.length > 0 && !othersTop ? highest(honours) : lowest(cards);
}

/** Taking winners (the short hand's first), leading towards the other hand's honours, or a low card from a long suit. */
function cashOrTowards(view: View): Card {
  const { hand, trumps } = view;
  const other = view.partnerHand ?? [];
  const cards = hand.filter((c) => c.suit !== trumps);
  const cash = cards.filter((c) => isBoss(view, c) && ofSuit(hand, c.suit).length <= Math.max(1, ofSuit(other, c.suit).length));
  if (cash.length > 0) return highest(cash);
  const towards = cards.find((c) => ofSuit(other, c.suit).some((o) => isBoss(view, o) || rankValue(o) >= 12));
  if (towards) return lowest(ofSuit(hand, towards.suit));
  const winners = cards.filter((c) => isBoss(view, c));
  if (winners.length > 0) return highest(winners);
  const length = (s: Suit) => ofSuit(hand, s).length + ofSuit(other, s).length;
  return lowest(cards.length > 0 ? cards : hand, (c) => rankValue(c) - length(c.suit) * 2);
}

/** The declarer's lead, from either hand: ruff in the short hand, draw trumps, set up a long suit, or cash winners. */
function declarerLead(view: View): Card {
  const trumping = view.trumps ? trumpLead(view, view.trumps) : null;
  if (trumping) return trumping;
  return (shortOfTricks(view) ? establish(view) : null) ?? cashOrTowards(view);
}

/** Partner is winning the trick, and will keep it: the last card, or the best card left and nobody can be seen to beat it. */
function partnerHolds(view: View): boolean {
  const { trick } = view.state;
  const best = winningPlay(trick, view.trumps)!;
  if (best.seat !== partnerOf(view.seat)) return false;
  if (trick.length === 3) return true;
  const next = (view.seat + 1) % 4;
  const nextHand = next === dummyOf(view.state.contract) && view.dummyHand ? view.dummyHand : null;
  if (nextHand) {
    const led = trick[0]!.card.suit;
    const legal = ofSuit(nextHand, led).length > 0 ? ofSuit(nextHand, led) : nextHand;
    return !legal.some((c) => winningPlay([...trick, { seat: view.seat, card: lowest(view.legal) }, { seat: next, card: c }], view.trumps)?.seat === next);
  }
  return best.card.suit === view.trumps || isBoss(view, best.card);
}

/** A card that will not win: the lowest of the suit led, or a low card from the least useful suit. */
function discard(view: View): Card {
  const { legal, hand, trumps } = view;
  const led = view.state.trick[0]?.card.suit;
  if (led && legal.some((c) => c.suit === led)) return lowest(legal);
  const spare = legal.filter((c) => c.suit !== trumps && !isBoss(view, c));
  const pool = spare.length > 0 ? spare : legal.filter((c) => c.suit !== trumps);
  if (pool.length === 0) return lowest(legal);
  return lowest(pool, (c) => rankValue(c) + ofSuit(hand, c.suit).length);
}

/** Second hand low. The declarer wins it now with a sure winner, unless the other hand, still to play, has one. */
function secondHand(view: View, winners: readonly Card[], led: Suit): Card {
  const sure = winners.filter((c) => isBoss(view, c));
  const otherHasOne = ofSuit(view.partnerHand ?? [], led).some((c) => isBoss(view, c));
  return view.declaring && sure.length > 0 && !otherHasOne ? lowest(sure) : lowest(view.legal);
}

/** Playing to a trick someone else led. */
function follow(view: View): Card {
  const winners = view.legal.filter((c) => wouldWin(view, c));
  if (partnerHolds(view) || winners.length === 0) return discard(view);
  const position = view.state.trick.length;
  const led = view.state.trick[0]!.card.suit;
  // Trumping, or last to play: as cheaply as will do.
  if (position === 3 || !view.legal.some((c) => c.suit === led)) return lowest(winners);
  if (position === 1) return secondHand(view, winners, led);
  // Third hand: the cheapest card nobody can beat, or the cheapest that wins for now.
  const sure = winners.filter((c) => isBoss(view, c));
  return lowest(sure.length > 0 ? sure : winners);
}

/** The card the computer player whose turn it is plays: from its own hand, or the dummy's if it is declaring. */
export function decide(state: GameState, random: () => number = Math.random): Card {
  const view = viewOf(state);
  const careless = quickCard(view.legal, skillOf(controllerOf(state, state.toPlay)), random);
  if (careless) return careless;
  if (view.state.trick.length > 0) return follow(view);
  if (view.declaring) return declarerLead(view);
  return state.taken.length === 0 ? openingLead(view) : defenderLead(view);
}
