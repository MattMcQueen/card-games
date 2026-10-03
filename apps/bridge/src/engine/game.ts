import {
  addToTrick,
  cardKey,
  dealHands,
  following,
  nextSeat,
  rankValue,
  seatPlayers,
  secureRandomInt,
  sortHand as sortBySuit,
  takeTrick,
  teamOf,
  type RandomInt,
} from '@card-games/cards-core';
import {
  BOOK,
  BOTS,
  DOUBLED_OVERTRICK,
  FIVE_HONOURS,
  FOUR_ACES,
  FOUR_HONOURS,
  GAME_POINTS,
  GAMES_TO_WIN,
  GRAND_SLAM,
  HAND_SIZE,
  HUMAN_SEAT,
  INSULT,
  MAJOR_TRICK,
  MAX_LEVEL,
  MINOR_TRICK,
  NO_TRUMP_FIRST,
  NO_TRUMP_TRICK,
  PLAYERS,
  RUBBER_BONUS_TWO_NIL,
  RUBBER_BONUS_TWO_ONE,
  SMALL_SLAM,
  UNDERTRICK,
} from './constants';
import type { Bid, Call, Card, Contract, Entry, GameState, HandResult, Play, Player, Strain, Suit, Team, Turn } from './types';

export { cardKey, rankValue };

/** The strains from lowest to highest: a bid outranks another at the same level if its strain is higher. */
export const STRAINS: readonly Strain[] = ['C', 'D', 'H', 'S', 'NT'];

/** The order suits are sorted in a hand: alternating black and red, spades on the right. */
const SUIT_ORDER: Record<Suit, number> = { C: 0, D: 1, H: 2, S: 3 };

export const sortHand = (cards: readonly Card[]): Card[] => sortBySuit(cards, SUIT_ORDER);

export { teamOf };

/** The player across the table. */
export const partnerOf = (seat: number): number => (seat + 2) % PLAYERS;

export const PASS: Call = { kind: 'pass' };
export const DOUBLE: Call = { kind: 'double' };
export const REDOUBLE: Call = { kind: 'redouble' };
export const bid = (level: number, strain: Strain): Bid => ({ kind: 'bid', level, strain });

/** A bid's place in the order of all 35 bids, from 1♣ (0) to 7NT (34). */
const bidRank = (b: Bid): number => (b.level - 1) * STRAINS.length + STRAINS.indexOf(b.strain);

/** A major suit: hearts or spades, worth 30 a trick. */
export const isMajor = (strain: Strain): boolean => strain === 'H' || strain === 'S';

/** Deals hand number `hand` with `dealer` dealing, keeping the rubber's scores. */
function deal(base: Omit<GameState, 'players' | 'dealt'>, players: readonly Player[], hand: number, dealer: number, randomInt: RandomInt): GameState {
  const hands = dealHands(dealer, randomInt).map(sortHand);
  return {
    ...base,
    phase: 'bidding',
    hand,
    dealer,
    players: players.map((p) => ({ ...p, hand: hands[p.id]!, tricks: 0 })),
    dealt: hands,
    auction: [],
    contract: null,
    trick: [],
    toPlay: dealer,
    taken: [],
    winner: -1,
    result: null,
  };
}

const freshTeams = (): Team[] => [
  { games: 0, partScore: 0, total: 0 },
  { games: 0, partScore: 0, total: 0 },
];

/** A new rubber: nothing scored, and the first hand dealt by you, so you make the first call. */
export function newGame(randomInt: RandomInt = secureRandomInt): GameState {
  const players: Player[] = seatPlayers(BOTS).map((p) => ({ ...p, tricks: 0 }));
  const blank: Omit<GameState, 'players' | 'dealt'> = {
    phase: 'settled',
    hand: 0,
    dealer: HUMAN_SEAT,
    auction: [],
    contract: null,
    trick: [],
    toPlay: -1,
    taken: [],
    winner: -1,
    teams: freshTeams(),
    result: null,
    history: [],
  };
  return deal(blank, players, 1, HUMAN_SEAT, randomInt);
}

/** The side that has won the rubber, once it is over; null while it goes on. */
export function winningTeam(state: GameState): number | null {
  if (state.phase !== 'settled') return null;
  const winner = state.teams.findIndex((t) => t.games >= GAMES_TO_WIN);
  return winner < 0 ? null : winner;
}

