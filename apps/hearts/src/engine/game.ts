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
  takeTrick,
} from '@card-games/cards-core';
import { BOTS, GAME_OVER_SCORE, HAND_SIZE, HUMAN_SEAT, PASS_SIZE, PLAYERS, POINTS_PER_HAND, QUEEN_POINTS } from './constants';
import type { Card, Direction, GameState, Play, Player, Suit } from './types';

export { cardKey, rankValue };
/** The order suits are sorted in a hand: alternating black and red, as most players hold them. */
const SUIT_ORDER: Record<Suit, number> = { C: 0, D: 1, S: 2, H: 3 };
const DIRECTIONS: readonly Direction[] = ['left', 'right', 'across', 'keep'];
const SEAT_STEP: Record<Direction, number> = { left: 1, across: 2, right: 3, keep: 0 };

export const isQueenOfSpades = (card: Card): boolean => card.rank === 'Q' && card.suit === 'S';
const isTwoOfClubs = (card: Card): boolean => card.rank === '2' && card.suit === 'C';
const isPointCard = (card: Card): boolean => card.suit === 'H' || isQueenOfSpades(card);

/** The points in some cards: one for each heart, thirteen for the queen of spades. */
export function pointsIn(cards: readonly Card[]): number {
  return cards.reduce((sum, card) => sum + (card.suit === 'H' ? 1 : isQueenOfSpades(card) ? QUEEN_POINTS : 0), 0);
}

export const sortHand = (cards: readonly Card[]): Card[] => sortBySuit(cards, SUIT_ORDER);

/** Which way the cards go in hand number `hand` (from 1): left, right, across, then a hand with no passing. */
export function directionFor(hand: number): Direction {
  return DIRECTIONS[(hand - 1) % DIRECTIONS.length] as Direction;
}

/** The seat that `seat` passes its cards to (itself when nobody passes). */
export function passTarget(seat: number, direction: Direction): number {
  return (seat + SEAT_STEP[direction]) % PLAYERS;
}

/** The seat that passes its cards to `seat`. */
export function passSource(seat: number, direction: Direction): number {
  return (seat - SEAT_STEP[direction] + PLAYERS) % PLAYERS;
}

/** The seat holding the two of clubs, who leads the first trick. */
function holderOfTwoOfClubs(players: readonly Player[]): number {
  return players.findIndex((p) => p.hand.some(isTwoOfClubs));
}

/** Deals hand number `hand` to the players, keeping their scores. */
function deal(base: Omit<GameState, 'players'>, players: readonly Player[], hand: number, randomInt: RandomInt): GameState {
  // Nobody deals in Hearts, so the cards go round from your left, as if the player on your right dealt.
  const hands = dealHands(PLAYERS - 1, randomInt);
  const dealt = players.map((p) => ({
    ...p,
    hand: sortHand(hands[p.id]!),
    received: [],
    taken: [],
  }));
  const direction = directionFor(hand);
  const passing = direction !== 'keep';
  return {
    ...base,
    phase: passing ? 'passing' : 'playing',
    hand,
    direction,
    players: dealt,
    trick: [],
    toPlay: passing ? -1 : holderOfTwoOfClubs(dealt),
    tricksPlayed: 0,
    heartsBroken: false,
    winner: -1,
    result: null,
  };
}

/** A new game: everyone on 0 points, and the first hand dealt. */
export function newGame(randomInt: RandomInt = secureRandomInt): GameState {
  const players: Player[] = seatPlayers(BOTS).map((p) => ({ ...p, received: [], taken: [], score: 0 }));
  const blank: Omit<GameState, 'players'> = {
    phase: 'settled',
    hand: 0,
    direction: 'left',
    trick: [],
    toPlay: -1,
    tricksPlayed: 0,
    heartsBroken: false,
    winner: -1,
    result: null,
    history: [],
  };
  return deal(blank, players, 1, randomInt);
}

/** The game is over once a hand ends with anyone at GAME_OVER_SCORE or more. */
export function isGameOver(state: GameState): boolean {
  return state.phase === 'settled' && state.players.some((p) => p.score >= GAME_OVER_SCORE);
}

/** The players with the lowest score: the winners, once the game is over (a tie shares the win). */
export function leaders(state: GameState): number[] {
  const lowest = Math.min(...state.players.map((p) => p.score));
  return state.players.filter((p) => p.score === lowest).map((p) => p.id);
}

/** You have won (or shared the win of) a finished game. */
export function hasWon(state: GameState): boolean {
  return isGameOver(state) && leaders(state).includes(HUMAN_SEAT);
}

/** The next hand, once this one has been scored. */
export function nextHand(state: GameState, randomInt: RandomInt = secureRandomInt): GameState {
  if (state.phase !== 'settled') throw new Error('The hand is not over yet');
  if (isGameOver(state)) throw new Error('The game is over');
  return deal(state, state.players, state.hand + 1, randomInt);
}

