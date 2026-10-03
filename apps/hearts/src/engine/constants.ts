/** Players at the table: you (seat 0) and three computer players, clockwise from you. */
export const PLAYERS = 4;
export const HUMAN_SEAT = 0;

/** Cards each player is dealt, and so the tricks in a hand. */
export const HAND_SIZE = 13;
/** Cards passed before each hand (except every fourth, when nobody passes). */
export const PASS_SIZE = 3;

/** The game ends once anyone has this many points or more, and the lowest score wins. */
export const GAME_OVER_SCORE = 100;
/** Points in a hand: one for each heart and thirteen for the queen of spades. */
export const POINTS_PER_HAND = 26;
export const QUEEN_POINTS = 13;

/**
 * The computer players, in seat order from seat 1 (on your left), each with a skill from 0 to 1. A less
 * skilled player more often makes a careless move instead of a thought-out one.
 */
export const BOTS = [
  { name: 'Terry', skill: 0.5 },
  { name: 'Margaret', skill: 0.8 },
  { name: 'Priya', skill: 0.95 },
] as const;