/** The next hand, once this one is over: the deal passes to the left. */
export function nextHand(state: GameState, randomInt: RandomInt = secureRandomInt): GameState {
  if (state.phase !== 'settled') throw new Error('The hand is not over yet');
  if (isGameOver(state)) throw new Error('The rubber is over');
  return deal(state, state.players, state.hand + 1, nextSeat(state.dealer), randomInt);
}

/** The rubber is over: a side has won two games. */
export const isGameOver = (state: GameState): boolean => state.phase === 'settled' && state.teams.some((t) => t.games >= GAMES_TO_WIN);

/** You and your partner have won the rubber. */
export const hasWon = (state: GameState): boolean => winningTeam(state) === teamOf(HUMAN_SEAT);

/** A side that has won a game in this rubber is vulnerable. */
export const isVulnerable = (state: GameState, team: number): boolean => (state.teams[team]?.games ?? 0) > 0;

/** The last bid of the auction so far, and who made it. */
export function lastBid(auction: readonly Turn[]): { seat: number; bid: Bid; index: number } | null {
  for (let index = auction.length - 1; index >= 0; index--) {
    const { seat, call } = auction[index]!;
    if (call.kind === 'bid') return { seat, bid: call, index };
  }
  return null;
}

/** The last call that was not a pass. */
function lastAction(auction: readonly Turn[]): Turn | undefined {
  for (let i = auction.length - 1; i >= 0; i--) if (auction[i]!.call.kind !== 'pass') return auction[i];
  return undefined;
}

/** Whether `seat` may make `call` after the calls of `auction`. */
export function callAllowed(auction: readonly Turn[], seat: number, call: Call): boolean {
  const action = lastAction(auction);
  const byOpponent = action !== undefined && teamOf(action.seat) !== teamOf(seat);
  switch (call.kind) {
    case 'pass':
      return true;
    case 'double':
      return byOpponent && action.call.kind === 'bid';
    case 'redouble':
      return byOpponent && action.call.kind === 'double';
    case 'bid': {
      if (!Number.isInteger(call.level) || call.level < 1 || call.level > MAX_LEVEL || !STRAINS.includes(call.strain)) return false;
      const last = lastBid(auction);
      return !last || bidRank(call) > bidRank(last.bid);
    }
  }
}

/** Whether `seat` may make `call` now. */
export const isLegalCall = (state: GameState, call: Call, seat = state.toPlay): boolean =>
  state.phase === 'bidding' && seat === state.toPlay && callAllowed(state.auction, seat, call);

/** The lowest bid in `strain` that is higher than the last bid, or null if there is none (above seven). */
export function cheapest(auction: readonly Turn[], strain: Strain): Bid | null {
  const last = lastBid(auction);
  for (let level = 1; level <= MAX_LEVEL; level++) {
    if (!last || bidRank(bid(level, strain)) > bidRank(last.bid)) return bid(level, strain);
  }
  return null;
}

/** The auction is over: four passes to start with (passed out), or three in a row after a bid. */
function auctionOver(auction: readonly Turn[]): boolean {
  if (auction.length < 4) return false;
  return auction.slice(-3).every((t) => t.call.kind === 'pass');
}

/** The contract the auction has reached: the last bid, doubled or redoubled, played by the first of its side to name its strain. */
export function contractOf(auction: readonly Turn[]): Contract | null {
  const last = lastBid(auction);
  if (!last) return null;
  const after = auction.slice(last.index + 1).map((t) => t.call.kind);
  const doubled = after.includes('redouble') ? 2 : after.includes('double') ? 1 : 0;
  const side = teamOf(last.seat);
  const declarer = auction.find((t) => teamOf(t.seat) === side && t.call.kind === 'bid' && t.call.strain === last.bid.strain)!.seat;
  return { level: last.bid.level, strain: last.bid.strain, doubled, declarer };
}

/** The player whose turn it is makes `call`. When the auction is over, the player on the declarer's left leads. */
export function makeCall(state: GameState, call: Call): GameState {
  if (!isLegalCall(state, call)) throw new Error(`${state.players[state.toPlay]?.name ?? 'Nobody'} may not make that call now`);
  const auction = [...state.auction, { seat: state.toPlay, call }];
  if (!auctionOver(auction)) return { ...state, auction, toPlay: nextSeat(state.toPlay) };
  const contract = contractOf(auction);
  if (!contract) return settle({ ...state, auction }, null);
  return { ...state, auction, contract, phase: 'playing', toPlay: nextSeat(contract.declarer) };
}

