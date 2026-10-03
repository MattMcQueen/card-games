/** Players at the table: you (seat 0) and three computer players, clockwise from you. */
export const PLAYERS = 4;
export const HUMAN_SEAT = 0;
/** Your partner sits across the table from you. */
export const PARTNER_SEAT = 2;

/** Cards each player is dealt, and so the tricks in a hand. */
export const HAND_SIZE = 13;

/** A partnership that makes its bid scores this many points for each trick it bid... */
export const POINTS_PER_TRICK = 10;
/** ...and one point (a bag) for each trick over. */
export const POINTS_PER_BAG = 1;
/** Every this many bags a partnership has gathered costs it BAG_PENALTY points. */
export const BAGS_LIMIT = 10;
export const BAG_PENALTY = 100;
/** A player who bids nil scores this for their side if they take no tricks, and loses it if they take any. */
export const NIL_BONUS = 100;

/** The game ends once a hand ends with a partnership on this many points or more; the higher score wins. */
export const GAME_OVER_SCORE = 500;

/**
 * The computer players, in seat order from seat 1 (on your left), each with a skill from 0 to 1. A less
 * skilled player more often makes a careless move instead of a thought-out one. Seat 2 is your partner.
 */
export const BOTS = [
  { name: 'Omar', skill: 0.75 },
  { name: 'Grace', skill: 0.9 },
  { name: 'Lena', skill: 0.75 },
] as const;
