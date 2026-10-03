import { YOUR_SEAT } from './tricks';

// For the games played by two partnerships, partners facing (Spades, Bridge): you and the player across from
// you (seats 0 and 2) against the players on your left and right (seats 1 and 3).

/** The partnership a seat plays for: 0 for you and your partner, 1 for the other two. */
export const teamOf = (seat: number): number => seat % 2;

/** A partnership's name: "You and Grace", "Omar and Lena". */
export function teamName(players: readonly { readonly name: string }[], team: number): string {
  return `${players[team]?.name ?? ''} and ${players[team + 2]?.name ?? ''}`;
}

/** The short name in the corner of the table and on the score sheet: "Us" and "Them". */
export const teamLabel = (team: number): string => (team === teamOf(YOUR_SEAT) ? 'Us' : 'Them');

/** Who won `what` ("the game", "the rubber"): "You and Grace win the game!", or for the others, with a full stop. */
export function winnersText(players: readonly { readonly name: string }[], winner: number, what: string): string {
  return `${teamName(players, winner)} win ${what}${winner === teamOf(YOUR_SEAT) ? '!' : '.'}`;
}
