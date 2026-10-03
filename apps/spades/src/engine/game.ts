import {
  addToTrick,
  cardKey,
  dealHands,
  following,
  handToPlay,
  nextSeat,
  rankValue,
  seatPlayers,
  secureRandomInt,
  sortHand as sortBySuit,
  type RandomInt,
} from '@card-games/cards-core';
import {
  BAG_PENALTY,
  BAGS_LIMIT,
  BOTS,
  GAME_OVER_SCORE,
  HAND_SIZE,
  HUMAN_SEAT,
  NIL_BONUS,
  PLAYERS,
  POINTS_PER_BAG,
  POINTS_PER_TRICK,
} from './constants';
import type { Card, GameState, Play, Player, Suit, Team, TeamResult } from './types';

export { cardKey, rankValue };

/** The order suits are sorted in a hand: alternating black and red, with the trumps at the end. */
const SUIT_ORDER: Record<Suit, number> = { C: 0, D: 1, H: 2, S: 3 };

/** Spades are always trumps. */
export const isSpade = (card: Card): boolean => card.suit === 'S';

/** The partnership a seat plays for: 0 for you and your partner across the table, 1 for the other two. */
export const teamOf = (seat: number): number => seat % 2;

/** The seats of a partnership. */
export const seatsOf = (team: number): number[] => [team, team + 2];

export const sortHand = (cards: readonly Card[]): Card[] => sortBySuit(cards, SUIT_ORDER);

/** Deals hand number `hand` with `dealer` dealing, keeping the partnerships' scores. */
function deal(base: Omit<GameState, 'players'>, players: readonly Player[], hand: number, dealer: number, randomInt: RandomInt): GameState {
  const hands = dealHands(dealer, randomInt);
  const dealt = players.map((p) => ({
    ...p,
    hand: sortHand(hands[p.id]!),
    bid: null,
    tricks: 0,
  }));
  return {
    ...base,
    phase: 'bidding',
    hand,
    dealer,
    players: dealt,
    trick: [],
    toPlay: nextSeat(dealer),
    tricksPlayed: 0,
    played: [],
    spadesBroken: false,
    winner: -1,
    result: null,
  };
}

/** A new game: both partnerships on 0, and the first hand dealt by the player on your right, so you bid first. */
export function newGame(randomInt: RandomInt = secureRandomInt): GameState {
  const players: Player[] = seatPlayers(BOTS).map((p) => ({ ...p, bid: null, tricks: 0 }));
  const blank: Omit<GameState, 'players'> = {
    phase: 'settled',
    hand: 0,
    dealer: 0,
    teams: [
      { score: 0, bags: 0 },
      { score: 0, bags: 0 },
    ],
    trick: [],
    toPlay: -1,
    tricksPlayed: 0,
    played: [],
    spadesBroken: false,
    winner: -1,
    result: null,
    history: [],
  };
  return deal(blank, players, 1, (HUMAN_SEAT + PLAYERS - 1) % PLAYERS, randomInt);
}

/**
 * The partnership that has won, once a hand has ended with either on GAME_OVER_SCORE or more: the higher score.
 * Null while the game goes on, which it does if both pass the target with the same score.
 */
export function winningTeam(state: GameState): number | null {
  if (state.phase !== 'settled') return null;
  const [us, them] = state.teams.map((t) => t.score) as [number, number];
  if (Math.max(us, them) < GAME_OVER_SCORE || us === them) return null;
  return us > them ? 0 : 1;
}

export const isGameOver = (state: GameState): boolean => winningTeam(state) !== null;

/** You and your partner have won a finished game. */
export const hasWon = (state: GameState): boolean => winningTeam(state) === teamOf(HUMAN_SEAT);

/** The next hand, once this one has been scored: the deal passes to the left. */
export function nextHand(state: GameState, randomInt: RandomInt = secureRandomInt): GameState {
  if (state.phase !== 'settled') throw new Error('The hand is not over yet');
  if (isGameOver(state)) throw new Error('The game is over');
  return deal(state, state.players, state.hand + 1, nextSeat(state.dealer), randomInt);
}

/** The seat whose turn it is bids `tricks` (0 is nil). Once all four have bid, the player on the dealer's left leads. */
export function placeBid(state: GameState, tricks: number): GameState {
  if (state.phase !== 'bidding') throw new Error('Not bidding now');
  if (!Number.isInteger(tricks) || tricks < 0 || tricks > HAND_SIZE) throw new Error(`A bid is 0 to ${HAND_SIZE} tricks`);
  const seat = state.toPlay;
  const players = state.players.map((p) => (p.id === seat ? { ...p, bid: tricks } : p));
  const done = players.every((p) => p.bid !== null);
  return { ...state, players, phase: done ? 'playing' : 'bidding', toPlay: done ? nextSeat(state.dealer) : nextSeat(seat) };
}

