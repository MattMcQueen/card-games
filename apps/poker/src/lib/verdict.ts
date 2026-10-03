import { HUMAN_SEAT, type GameState } from '../engine';

export interface Banner {
  /** Whether it is good news for you. */
  readonly tone: 'win' | 'lose';
  /** Who took the pot: "You win 240", "Terry wins 120". When several won, you if you did, or else whoever won most. */
  readonly main: string;
  /** How they won (the winning hand, or that everyone else folded), or who else won when several did. */
  readonly sub: string;
}

/** Names joined in a list: "Priya", "Priya and Nigel", or a count when there are more. */
const others = (names: readonly string[]) => (names.length > 2 ? `${names.length} others` : names.join(' and '));

/**
 * The result of a settled hand, once it is being shown. When the pot was split, or side pots went to different
 * seats, it names one winner and who else won: each winner's seat shows what they took, and the banner stays
 * small enough to sit between the seats.
 */
export function bannerFor(game: GameState, revealed: boolean): Banner | null {
  if (!revealed) return null;
  // What each seat won, over all the pots, most first, and you first of all.
  const won = new Map<number, number>();
  for (const e of game.log) if (e.kind === 'win') won.set(e.seat, (won.get(e.seat) ?? 0) + e.amount);
  const winners = [...won].sort(([a, x], [b, y]) => Number(b === HUMAN_SEAT) - Number(a === HUMAN_SEAT) || y - x);
  const [first, ...rest] = winners;
  if (!first) return null;
  const [seat, amount] = first;
  const name = (s: number) => game.seats[s]?.name ?? '';
  const how = game.showdown ? (game.results[seat]?.rank?.name ?? '') : 'Everyone else folded';
  return {
    tone: seat === HUMAN_SEAT ? 'win' : 'lose',
    main: `${name(seat)} ${seat === HUMAN_SEAT ? 'win' : 'wins'} ${amount}`,
    sub: rest.length > 0 ? `${others(rest.map(([s]) => name(s)))} ${rest.length === 1 ? 'wins' : 'win'} too` : how,
  };
}

/**
 * At a showdown, the cards that make up the winning hands (as "AS", "10H"): the rest are darkened.
 * Nothing (null) if the result is not showing yet or there was no showdown.
 */
export function winningCards(game: GameState, revealed: boolean): ReadonlySet<string> | null {
  if (!revealed || !game.showdown) return null;
  const winners = new Set(game.pots.filter((p) => !p.uncalled).flatMap((p) => p.winners));
  const keep = new Set<string>();
  for (const id of winners) {
    for (const card of game.results[id]?.rank?.best ?? []) keep.add(card.rank + card.suit);
  }
  return keep;
}
