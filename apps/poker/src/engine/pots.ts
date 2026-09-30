import type { Pot, Seat } from './types';

/**
 * The pots at the end of a hand. Each all-in level makes its own pot: the main pot is what
 * everyone could match up to the smallest stack, then a side pot for each bigger stack. Chips
 * from a seat that has folded stay in the pot but cannot win it.
 */
export function buildPots(seats: readonly Seat[]): Pot[] {
  const levels = [...new Set(seats.map((s) => s.total).filter((t) => t > 0))].sort((a, b) => a - b);
  const pots: Pot[] = [];
  let previous = 0;
  for (const level of levels) {
    const contributors = seats.filter((s) => s.total >= level);
    const amount = contributors.length * (level - previous);
    const eligible = contributors.filter((s) => !s.folded).map((s) => s.id);
    previous = level;
    const last = pots.at(-1);
    if (eligible.length === 0) {
      // Only folded seats reached this level; their chips join the pot below.
      if (last) pots[pots.length - 1] = { ...last, amount: last.amount + amount };
    } else if (last && !last.uncalled && contributors.length > 1 && last.eligible.join() === eligible.join()) {
      // The same seats can win as in the pot below (a folded seat's level), so it is one pot.
      pots[pots.length - 1] = { ...last, amount: last.amount + amount };
    } else {
      pots.push({ amount, eligible, uncalled: contributors.length === 1 });
    }
  }
  return pots;
}
