import { BOT_SEAT, GAME_POINTS } from '../engine';

// The pegging board, laid out as a real one: each player's track runs out along the middle of the board, holes 1 to
// 60, and back along its edge, 61 to 120, to the game hole beside the start. The computer player's track is the top
// half and yours the bottom. Units are the SVG's.

/** Holes in each street: out along the middle, and back along the edge. */
const STREET = 60;
/** Across from one hole to the next, and the extra gap after every five. */
const STEP = 6;
const GAP = 3;
/** Where the first hole of a street is, and where the start and game holes are, across the board. */
const FIRST = 16;
const END = 6;
/** The height of each row: the computer player's back and out, then your out and back. */
const ROWS = [6, 13, 24, 31];

export const BOARD_WIDTH = FIRST + (STREET - 1) * STEP + (STREET / 5 - 1) * GAP + 6;
export const BOARD_HEIGHT = 37;

/** How far across the `column`-th hole of a street is (0 to 59, left to right). */
const across = (column: number): number => FIRST + column * STEP + Math.floor(column / 5) * GAP;

/** Where a seat's peg at `score` sits: 0 is the start hole, 121 the game hole. */
export function holeAt(seat: number, score: number): { x: number; y: number } {
  const [back, out] = seat === BOT_SEAT ? [ROWS[0]!, ROWS[1]!] : [ROWS[3]!, ROWS[2]!];
  if (score <= 0) return { x: END, y: out };
  if (score >= GAME_POINTS) return { x: END, y: back };
  return score <= STREET ? { x: across(score - 1), y: out } : { x: across(GAME_POINTS - 1 - score), y: back };
}

/** Every hole of a seat's track, 1 to 120. */
export const holesOf = (seat: number) => Array.from({ length: GAME_POINTS - 1 }, (_, i) => holeAt(seat, i + 1));

/** The ends: the start holes and the game holes. */
export const endHoles = [0, 1].flatMap((seat) => [holeAt(seat, 0), holeAt(seat, GAME_POINTS)]);

/** The skunk line, between holes 90 and 91 on the way back: where it crosses each back row. */
export function skunkLine(seat: number): { x: number; y: number } {
  const { x: x90, y } = holeAt(seat, 90);
  return { x: (x90 + holeAt(seat, 91).x) / 2, y };
}
