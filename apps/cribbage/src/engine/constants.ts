/** Players at the table: you (seat 0, at the bottom) and one computer player (seat 1, across from you). */
export const PLAYERS = 2;
export const HUMAN_SEAT = 0;
export const BOT_SEAT = 1;

/** Cards each player is dealt... */
export const DEAL_SIZE = 6;
/** ...of which each puts this many face down in the crib, keeping the rest for the play and the show. */
export const DISCARDS = 2;

/** The count in the play may never go over this. */
export const MAX_COUNT = 31;

/** The first to peg this many points wins, at once, even in the middle of a hand. */
export const GAME_POINTS = 121;
/** A loser who has not reached this many points is skunked: they have not passed the skunk line on the board. */
export const SKUNK_LINE = 91;

/** The computer player, with a skill from 0 to 1: a less skilled player more often makes a careless move. */
export const BOT = { name: 'Ruth', skill: 0.85 } as const;