/** The dummy: the declarer's partner, whose cards are laid face up and played by the declarer. */
export const dummyOf = (contract: Contract | null): number => (contract ? partnerOf(contract.declarer) : -1);

/** Who chooses the card for `seat`: the declarer plays the dummy's cards. */
export const controllerOf = (state: GameState, seat: number): number => (seat === dummyOf(state.contract) ? state.contract!.declarer : seat);

/** The dummy's cards are face up for everyone, once the opening lead has been made. */
export const dummyShown = (state: GameState): boolean =>
  state.contract !== null && state.phase !== 'bidding' && (state.taken.length > 0 || state.trick.length > 0);

/** The trump suit, or null at no trumps. */
export const trumpsOf = (contract: Contract | null): Suit | null => (contract && contract.strain !== 'NT' ? contract.strain : null);

/** The cards `seat` may play now: the suit led if they hold any, otherwise any card. */
export function legalCards(state: GameState, seat = state.toPlay): Card[] {
  if (state.phase !== 'playing' || seat !== state.toPlay) return [];
  const hand = state.players[seat]?.hand ?? [];
  const led = state.trick[0]?.card.suit;
  return led ? following(hand, led) : [...hand];
}

/** The play winning a trick so far: the highest trump, or if there is none the highest card of the suit led. */
export function winningPlay(trick: readonly Play[], trumps: Suit | null): Play | undefined {
  const led = trick[0]?.card.suit;
  const beats = (a: Card, b: Card) => {
    const [ta, tb] = [a.suit === trumps, b.suit === trumps];
    if (ta !== tb) return ta;
    return a.suit === b.suit ? rankValue(a) > rankValue(b) : a.suit === led;
  };
  return trick.reduce<Play | undefined>((best, play) => (!best || beats(play.card, best.card) ? play : best), undefined);
}

/** The seat whose turn it is plays a card (from the dummy, if it is the dummy's turn). The fourth completes the trick. */
export function playCard(state: GameState, card: Card): GameState {
  const { players, trick } = addToTrick(state, card, legalCards(state));
  if (trick.length < PLAYERS) return { ...state, players, trick, toPlay: nextSeat(state.toPlay) };
  const winner = winningPlay(trick, trumpsOf(state.contract))!.seat;
  return { ...state, phase: 'collecting', players, trick, toPlay: -1, winner };
}

/** The winner of the complete trick takes it and leads the next, or the hand is over and scored. */
export function collect(state: GameState): GameState {
  const next: GameState = { ...state, ...takeTrick(state, (p) => ({ ...p, tricks: p.tricks + 1 })), taken: [...state.taken, state.trick] };
  return next.taken.length === HAND_SIZE ? settle(next, next.contract) : next;
}

/** The tricks a side has taken this hand. */
export const sideTricks = (state: GameState, team: number): number =>
  state.players.filter((p) => teamOf(p.id) === team).reduce((sum, p) => sum + p.tricks, 0);

/** Contract points for `tricks` bid and made over the book, undoubled. */
export function trickPoints(strain: Strain, tricks: number): number {
  if (tricks <= 0) return 0;
  if (strain === 'NT') return NO_TRUMP_FIRST + (tricks - 1) * NO_TRUMP_TRICK;
  return tricks * (isMajor(strain) ? MAJOR_TRICK : MINOR_TRICK);
}

/** The penalty for `down` undertricks. */
export function undertrickPoints(down: number, doubled: 0 | 1 | 2, vulnerable: boolean): number {
  const v = vulnerable ? 1 : 0;
  if (doubled === 0) return down * UNDERTRICK[v];
  // Doubled: not vulnerable 100, then 200 for the second and third, then 300 each; vulnerable 200, then 300 each.
  const penalty = vulnerable ? 200 + 300 * (down - 1) : down === 1 ? 100 : down <= 3 ? 100 + 200 * (down - 1) : 500 + 300 * (down - 3);
  return penalty * doubled;
}

