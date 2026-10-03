/** Players at the table: you (seat 0, South) and three computer players, clockwise from you. */
export const PLAYERS = 4;
export const HUMAN_SEAT = 0;
/** Your partner sits across the table from you (North). */
export const PARTNER_SEAT = 2;

/** Cards each player is dealt, and so the tricks in a hand. */
export const HAND_SIZE = 13;
/** The first six tricks the declaring side takes (the book) do not count towards its contract. */
export const BOOK = 6;
/** The highest level of a bid: seven, all thirteen tricks. */
export const MAX_LEVEL = 7;

/** Contract points for each trick bid and made, over the book: clubs and diamonds (minors), hearts and spades (majors). */
export const MINOR_TRICK = 20;
export const MAJOR_TRICK = 30;
/** No trumps: 40 for the first trick, 30 for each after it. */
export const NO_TRUMP_FIRST = 40;
export const NO_TRUMP_TRICK = 30;

/** A game is won by scoring this many contract points below the line, in one hand or several. */
export const GAME_POINTS = 100;
/** The rubber is won by the first side to win two games, for this bonus: more if the other side won none. */
export const GAMES_TO_WIN = 2;
export const RUBBER_BONUS_TWO_NIL = 700;
export const RUBBER_BONUS_TWO_ONE = 500;

/** Bonuses for bidding and making a slam: twelve tricks (small) or all thirteen (grand), not vulnerable and vulnerable. */
export const SMALL_SLAM = [500, 750] as const;
export const GRAND_SLAM = [1000, 1500] as const;

/** For making a contract that was doubled or redoubled (the "insult"). */
export const INSULT = [0, 50, 100] as const;

/** Each overtrick when doubled, not vulnerable and vulnerable (twice as much redoubled). */
export const DOUBLED_OVERTRICK = [100, 200] as const;

/** Each undertrick, undoubled, not vulnerable and vulnerable. */
export const UNDERTRICK = [50, 100] as const;

/** Honours held in one hand: four or all five of the trumps' ace, king, queen, jack and ten, or all four aces at no trumps. */
export const FOUR_HONOURS = 100;
export const FIVE_HONOURS = 150;
export const FOUR_ACES = 150;

/**
 * The computer players, in seat order from seat 1 (on your left, West), each with a skill from 0 to 1. A less
 * skilled player more often plays a careless card instead of a thought-out one. Seat 2 is your partner (North).
 */
export const BOTS = [
  { name: 'Arjun', skill: 0.95 },
  { name: 'Helen', skill: 0.98 },
  { name: 'Mei', skill: 0.95 },
] as const;