/**
 * Passes cards: `picks[seat]` are the PASS_SIZE cards that seat passes on. Each player receives
 * theirs from the seat that passes to them, and then the holder of the two of clubs leads.
 */
export function passCards(state: GameState, picks: readonly (readonly Card[])[]): GameState {
  if (state.phase !== 'passing') throw new Error('Not passing now');
  const outgoing = state.players.map((player) => {
    const pick = picks[player.id] ?? [];
    const keys = new Set(pick.map(cardKey));
    if (pick.length !== PASS_SIZE || keys.size !== PASS_SIZE || !pick.every((c) => player.hand.some((h) => cardKey(h) === cardKey(c)))) {
      throw new Error(`${player.name} must pass ${PASS_SIZE} different cards from their hand`);
    }
    return keys;
  });
  const players = state.players.map((player) => {
    const from = passSource(player.id, state.direction);
    const received = state.players[from]!.hand.filter((c) => outgoing[from]!.has(cardKey(c)));
    const kept = player.hand.filter((c) => !outgoing[player.id]!.has(cardKey(c)));
    return { ...player, hand: sortHand([...kept, ...received]), received };
  });
  return { ...state, phase: 'playing', players, toPlay: holderOfTwoOfClubs(players) };
}

/**
 * The cards `seat` may play now. The first trick is led with the two of clubs, and nobody may play a
 * heart or the queen of spades on it unless they have nothing else. Players must follow the suit led
 * if they can. Hearts may not be led until one has been played, unless the leader has only hearts.
 */
export function legalCards(state: GameState, seat = state.toPlay): Card[] {
  const hand = handToPlay(state, seat);
  if (!hand) return [];
  const firstTrick = state.tricksPlayed === 0;
  const led = state.trick[0]?.card.suit;
  if (!led) {
    if (firstTrick) return hand.filter(isTwoOfClubs);
    const notHearts = hand.filter((c) => c.suit !== 'H');
    return state.heartsBroken || notHearts.length === 0 ? [...hand] : notHearts;
  }
  const allowed = following(hand, led);
  if (firstTrick && !allowed.some((c) => c.suit === led)) {
    const safe = hand.filter((c) => !isPointCard(c));
    if (safe.length > 0) return safe;
  }
  return allowed;
}

/** The seat that wins a complete trick: whoever played the highest card of the suit led. */
export function trickWinner(trick: readonly Play[]): number {
  const led = trick[0]?.card.suit;
  let best = trick[0];
  for (const play of trick) {
    if (play.card.suit === led && best && rankValue(play.card) > rankValue(best.card)) best = play;
  }
  return best?.seat ?? -1;
}

/** The seat whose turn it is plays a card. The fourth card completes the trick, ready to be collected. */
export function playCard(state: GameState, card: Card): GameState {
  const { players, trick } = addToTrick(state, card, legalCards(state));
  const heartsBroken = state.heartsBroken || card.suit === 'H';
  if (trick.length < PLAYERS) {
    return { ...state, players, trick, heartsBroken, toPlay: nextSeat(state.toPlay) };
  }
  return { ...state, phase: 'collecting', players, trick, heartsBroken, toPlay: -1, winner: trickWinner(trick) };
}

/** Scores a finished hand. Taking every point shoots the moon: 0 for the shooter and 26 for everyone else. */
function score(state: GameState): GameState {
  const taken = state.players.map((p) => pointsIn(p.taken));
  const moon = taken.findIndex((points) => points === POINTS_PER_HAND);
  const points = moon >= 0 ? taken.map((_, seat) => (seat === moon ? 0 : POINTS_PER_HAND)) : taken;
  return {
    ...state,
    phase: 'settled',
    toPlay: -1,
    players: state.players.map((p) => ({ ...p, score: p.score + (points[p.id] ?? 0) })),
    result: { points, moon: moon >= 0 ? moon : null },
    history: [...state.history, points],
  };
}

/** The winner of the complete trick takes it and leads the next, or the hand is over and scored. */
export function collect(state: GameState): GameState {
  const cards = state.trick.map((p) => p.card);
  const next: GameState = {
    ...state,
    ...takeTrick(state, (p) => ({ ...p, taken: [...p.taken, ...cards] })),
    tricksPlayed: state.tricksPlayed + 1,
  };
  return next.tricksPlayed === HAND_SIZE ? score(next) : next;
}

/** It is a computer player's turn: to play a card, or (as everyone passes at once) never while passing. */
export function isBotTurn(state: GameState): boolean {
  return state.phase === 'playing' && state.toPlay !== HUMAN_SEAT && state.toPlay >= 0;
}