/** Honours in one hand, scored by its side whoever declared: four or five trump honours, or four aces at no trumps. */
export function honours(dealt: readonly (readonly Card[])[], strain: Strain): { team: number; points: number } | null {
  for (const [seat, hand] of dealt.entries()) {
    if (strain === 'NT') {
      if (hand.filter((c) => c.rank === 'A').length === 4) return { team: teamOf(seat), points: FOUR_ACES };
      continue;
    }
    const held = hand.filter((c) => c.suit === strain && rankValue(c) >= 10).length;
    if (held === 5) return { team: teamOf(seat), points: FIVE_HONOURS };
    if (held === 4) return { team: teamOf(seat), points: FOUR_HONOURS };
  }
  return null;
}

/** What each side scores for a contract played, given who is vulnerable. */
export function scoreContract(contract: Contract, tricks: number, vulnerable: readonly boolean[], dealt: readonly (readonly Card[])[]): Entry[] {
  const side = teamOf(contract.declarer);
  const vul = vulnerable[side] ? 1 : 0;
  const margin = tricks - BOOK - contract.level;
  const multiplier = 2 ** contract.doubled;
  const entries: Entry[] = [];
  const add = (team: number, below: boolean, points: number, kind: Entry['kind']) => {
    if (points > 0) entries.push({ team, below, points, kind });
  };
  if (margin >= 0) {
    add(side, true, trickPoints(contract.strain, contract.level) * multiplier, 'contract');
    const over = contract.doubled === 0 ? trickPoints(contract.strain, contract.level + margin) - trickPoints(contract.strain, contract.level) : margin * DOUBLED_OVERTRICK[vul] * contract.doubled;
    add(side, false, over, 'overtricks');
    add(side, false, contract.level === 7 ? GRAND_SLAM[vul] : contract.level === 6 ? SMALL_SLAM[vul] : 0, 'slam');
    add(side, false, INSULT[contract.doubled], 'insult');
  } else {
    add(1 - side, false, undertrickPoints(-margin, contract.doubled, vulnerable[side]!), 'undertricks');
  }
  const held = honours(dealt, contract.strain);
  if (held) add(held.team, false, held.points, 'honours');
  return entries;
}

/** Scores the hand (or a hand passed out, which scores nothing) and moves the rubber on: games, and the rubber bonus. */
function settle(state: GameState, contract: Contract | null): GameState {
  const tricks = contract ? sideTricks(state, teamOf(contract.declarer)) : 0;
  const vulnerable = state.teams.map((_, t) => isVulnerable(state, t));
  const entries = contract ? scoreContract(contract, tricks, vulnerable, state.dealt) : [];
  const pointsFor = (t: number, below: boolean) => entries.filter((e) => e.team === t && e.below === below).reduce((sum, e) => sum + e.points, 0);

  let teams = state.teams.map((team, t) => ({ ...team, partScore: team.partScore + pointsFor(t, true) }));
  // A side with a hundred below the line wins a game, and both sides start the next game from nothing.
  const game = teams.findIndex((t) => t.partScore >= GAME_POINTS);
  if (game >= 0) teams = teams.map((team, t) => ({ ...team, games: team.games + (t === game ? 1 : 0), partScore: 0 }));
  const rubber = teams.findIndex((t) => t.games >= GAMES_TO_WIN);
  if (rubber >= 0) {
    const bonus = teams[1 - rubber]!.games === 0 ? RUBBER_BONUS_TWO_NIL : RUBBER_BONUS_TWO_ONE;
    entries.push({ team: rubber, below: false, points: bonus, kind: 'rubber' });
  }
  teams = teams.map((team, t) => ({ ...team, total: team.total + pointsFor(t, true) + pointsFor(t, false) }));

  const result: HandResult = {
    contract,
    tricks,
    margin: contract ? tricks - BOOK - contract.level : 0,
    entries,
    game: game >= 0 ? game : null,
    rubber: rubber >= 0 ? rubber : null,
  };
  return { ...state, phase: 'settled', toPlay: -1, teams, result, history: [...state.history, result] };
}

/** It is a computer player's turn: to call, or to play a card (the dummy's cards are played by the declarer). */
export function isBotTurn(state: GameState): boolean {
  if (state.phase === 'bidding') return state.toPlay !== HUMAN_SEAT;
  return state.phase === 'playing' && controllerOf(state, state.toPlay) !== HUMAN_SEAT;
}

/** It is your turn: to call, or to play a card from your hand or (when you declare) the dummy. */
export const isYourTurn = (state: GameState): boolean =>
  (state.phase === 'bidding' || state.phase === 'playing') && state.toPlay >= 0 && !isBotTurn(state);
