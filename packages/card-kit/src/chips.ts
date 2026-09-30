/** Every chip value a game can use; each has its own colours (Chip.svelte). */
export type Denomination = 1 | 5 | 10 | 20 | 25 | 100 | 500;

/** The chips a game uses, largest first, and the most shown in one stack, so a huge pot still fits on the table. */
export interface ChipSet {
  readonly values: readonly Denomination[];
  readonly limit?: number;
}

/** The fewest chips that make up an amount, largest first: 37 in 20s, 10s, 5s and 1s is 20, 10, 5, 1, 1. */
export function chipsFor(amount: number, { values, limit = Infinity }: ChipSet): Denomination[] {
  const chips: Denomination[] = [];
  let left = Math.max(0, Math.floor(amount));
  for (const value of values) {
    while (left >= value && chips.length < limit) {
      chips.push(value);
      left -= value;
    }
  }
  return chips;
}
