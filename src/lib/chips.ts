export const DENOMINATIONS = [500, 100, 25, 5, 1] as const;
export type Denomination = (typeof DENOMINATIONS)[number];

/**
 * The fewest chips that make up an amount, largest first: 137 is 100, 25, 5, 5, 1, 1. At most
 * `limit` are returned, so a huge pot stays a stack that fits on the table.
 */
export function chipsFor(amount: number, limit = 8): Denomination[] {
  const chips: Denomination[] = [];
  let left = Math.max(0, Math.floor(amount));
  for (const value of DENOMINATIONS) {
    while (left >= value && chips.length < limit) {
      chips.push(value);
      left -= value;
    }
  }
  return chips;
}