/**
 * The cards `seat` may play now. Players must follow the suit led if they can, and otherwise may play
 * any card. Spades may not be led until one has been played, unless the leader has only spades.
 */
export function legalCards(state: GameState, seat = state.toPlay): Card[] {
  const hand = handToPlay(state, seat);
  if (!hand) return [];
  const led = state.trick[0]?.card.suit;
  if (!led) {
    const notSpades = hand.filter((c) => !isSpade(c));
    return state.spadesBroken || notSpades.length === 0 ? [...hand] : notSpades;
  }
  return following(hand, led);
}

/** The play winning a trick so far: the highest spade, or if there is none the highest card of the suit led. */
export function winningPlay(trick: readonly Play[]): Play | undefined {
  const led = trick[0]?.card.suit;
  const beats = (a: Card, b: Card) =>
    isSpade(a) !== isSpade(b) ? isSpade(a) : a.suit === b.suit ? rankValue(a) > rankValue(b) : a.suit === led;
  return trick.reduce<Play | undefined>((best, play) => (!best || beats(play.card, best.card) ? play : best), undefined);
}

/** The seat that wins a complete trick. */
export const trickWinner = (trick: readonly Play[]): number => winningPlay(trick)?.seat ?? -1;

/** The seat whose turn it is plays a card. The fourth card completes the trick, ready to be collected. */
export function playCard(state: GameState, card: Card): GameState {
  const { players, trick } = addToTrick(state, card, legalCards(state));
  const spadesBroken = state.spadesBroken || isSpade(card);
  if (trick.length < PLAYERS) {
    return { ...state, players, trick, spadesBroken, toPlay: nextSeat(state.toPlay) };
  }
  return { ...state, phase: 'collecting', players, trick, spadesBroken, toPlay: -1, winner: trickWinner(trick) };
}

/** How a hand went for one partnership, given the bags it had before. */
export function scoreTeam(players: readonly Player[], bagsBefore: number): TeamResult {
  const bid = players.reduce((sum, p) => sum + (p.bid ?? 0), 0);
  const tricks = players.reduce((sum, p) => sum + p.tricks, 0);
  const nil = players
    .filter((p) => p.bid === 0)
    .reduce((sum, p) => sum + (p.tricks === 0 ? NIL_BONUS : -NIL_BONUS), 0);
  const made = tricks >= bid;
  const contract = (made ? bid : -bid) * POINTS_PER_TRICK;
  const bags = made ? tricks - bid : 0;
  const penalty = 0 - Math.floor((bagsBefore + bags) / BAGS_LIMIT) * BAG_PENALTY;
  return { bid, tricks, contract, bags, nil, penalty, points: contract + bags * POINTS_PER_BAG + nil + penalty };
}

/** Scores a finished hand for both partnerships. */
function score(state: GameState): GameState {
  const result = state.teams.map((team, t) => scoreTeam(seatsOf(t).map((s) => state.players[s]!), team.bags));
  const teams: Team[] = state.teams.map((team, t) => ({
    score: team.score + result[t]!.points,
    bags: (team.bags + result[t]!.bags) % BAGS_LIMIT,
  }));
  return { ...state, phase: 'settled', toPlay: -1, teams, result, history: [...state.history, result] };
}

/** The winner of the complete trick takes it and leads the next, or the hand is over and scored. */
export function collect(state: GameState): GameState {
  if (state.phase !== 'collecting') throw new Error('No trick to collect');
  const winner = state.winner;
  const next: GameState = {
    ...state,
    phase: 'playing',
    players: state.players.map((p) => (p.id === winner ? { ...p, tricks: p.tricks + 1 } : p)),
    trick: [],
    toPlay: winner,
    tricksPlayed: state.tricksPlayed + 1,
    played: [...state.played, ...state.trick.map((p) => p.card)],
    winner: -1,
  };
  return next.tricksPlayed === HAND_SIZE ? score(next) : next;
}

/** It is a computer player's turn, to bid or to play. */
export function isBotTurn(state: GameState): boolean {
  return (state.phase === 'playing' || state.phase === 'bidding') && state.toPlay !== HUMAN_SEAT && state.toPlay >= 0;
}
