/** Seats at the table: you (seat 0) and five computer players. */
export const SEATS = 6;
export const HUMAN_SEAT = 0;

export const STARTING_STACK = 1000;
/** The blinds at the start. As in a tournament they double every HANDS_PER_LEVEL hands, so a game comes to an end. */
export const SMALL_BLIND = 5;
export const BIG_BLIND = 10;
export const HANDS_PER_LEVEL = 10;

/** The computer players, in seat order from seat 1. */
export const BOT_NAMES = ['Terry', 'Margaret', 'Nigel', 'Priya', 'Gary'] as const;
