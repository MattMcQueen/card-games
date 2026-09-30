import { HUMAN_SEAT, type GameState } from '../engine';

export interface Banner {
  /** Whether it is good news for you. */
  readonly tone: 'win' | 'lose';
  /** Who took the pots: "You win 240", "Terry wins 120", or one clause for each seat when several won. */
  readonly main: string;
  /** How they won: the winning hand, or that everyone else folded. */
  readonly sub: string;
}

/** The result of a settled hand, once it is being shown. */
export function bannerFor(game: GameState, revealed: boolean): Banner | null {
  if (!revealed) return null;
  const wins = game.log.filter((e) => e.kind === 'win');
  const [first] = wins;
  if (!first) return null;
  const main = wins
    .map((w) => `${game.seats[w.seat]?.name} ${w.seat === HUMAN_SEAT ? 'win' : 'wins'} ${w.amount}`)
    .join(' · ');
  return {
    tone: wins.some((w) => w.seat === HUMAN_SEAT) ? 'win' : 'lose',
    main,
    sub: game.showdown ? (game.results[first.seat]?.rank?.name ?? '') : 'Everyone else folded',
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
