export const DENOMINATIONS = [20, 10, 5, 1] as const;
export type Denomination = (typeof DENOMINATIONS)[number];

/** The fewest chips that make up an amount, largest first: 37 is 20, 10, 5, 1, 1. */
export function chipsFor(amount: number): Denomination[] {
  const chips: Denomination[] = [];
  let left = Math.max(0, Math.floor(amount));
  for (const value of DENOMINATIONS) {
    while (left >= value) {
      chips.push(value);
      left -= value;
    }
  }
  return chips;
}
